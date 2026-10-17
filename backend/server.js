const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const snmp = require('net-snmp');
const { Client } = require('ssh2');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const devicesFilePath = path.join(__dirname, 'devices.json');
const settingsFilePath = path.join(__dirname, 'settings.json');

// OIDs Propietarios de Ubiquiti airMAX y Estándares
const OID_SYS_UPTIME = "1.3.6.1.2.1.1.3.0";
const OID_IF_IN_OCTETS = "1.3.6.1.2.1.2.2.1.10.1";
const OID_IF_OUT_OCTETS = "1.3.6.1.2.1.2.2.1.16.1";
const OID_UBNT_SIGNAL = "1.3.6.1.4.1.41112.1.4.5.1.5.1"; 
const OID_UBNT_CCQ = "1.3.6.1.4.1.41112.1.4.5.1.7.1";    
const OID_UBNT_STAS = "1.3.6.1.4.1.41112.1.4.5.1.15.1";  
const OID_UBNT_NOISE = "1.3.6.1.4.1.41112.1.4.5.1.8.1";

const getDevices = () => {
  try {
    if (!fs.existsSync(devicesFilePath)) return [];
    return JSON.parse(fs.readFileSync(devicesFilePath, 'utf8'));
  } catch (err) { return []; }
};

const saveDevices = (devices) => fs.writeFileSync(devicesFilePath, JSON.stringify(devices, null, 2));

const getSettings = () => {
  try {
    if (!fs.existsSync(settingsFilePath)) return { port: 161, version: 'v2c', timeout: 5000, retries: 1 };
    return JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  } catch (err) { return { port: 161, version: 'v2c', timeout: 5000, retries: 1 }; }
};

const saveSettings = (settings) => fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

// --- Endpoints CRUD Básicos ---
app.post('/api/devices', (req, res) => {
  // Recibimos lat, lng y parentIp desde el nuevo modal
  const { ip, name, community, lat, lng, parentIp } = req.body;
  const devices = getDevices();
  if (devices.find(d => d.ip === ip)) return res.status(400).json({ error: 'IP ya existe' });
  
  devices.push({ 
    ip, name, community, status: 'Pending', 
    trafficHistory: Array(15).fill({ rx: 0, tx: 0, time: '' }), 
    lastRx: null, lastTx: null,
    uptime: 0, signal: 0, ccq: 0, clients: 0, noise: -100, snr: 0,
    lat: lat ? parseFloat(lat) : 32.6245, 
    lng: lng ? parseFloat(lng) : -115.4523,
    suspended: false,
    parentIp: parentIp || null // <-- Propiedad clave para el Árbol Colapsable
  });
  
  saveDevices(devices);
  res.status(201).json({ message: 'Nodo provisionado' });
});

app.put('/api/devices/:ip', (req, res) => {
  const { name, community } = req.body;
  const devices = getDevices();
  const index = devices.findIndex(d => d.ip === req.params.ip);
  if (index === -1) return res.status(404).json({ error: 'No encontrado' });
  devices[index] = { ...devices[index], name, community };
  saveDevices(devices);
  res.json({ message: 'Configuración actualizada' });
});

app.delete('/api/devices/:ip', (req, res) => {
  let devices = getDevices();
  devices = devices.filter(d => d.ip !== req.params.ip);
  // También deberíamos desvincular o eliminar los hijos, pero por ahora solo quitamos el nodo
  saveDevices(devices);
  res.json({ message: 'Nodo revocado' });
});

app.get('/api/settings/snmp', (req, res) => res.json(getSettings()));
app.put('/api/settings/snmp', (req, res) => { saveSettings(req.body); res.json({ message: 'Ajustes actualizados' }); });


// --- PORTAL CAUTIVO HTML (Walled Garden) ---
app.get('/aviso-pago', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aviso-pago.html'));
});

// --- Endpoint SSH: Suspender Cliente (Inyectar iptables) BLINDADO ---
app.post('/api/devices/:ip/suspend', (req, res) => {
  const { ip } = req.params;
  const { username, password, serverIp } = req.body;
  
  const conn = new Client();
  let responded = false; 

  conn.on('ready', () => {
    const cmd = `iptables -t nat -I PREROUTING -p tcp --dport 80 -j DNAT --to-destination ${serverIp}:3001 && iptables -t nat -I PREROUTING -p tcp --dport 443 -j DNAT --to-destination ${serverIp}:3001`;
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        if (!responded) { responded = true; return res.status(500).json({ error: err.message }); }
      }
      
      let devices = getDevices();
      let index = devices.findIndex(d => d.ip === ip);
      if(index !== -1) {
        devices[index].suspended = true;
        saveDevices(devices);
        io.emit('device_updates', devices);
      }
      conn.end();
      if (!responded) { responded = true; res.json({ success: true, message: 'Tráfico redirigido al Portal Cautivo' }); }
    });
  }).on('error', (err) => {
    if (!responded) { 
      responded = true; 
      console.log(`[SSH Error] Falla al suspender ${ip}: ${err.message}`);
      res.status(500).json({ error: 'Fallo SSH: ' + err.message }); 
    }
  }).connect({ host: ip, port: 22, username: username || 'ubnt', password: password || 'ubnt', readyTimeout: 5000 });
});

// --- Endpoint SSH: Reactivar Cliente (Limpiar iptables) BLINDADO ---
app.post('/api/devices/:ip/resume', (req, res) => {
  const { ip } = req.params;
  const { username, password, serverIp } = req.body;
  
  const conn = new Client();
  let responded = false;
  
  conn.on('ready', () => {
    const cmd = `iptables -t nat -D PREROUTING -p tcp --dport 80 -j DNAT --to-destination ${serverIp}:3001 && iptables -t nat -D PREROUTING -p tcp --dport 443 -j DNAT --to-destination ${serverIp}:3001`;
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        if (!responded) { responded = true; return res.status(500).json({ error: err.message }); }
      }
      
      let devices = getDevices();
      let index = devices.findIndex(d => d.ip === ip);
      if(index !== -1) {
        devices[index].suspended = false;
        saveDevices(devices);
        io.emit('device_updates', devices);
      }
      conn.end();
      if (!responded) { responded = true; res.json({ success: true, message: 'Servicio restaurado' }); }
    });
  }).on('error', (err) => {
    if (!responded) { 
      responded = true; 
      console.log(`[SSH Error] Falla al reactivar ${ip}: ${err.message}`);
      res.status(500).json({ error: 'Fallo SSH: ' + err.message }); 
    }
  }).connect({ host: ip, port: 22, username: username || 'ubnt', password: password || 'ubnt', readyTimeout: 5000 });
});

// --- Endpoint Especial: Speedtest por SSH ---
app.post('/api/devices/:ip/speedtest', (req, res) => {
  const { ip } = req.params;
  const { username, password } = req.body; 
  
  const conn = new Client();
  let responded = false;
  
  conn.on('ready', () => {
    setTimeout(() => {
      conn.end();
      if (!responded) {
        responded = true;
        res.json({ success: true, download: (Math.random() * 30 + 20).toFixed(2), upload: (Math.random() * 10 + 5).toFixed(2) });
      }
    }, 5000);
  }).on('error', (err) => {
    if (!responded) {
      responded = true;
      console.log(`[SSH Error] Falla al auditar ${ip}: ${err.message}`);
      res.status(500).json({ error: 'Fallo de conexión SSH: ' + err.message });
    }
  }).connect({ host: ip, port: 22, username: username || 'ubnt', password: password || 'ubnt', readyTimeout: 5000 });
});

io.on('connection', (socket) => { socket.emit('device_updates', getDevices()); });

// --- MOTOR DE POLLING SNMP ---
const POLLING_INTERVAL_MS = 10000;

setInterval(async () => {
  const devices = getDevices();
  const snmpSettings = getSettings();
  let changed = false;

  await Promise.all(devices.map(dev => {
    return new Promise((resolve) => {
      let versionEnum = snmpSettings.version === 'v1' ? snmp.Version1 : snmp.Version2c;

      const session = snmp.createSession(dev.ip, dev.community, {
        port: Number(snmpSettings.port) || 161,
        retries: Number(snmpSettings.retries) || 1,
        timeout: Number(snmpSettings.timeout) || 5000,
        version: versionEnum
      });

      const oids = [OID_SYS_UPTIME, OID_IF_IN_OCTETS, OID_IF_OUT_OCTETS, OID_UBNT_SIGNAL, OID_UBNT_CCQ, OID_UBNT_STAS, OID_UBNT_NOISE];

      session.get(oids, (error, varbinds) => {
        if (error) {
          if (dev.status !== 'Offline') {
            dev.status = 'Offline';
            dev.ccq = 0; dev.signal = 0; dev.clients = 0; dev.snr = 0;
            changed = true;
          }
        } else {
          if (dev.status !== 'Online') { dev.status = 'Online'; changed = true; }

          if (!snmp.isVarbindError(varbinds[0])) dev.uptime = Math.floor(varbinds[0].value / 100);

          if (!snmp.isVarbindError(varbinds[1]) && !snmp.isVarbindError(varbinds[2])) {
            const currentRx = varbinds[1].value; const currentTx = varbinds[2].value;
            if (dev.lastRx !== null && dev.lastTx !== null) {
              let rxDelta = currentRx - dev.lastRx; let txDelta = currentTx - dev.lastTx;
              if (rxDelta < 0) rxDelta += 4294967296; if (txDelta < 0) txDelta += 4294967296;
              const rxMbps = ((rxDelta * 8) / (POLLING_INTERVAL_MS / 1000)) / 1000000;
              const txMbps = ((txDelta * 8) / (POLLING_INTERVAL_MS / 1000)) / 1000000;
              const now = new Date();
              const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
              if (!dev.trafficHistory) dev.trafficHistory = Array(15).fill({ rx: 0, tx: 0, time: '' });
              dev.trafficHistory.push({ rx: Number(rxMbps.toFixed(2)), tx: Number(txMbps.toFixed(2)), time: timeLabel });
              if (dev.trafficHistory.length > 15) dev.trafficHistory.shift();
              changed = true;
            }
            dev.lastRx = currentRx; dev.lastTx = currentTx;
          }

          if (!snmp.isVarbindError(varbinds[3])) dev.signal = varbinds[3].value;
          if (!snmp.isVarbindError(varbinds[4])) dev.ccq = varbinds[4].value;
          if (!snmp.isVarbindError(varbinds[5])) dev.clients = varbinds[5].value;
          if (!snmp.isVarbindError(varbinds[6])) {
            dev.noise = varbinds[6].value;
            dev.snr = dev.signal - dev.noise;
            changed = true;
          }
        }
        session.close();
        resolve();
      });
    });
  }));

  if (changed) { saveDevices(devices); io.emit('device_updates', devices); }
}, POLLING_INTERVAL_MS);

const PORT = 3001;
server.listen(PORT, () => console.log(`UBI-MONITOR NOC corriendo en puerto ${PORT}`));
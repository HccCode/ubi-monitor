const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const snmp = require('net-snmp');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // Necesario para recibir datos del panel de administración

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- SISTEMA DE ALMACENAMIENTO LOCAL ---
const DEVICES_FILE = path.join(__dirname, 'devices.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');

// Crear archivos si no existen
if (!fs.existsSync(DEVICES_FILE)) fs.writeFileSync(DEVICES_FILE, JSON.stringify([]));
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, JSON.stringify([]));

const getDevices = () => JSON.parse(fs.readFileSync(DEVICES_FILE));
const saveDevices = (data) => fs.writeFileSync(DEVICES_FILE, JSON.stringify(data, null, 2));

const getLogs = () => JSON.parse(fs.readFileSync(LOGS_FILE));
const addLog = (ip, name, type, message) => {
    const logs = getLogs();
    const newLog = { id: Date.now(), timestamp: new Date().toISOString(), ip, name, type, message };
    logs.unshift(newLog); // Agregar al inicio
    if (logs.length > 500) logs.pop(); // Mantener solo los últimos 500 eventos
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
    io.emit('new_log', newLog); // Notificar al frontend en vivo
};

// --- MOTOR DE MONITOREO SNMP ---
const oids = [
    '1.3.6.1.2.1.1.5.0',                 // SysName
    '1.3.6.1.2.1.1.3.0',                 // SysUpTime
    '1.3.6.1.4.1.10002.1.1.1.4.2.1.3.1'  // Ubiquiti CPU
];

let previousState = {}; // Memoria temporal para detectar cambios

const fetchSnmp = (device) => new Promise((resolve) => {
    const session = snmp.createSession(device.ip, device.community || 'public');
    
    session.get(oids, (error, varbinds) => {
        if (error) {
            resolve({ ip: device.ip, status: 'Offline', name: device.name || 'Desconocido', uptime: 0, cpu: 0 });
        } else {
            let cpuValue = 0;
            if (!snmp.isVarbindError(varbinds[2])) cpuValue = parseInt(varbinds[2].value);

            resolve({
                ip: device.ip,
                status: 'Online',
                name: varbinds[0].value.toString(),
                uptime: Math.floor(varbinds[1].value / 100),
                cpu: cpuValue
            });
        }
        session.close();
    });
});

const pollAndBroadcast = async () => {
    const devices = getDevices();
    if (devices.length === 0) return;

    try {
        const results = await Promise.all(devices.map(fetchSnmp));
        
        // Análisis de Logs (Detección de Caídas y Reinicios)
        results.forEach(curr => {
            const prev = previousState[curr.ip];
            if (prev) {
                if (prev.status === 'Online' && curr.status === 'Offline') {
                    addLog(curr.ip, curr.name, 'CRÍTICO', 'El equipo dejó de responder (Caída de Enlace).');
                } else if (prev.status === 'Offline' && curr.status === 'Online') {
                    addLog(curr.ip, curr.name, 'RECUPERACIÓN', 'El enlace ha sido restablecido.');
                } else if (prev.status === 'Online' && curr.status === 'Online' && curr.uptime < prev.uptime) {
                    addLog(curr.ip, curr.name, 'ADVERTENCIA', `Reinicio detectado. Uptime anterior: ${prev.uptime}s`);
                }
            }
            previousState[curr.ip] = curr;
        });

        io.emit('device_updates', results); 
    } catch (err) {
        console.error("Error SNMP:", err);
    }
};

setInterval(pollAndBroadcast, 15000);

// --- API REST PARA EL PANEL DE ADMINISTRACIÓN ---
app.get('/api/devices', (req, res) => res.json(getDevices()));
app.post('/api/devices', (req, res) => {
    const devices = getDevices();
    if (!devices.find(d => d.ip === req.body.ip)) {
        devices.push({ ip: req.body.ip, community: req.body.community, name: req.body.name });
        saveDevices(devices);
        addLog(req.body.ip, req.body.name, 'INFO', 'Equipo agregado al sistema de monitoreo.');
    }
    res.json(devices);
});
app.delete('/api/devices/:ip', (req, res) => {
    const devices = getDevices().filter(d => d.ip !== req.params.ip);
    saveDevices(devices);
    delete previousState[req.params.ip];
    addLog(req.params.ip, 'N/A', 'INFO', 'Equipo eliminado del monitoreo.');
    res.json(devices);
});
app.get('/api/logs', (req, res) => res.json(getLogs()));

io.on('connection', (socket) => {
    pollAndBroadcast(); // Forzar actualización inicial al conectar
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Servidor NOC corriendo en puerto ${PORT}`));
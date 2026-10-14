const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Ruta exacta a tu archivo devices.json en el backend
const devicesFilePath = path.join(__dirname, 'devices.json');

// Función para leer los equipos del JSON
const getDevices = () => {
  try {
    if (!fs.existsSync(devicesFilePath)) return [];
    const data = fs.readFileSync(devicesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error leyendo devices.json", err);
    return [];
  }
};

// Función para guardar los equipos en el JSON y actualizar a los clientes
const saveDevices = (devices) => {
  fs.writeFileSync(devicesFilePath, JSON.stringify(devices, null, 2));
  io.emit('device_updates', devices);
};

// --- ENDPOINTS DE LA API ---

// Agregar Equipo
app.post('/api/devices', (req, res) => {
  const { ip, name, community } = req.body;
  const devices = getDevices();
  
  if (devices.find(d => d.ip === ip)) {
    return res.status(400).json({ error: 'El equipo ya existe' });
  }
  
  // Agregamos el dispositivo con valores iniciales
  devices.push({ ip, name, community, status: 'Offline', cpu: 0, uptime: 0 });
  saveDevices(devices);
  res.status(201).json({ message: 'Equipo provisionado exitosamente' });
});

// Editar Equipo
app.put('/api/devices/:ip', (req, res) => {
  const { ip } = req.params;
  const { name, community } = req.body;
  const devices = getDevices();
  const index = devices.findIndex(d => d.ip === ip);
  
  if (index === -1) return res.status(404).json({ error: 'Equipo no encontrado' });

  // Actualizamos solo el nombre y la comunidad, conservando los datos en vivo
  devices[index] = { ...devices[index], name, community };
  saveDevices(devices);
  res.json({ message: 'Equipo actualizado' });
});

// Eliminar Equipo
app.delete('/api/devices/:ip', (req, res) => {
  const { ip } = req.params;
  let devices = getDevices();
  
  devices = devices.filter(d => d.ip !== ip);
  saveDevices(devices);
  res.json({ message: 'Equipo eliminado' });
});

// --- WEBSOCKETS ---

io.on('connection', (socket) => {
  console.log('Cliente frontend conectado');
  // Al conectarse, enviamos la lista actual
  socket.emit('device_updates', getDevices());
});

// Simulación de monitoreo SNMP (Actualiza esto con tu lógica SNMP real)
setInterval(() => {
  const devices = getDevices();
  let changed = false;
  
  devices.forEach(d => {
    // Simulación de fluctuación de CPU para la UI
    if (d.status === 'Online') {
      d.cpu = Math.floor(Math.random() * 100);
      d.uptime += 5;
      changed = true;
    }
  });

  if(changed) {
    io.emit('device_updates', devices);
  }
}, 5000);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend de monitoreo corriendo en el puerto ${PORT}`);
});
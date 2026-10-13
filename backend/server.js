const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const snmp = require('net-snmp');
const cors = require('cors');

const app = express();
app.use(cors());

// Configuración de WebSockets sobre el servidor HTTP
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // El puerto por defecto de Vite
        methods: ["GET", "POST"]
    }
});

// Configuración de tus equipos
const devices = ['10.1.3.91', '10.1.3.99'];
const community = 'monitoreo_ubi_26';
const oids = [
    '1.3.6.1.2.1.1.5.0', // SysName
    '1.3.6.1.2.1.1.3.0'  // SysUpTime
];

// Función para recolectar datos de un solo equipo
const fetchSnmp = (ip) => new Promise((resolve) => {
    const session = snmp.createSession(ip, community);
    
    session.get(oids, (error, varbinds) => {
        if (error) {
            resolve({ ip, status: 'Offline', name: 'Desconocido', uptime: 0 });
        } else {
            resolve({
                ip,
                status: 'Online',
                name: varbinds[0].value.toString(),
                uptime: Math.floor(varbinds[1].value / 100)
            });
        }
        session.close();
    });
});

// Bucle principal del servidor: Consulta equipos y emite datos
const pollAndBroadcast = async () => {
    try {
        const results = await Promise.all(devices.map(fetchSnmp));
        // 'device_updates' es el nombre del evento que escuchará React
        io.emit('device_updates', results); 
    } catch (err) {
        console.error("Error al hacer polling SNMP:", err);
    }
};

// El servidor hace ping a los equipos cada 15 segundos
setInterval(pollAndBroadcast, 15000);

// Cuando un usuario abre la app en el navegador
io.on('connection', async (socket) => {
    console.log('Nuevo cliente web conectado:', socket.id);
    
    // Le enviamos los datos inmediatamente para que no espere 15 segundos
    const initialData = await Promise.all(devices.map(fetchSnmp));
    socket.emit('device_updates', initialData);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Servidor WebSockets corriendo en http://localhost:${PORT}`));
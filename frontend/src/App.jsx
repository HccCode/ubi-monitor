import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// 1. NUEVO: Función para formatear el tiempo en segundos a un formato humano
const formatUptime = (seconds) => {
  if (!seconds || seconds === 0) return '0 min';

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  let result = [];
  if (d > 0) result.push(`${d} ${d === 1 ? 'día' : 'días'}`);
  if (h > 0) result.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
  if (m > 0 || result.length === 0) result.push(`${m} min`);

  return result.join(', ');
};

function App() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIp, setSelectedIp] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('Conectado al servidor en tiempo real');
    });

    socket.on('device_updates', (data) => {
      setDevices(data);
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const activeDevice = devices.find(d => d.ip === selectedIp);

  // --- ESTILOS ---
  const containerStyle = {
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    backgroundColor: '#0a0a0c',
    minHeight: '100vh',
    color: '#e2e8f0',
    paddingBottom: '40px'
  };

  const headerStyle = {
    padding: '20px 40px',
    backgroundColor: '#131419',
    borderBottom: '2px solid #27272a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    padding: '30px 40px'
  };

  // 2. MODIFICADO: Evalúa el equipo para aplicar estilos de alerta
  const cardStyle = (dev) => {
    // Si está en línea y la CPU > 85, es un estado crítico
    const isWarning = dev.status === 'Online' && dev.cpu > 85;
    const isOffline = dev.status !== 'Online';

    return {
      // Borde base: rojo (offline), naranja (alerta cpu), gris oscuro (normal)
      border: `1px solid ${isOffline ? '#ff073a' : isWarning ? '#ff9500' : '#3f3f46'}`,
      borderRadius: '4px',
      padding: '20px',
      backgroundColor: '#18181b',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      transition: 'transform 0.1s, border-color 0.2s',
      // Aplica la animación CSS intermitente definida abajo
      animation: isWarning ? 'pulseAlert 1.5s infinite' : 'none'
    };
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalContentStyle = (status) => ({
    backgroundColor: '#131419',
    border: `1px solid ${status === 'Online' ? '#39ff14' : '#ff073a'}`,
    borderRadius: '4px',
    padding: '30px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: `inset 0 0 20px rgba(0,0,0,1), 0 0 15px ${status === 'Online' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 7, 58, 0.1)'}`,
    position: 'relative'
  });

  const labelStyle = { color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' };
  const valueStyle = { fontSize: '1.1rem', color: '#ffffff', margin: '4px 0 16px 0' };
  
  // MODIFICADO: El LED ahora puede ser Verde, Rojo o Naranja
  const ledStyle = (status, cpu = 0) => {
    let color = '#39ff14'; // Verde por defecto
    if (status !== 'Online') color = '#ff073a'; // Rojo si cae
    else if (cpu > 85) color = '#ff9500'; // Naranja si CPU alta

    return {
      height: '12px', width: '12px',
      backgroundColor: color,
      borderRadius: '50%',
      boxShadow: `0 0 10px ${color}`,
      display: 'inline-block'
    };
  };

  return (
    <div style={containerStyle}>
      {/* 3. NUEVO: Inyectamos la animación CSS para el efecto intermitente */}
      <style>
        {`
          @keyframes pulseAlert {
            0% { box-shadow: 0 0 5px #ff9500; border-color: #ff9500; }
            50% { box-shadow: 0 0 25px #ff9500, inset 0 0 15px rgba(255, 149, 0, 0.2); border-color: #ffb700; }
            100% { box-shadow: 0 0 5px #ff9500; border-color: #ff9500; }
          }
        `}
      </style>

      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '2px', color: '#ffffff' }}>
          NOC // Ubiquiti Status
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#a1a1aa' }}>
          <span style={ledStyle('Online', 0)}></span> LVE_STREAM
        </div>
      </header>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#39ff14', letterSpacing: '2px' }}>
          &gt; INICIANDO CONEXIÓN SNMP...
        </div>
      ) : (
        <div style={gridStyle}>
          {devices.map(dev => (
            <div 
              key={dev.ip} 
              style={cardStyle(dev)} // Pasamos el dispositivo completo para calcular alertas
              onClick={() => setSelectedIp(dev.ip)} 
            >
              <span style={{ ...ledStyle(dev.status, dev.cpu), marginBottom: '15px', transform: 'scale(1.5)' }}></span>
              
              <h2 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#ffffff' }}>
                {dev.name.toUpperCase()}
              </h2>
              
              <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{dev.ip}</div>
              
              {/* NUEVO: Pequeño indicador de advertencia visible solo si CPU > 85% */}
              {dev.status === 'Online' && dev.cpu > 85 && (
                <div style={{ marginTop: '12px', color: '#ff9500', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                  ⚠ ALERTA CPU: {dev.cpu}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VENTANA MODAL */}
      {activeDevice && (
        <div style={modalOverlayStyle} onClick={() => setSelectedIp(null)}>
          <div style={modalContentStyle(activeDevice.status)} onClick={e => e.stopPropagation()}>
            
            <button 
              onClick={() => setSelectedIp(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h2 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', color: '#ffffff', borderBottom: '1px solid #27272a', paddingBottom: '15px' }}>
              &gt; DETALLE_NODO // {activeDevice.name.toUpperCase()}
            </h2>

            <div style={labelStyle}>Dirección IP</div>
            <div style={valueStyle}>{activeDevice.ip}</div>

            <div style={labelStyle}>Estado de Enlace</div>
            <div style={{ ...valueStyle, color: activeDevice.status === 'Online' ? '#39ff14' : '#ff073a', fontWeight: 'bold' }}>
              {activeDevice.status === 'Online' ? 'OPERATIVO' : 'CAÍDO'}
            </div>

            <div style={labelStyle}>Tiempo Activo (Uptime)</div>
            {/* 4. APLICADO: Usamos la función formatUptime aquí */}
            <div style={valueStyle}>
              {activeDevice.status === 'Online' ? formatUptime(activeDevice.uptime) : '---'}
            </div>

            <div style={labelStyle}>Carga de CPU en vivo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
              <div style={{ flexGrow: 1, backgroundColor: '#27272a', height: '8px', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${activeDevice.status === 'Online' ? activeDevice.cpu : 0}%`, 
                  backgroundColor: activeDevice.cpu > 85 ? '#ff9500' : '#39ff14', // Cambia a naranja si es alto
                  height: '100%',
                  transition: 'width 0.3s'
                }}></div>
              </div>
              <div style={{ color: '#ffffff', minWidth: '40px', textAlign: 'right' }}>
                {activeDevice.status === 'Online' ? `${activeDevice.cpu}%` : '---'}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
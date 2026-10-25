import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import './App.css';

import DeviceDrawer from './components/DeviceDrawer';
import AddDeviceModal from './components/AddDeviceModal';
import SettingsView from './components/SettingsView';
import GeoMap from './components/GeoMap';

function App() {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [devices, setDevices] = useState([]);
  const [selectedIp, setSelectedIp] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const prevOfflineCount = useRef(0);

  useEffect(() => {
    // IMPORTANTE: Asegúrate de que esta URL apunte a tu backend de Node.js
    const socket = io(`http://${window.location.hostname}:3001`);
    socket.on('device_updates', (data) => setDevices(data));
    return () => socket.disconnect();
  }, []);

  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.length - onlineCount;

  // Alarma sonora si cae un equipo
  useEffect(() => {
    if (!isMuted && offlineCount > prevOfflineCount.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio block", e));
    }
    prevOfflineCount.current = offlineCount;
  }, [offlineCount, isMuted]);

  // Búsqueda
  const filteredDevices = devices.filter(dev => 
    dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    dev.ip.includes(searchQuery)
  );

  // --- LÓGICA DE ÁRBOL AVANZADA (AP SIEMPRE ARRIBA) ---
  const buildTree = (list) => {
    const aps = list.filter(d => !d.parentIp); // Nodos raíz (Antenas Sectoriales)
    const cpes = list.filter(d => d.parentIp); // Clientes

    const sortedList = [];
    
    // Iteramos sobre los APs
    aps.forEach(ap => {
      sortedList.push({ ...ap, isAP: true }); // Insertamos el AP
      
      // Buscamos a los clientes que pertenecen a este AP
      const children = cpes.filter(c => c.parentIp === ap.ip);
      children.forEach(child => {
        sortedList.push({ ...child, isAP: false, level: 1 }); // Insertamos sus clientes debajo
      });
    });

    // Si hay clientes huérfanos (sin AP en la lista), los ponemos al final
    const placedIps = sortedList.map(d => d.ip);
    cpes.forEach(c => {
      if (!placedIps.includes(c.ip)) {
        sortedList.push({ ...c, isAP: false, level: 0 });
      }
    });

    return sortedList;
  };

  const displayList = searchQuery ? filteredDevices : buildTree(devices);
  // ---------------------------------------------------

  // Renderizado de cada fila de la tabla
  const renderDeviceRow = (dev) => {
    const isOnline = dev.status === 'Online';
    const isAP = dev.isAP;
    const level = dev.level || 0;
    
    // Lógica de colores de salud
    const signalColor = !isOnline ? 'var(--danger)' : (dev.signal < -75 ? 'var(--danger)' : dev.signal < -65 ? 'var(--warning)' : 'var(--success)');
    const ccqColor = dev.ccq < 80 ? 'var(--danger)' : 'var(--accent)';
    
    // Datos históricos para la gráfica (mock de seguridad si no hay datos)
    const historyData = dev.trafficHistory && dev.trafficHistory.length > 0 ? dev.trafficHistory : [{ signal: dev.signal || -90 }, { signal: dev.signal || -90 }];

    return (
      <tr key={dev.ip} onClick={() => setSelectedIp(dev.ip)} className={isAP ? 'ap-row' : ''}>
        
        {/* COLUMNA 1: ESTRUCTURA (Nombre e Ícono) */}
        <td style={{ paddingLeft: `${(level * 30) + 24}px` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {level > 0 && <span className="tree-line">↳</span>}
            <span className={isAP ? 'ap-icon' : 'cpe-icon'}>
              {isAP ? '📡' : '🏠'}
            </span>
            <span style={{ color: isAP ? '#fff' : 'var(--text-main)', fontWeight: isAP ? '600' : '400' }}>
              {dev.name}
            </span>
          </div>
        </td>

        {/* COLUMNA 2: IP */}
        <td className="mono-cell" style={{ color: 'var(--text-muted)' }}>
          {dev.ip}
        </td>

        {/* COLUMNA 3: ESTADO */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="glow-indicator" style={{ 
              background: signalColor, 
              boxShadow: isOnline ? `0 0 10px ${signalColor}` : 'none' 
            }}></span>
            <span className="status-text" style={{ color: isOnline ? '#fff' : 'var(--danger)' }}>
              {dev.status}
            </span>
          </div>
        </td>

        {/* COLUMNA 4: TENDENCIA Y SALUD RF (Gráfica, Señal y CCQ) */}
        <td>
          {isOnline ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
              
              {/* Gráfica Sparkline (Recharts) */}
              <div style={{ width: '60px', height: '20px', opacity: 0.7 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                    <Line type="monotone" dataKey="signal" stroke={signalColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bloque Señal */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '60px' }}>
                <span className="mono-cell" style={{ color: signalColor, fontSize: '1rem', fontWeight: '500' }}>{dev.signal}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SNR {dev.snr || 0}dB</span>
              </div>

              {/* Divisor Visual */}
              <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>

              {/* Bloque CCQ */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '45px' }}>
                <span className="mono-cell" style={{ color: ccqColor, fontSize: '1rem', fontWeight: '500' }}>{dev.ccq || 0}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CCQ</span>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'right', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: '500', letterSpacing: '1px' }}>
              OFFLINE
            </div>
          )}
        </td>
      </tr>
    );
  };

  const activeDevice = devices.find(d => d.ip === selectedIp);

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="topbar-modern">
        <div className="brand-modern">
          UBI-MONITOR NOC
        </div>
        
        <div className="pill-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>Heatmap</button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Config</button>
        </div>

        <div className="topbar-actions">
          <div className="search-modern">
            <span style={{ opacity: 0.5 }}>🔍</span>
            <input type="text" placeholder="Buscar IP o Nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="btn-icon-white" onClick={() => setIsMuted(!isMuted)} title="Silenciar Alertas">
            {isMuted ? '🔕' : '🔔'}
          </button>
          <button className="btn-primary-white" onClick={() => setIsAddModalOpen(true)}>
            + Provision Node
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ height: '100%' }}>
        {activeTab === 'overview' && (
          <div className="bento-overview">
            
            {/* PANEL IZQUIERDO: TABLA */}
            <div className="table-card">
              <div className="table-header-container">
                <table className="ultra-table">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Estructura de Red</th>
                      <th style={{ width: '20%' }}>IP Address</th>
                      <th style={{ width: '15%' }}>Estado</th>
                      <th style={{ width: '30%', textAlign: 'right', paddingRight: 0 }}>Tendencia y Salud RF</th>
                    </tr>
                  </thead>
                </table>
              </div>
              
              <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
                <table className="ultra-table">
                  <tbody>
                    {displayList.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No hay equipos registrados</td></tr>
                    ) : (
                      displayList.map(dev => renderDeviceRow(dev))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PANEL DERECHO: KPIS */}
            <div className="side-kpis">
              <div className="kpi-card-modern">
                <div className="kpi-title">Enlaces Activos</div>
                <div className="kpi-number number-success">{onlineCount}</div>
              </div>
              
              <div className="kpi-card-modern">
                <div className="kpi-title">Enlaces Caídos</div>
                <div className={`kpi-number number-danger ${offlineCount > 0 ? 'active-danger' : ''}`}>
                  {offlineCount}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* OTRAS PESTAÑAS */}
        {activeTab === 'map' && <div style={{ height: 'calc(100vh - 70px)', padding: '24px 30px' }}><GeoMap devices={devices} onSelectDevice={setSelectedIp} /></div>}
        {activeTab === 'settings' && <div style={{ height: 'calc(100vh - 70px)', padding: '24px 30px' }}><SettingsView devices={devices} /></div>}
      </main>

      {/* MODALES FLOTANTES */}
      {activeDevice && <DeviceDrawer device={activeDevice} onClose={() => setSelectedIp(null)} />}
      {isAddModalOpen && <AddDeviceModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}

export default App;
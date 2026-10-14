import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

import DeviceDrawer from './components/DeviceDrawer';
import AddDeviceModal from './components/AddDeviceModal';
import SettingsView from './components/SettingsView';

function App() {
  const [activeTab, setActiveTab] = useState('overview'); // Controla la pestaña actual: 'overview' o 'settings'
  const [devices, setDevices] = useState([]);
  const [selectedIp, setSelectedIp] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inicializa la conexión con el servidor Node.js/Socket.io
  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('device_updates', (data) => setDevices(data));
    return () => socket.disconnect();
  }, []);

  // Variables calculadas para la interfaz
  const activeDevice = devices.find(d => d.ip === selectedIp);
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div className="layout">
      
      {/* HEADER / TOPBAR */}
      <header className="topbar">
        <div className="brand">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 15px var(--accent)' }}></div>
          UBI-MONITOR NOC
        </div>
        
        {/* Pestañas de Navegación */}
        <div className="nav-pills">
          <button 
            className={`pill ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pill ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('settings')}
          >
            Configuración
          </button>
        </div>

        {/* Botón Global para agregar dispositivos (Siempre visible) */}
        <div style={{ width: '180px', textAlign: 'right' }}>
          <button className="btn-modern" onClick={() => setIsAddModalOpen(true)}>
            + Provision Node
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="bento-container">
        
        {/* === VISTA 1: OVERVIEW (TABLA PRINCIPAL + KPIS) === */}
        {activeTab === 'overview' ? (
          <>
            {/* Panel Izquierdo: Tabla de Monitoreo */}
            <div className="bento-card card-main">
              <table className="ultra-table">
                <thead>
                  <tr>
                    <th>Hostname</th>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>CPU Load</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                        No SNMP nodes provisioned
                      </td>
                    </tr>
                  ) : (
                    devices.map(dev => {
                      const isOnline = dev.status === 'Online';
                      const glowColor = !isOnline ? 'var(--danger)' : dev.cpu > 85 ? 'var(--warning)' : 'var(--success)';
                      
                      return (
                        <tr key={dev.ip} onClick={() => setSelectedIp(dev.ip)}>
                          <td style={{ fontWeight: '500' }}>{dev.name}</td>
                          <td className="mono-cell">{dev.ip}</td>
                          <td>
                            <span className="glow-indicator" style={{ background: glowColor, boxShadow: `0 0 10px ${glowColor}` }}></span>
                            <span style={{ color: isOnline ? 'var(--text-main)' : 'var(--text-muted)' }}>{dev.status}</span>
                          </td>
                          <td className="mono-cell" style={{ textAlign: 'right', color: dev.cpu > 85 ? 'var(--danger)' : 'inherit' }}>
                            {isOnline ? `${dev.cpu}%` : '---'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Panel Derecho: Métricas (KPIs) */}
            <div className="bento-card">
              <div className="metric-title">Active Nodes</div>
              <div className="metric-value" style={{ color: 'var(--success)', textShadow: '0 0 40px rgba(16, 185, 129, 0.3)' }}>
                {onlineCount}
              </div>
            </div>

            <div className="bento-card">
              <div className="metric-title">Critical / Offline</div>
              <div className="metric-value" style={{ color: offlineCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {offlineCount}
              </div>
            </div>
            
            <div className="bento-card">
              <div className="metric-title">Total Infrastructure</div>
              <div className="metric-value">{devices.length}</div>
            </div>
          </>
        ) : (
          
          /* === VISTA 2: CONFIGURACIÓN (REJILLA DE TARJETAS) === */
          <div className="bento-card" style={{ gridColumn: 'span 4', gridRow: 'span 3', padding: 0 }}>
            <SettingsView devices={devices} />
          </div>
        )}
      </main>

      {/* --- MODALES O PANELES DESLIZANTES --- */}
      
      {/* Panel de detalles del dispositivo seleccionado */}
      {activeDevice && (
        <DeviceDrawer device={activeDevice} onClose={() => setSelectedIp(null)} />
      )}
      
      {/* Modal para agregar un nuevo nodo a la red */}
      {isAddModalOpen && (
        <AddDeviceModal onClose={() => setIsAddModalOpen(false)} />
      )}

    </div>
  );
}

export default App;
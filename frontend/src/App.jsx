import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

import DeviceDrawer from './components/DeviceDrawer';
import AddDeviceModal from './components/AddDeviceModal';
import SettingsView from './components/SettingsView';
import GeoMap from './components/GeoMap'; // <-- Importado el nuevo mapa

function App() {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [devices, setDevices] = useState([]);
  const [selectedIp, setSelectedIp] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  
  const prevOfflineCount = useRef(0);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('device_updates', (data) => setDevices(data));
    return () => socket.disconnect();
  }, []);

  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.length - onlineCount;

  useEffect(() => {
    if (!isMuted && offlineCount > prevOfflineCount.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked", e));
    }
    prevOfflineCount.current = offlineCount;
  }, [offlineCount, isMuted]);

  const filteredDevices = devices.filter(dev => {
    const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || dev.ip.includes(searchQuery);
    const matchesFilter = statusFilter === 'ALL' ||
                          (statusFilter === 'ONLINE' && dev.status === 'Online') ||
                          (statusFilter === 'OFFLINE' && dev.status !== 'Online');
    return matchesSearch && matchesFilter;
  });

  const activeDevice = devices.find(d => d.ip === selectedIp);

  return (
    <div className={`layout ${isKioskMode ? 'kiosk-mode' : ''}`}>
      {!isKioskMode && (
        <header className="topbar">
          <div className="brand">
            <div className={`status-dot ${offlineCount > 0 ? 'critical' : 'ok'}`}></div>
            UBI-MONITOR airMAX
          </div>
          <div className="nav-pills">
            <button className={`pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`pill ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Floor Plan</button>
            <button className={`pill ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Configuración</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-bar">
              <span style={{ opacity: 0.5 }}>🔍</span>
              <input type="text" placeholder="Find IP or Host..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn-modern icon-btn" onClick={() => setIsMuted(!isMuted)}>{isMuted ? '🔕' : '🔔'}</button>
            <button className="btn-modern icon-btn" onClick={() => setIsKioskMode(true)}>⛶</button>
            <button className="btn-modern" onClick={() => setIsAddModalOpen(true)}>+ Provision Node</button>
          </div>
        </header>
      )}

      {isKioskMode && <button className="exit-kiosk-btn" onClick={() => setIsKioskMode(false)}>✕ Exit Wallboard</button>}

      <main className="bento-container">
        {activeTab === 'overview' && (
          <>
            <div className="bento-card card-main">
              <div style={{ overflowY: 'auto', height: '100%', paddingRight: '8px' }}>
                <table className="ultra-table">
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(3,3,3,0.9)', backdropFilter: 'blur(10px)', zIndex: 5 }}>
                    <tr><th>Hostname</th><th>IP Address</th><th>Status</th><th style={{ textAlign: 'right' }}>RF Health (Signal / CCQ)</th></tr>
                  </thead>
                  <tbody>
                    {filteredDevices.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>No se encontraron equipos</td></tr>
                    ) : (
                      filteredDevices.map(dev => {
                        const isOnline = dev.status === 'Online';
                        const signalQualityColor = !isOnline ? 'var(--danger)' : (dev.signal < -75 ? 'var(--danger)' : dev.signal < -65 ? 'var(--warning)' : 'var(--success)');
                        const glowColor = !isOnline ? 'var(--danger)' : signalQualityColor;
                        return (
                          <tr key={dev.ip} onClick={() => setSelectedIp(dev.ip)} className={!isOnline && !isMuted ? 'row-critical' : ''}>
                            <td style={{ fontWeight: '500' }}>{dev.name}</td>
                            <td className="mono-cell">{dev.ip}</td>
                            <td>
                              <span className="glow-indicator" style={{ background: glowColor, boxShadow: `0 0 10px ${glowColor}` }}></span>
                              <span style={{ color: isOnline ? 'var(--text-main)' : 'var(--danger)', fontWeight: !isOnline ? '600' : 'normal' }}>{dev.status}</span>
                            </td>
                            <td style={{ textAlign: 'right', width: '250px' }}>
                              {isOnline ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>SIGNAL</span>
                                    <span className="mono-cell" style={{ fontSize: '1.1rem', color: signalQualityColor }}>{dev.signal ? `${dev.signal} dBm` : '---'}</span>
                                  </div>
                                  <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '60px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>CCQ</span>
                                    <span className="mono-cell" style={{ fontSize: '1.1rem', color: dev.ccq < 80 ? 'var(--danger)' : dev.ccq < 90 ? 'var(--warning)' : 'var(--accent)' }}>{dev.ccq ? `${dev.ccq}%` : '---'}</span>
                                  </div>
                                </div>
                              ) : <span className="mono-cell" style={{ color: 'var(--danger)' }}>ERR_CONN</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`bento-card kpi-card ${statusFilter === 'ONLINE' ? 'kpi-active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}>
              <div className="metric-title">Active Links</div>
              <div className="metric-value" style={{ color: 'var(--success)' }}>{onlineCount}</div>
            </div>
            <div className={`bento-card kpi-card ${statusFilter === 'OFFLINE' ? 'kpi-active-danger' : ''} ${offlineCount > 0 && !isMuted ? 'pulse-danger' : ''}`} onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}>
              <div className="metric-title">Failing Links</div>
              <div className="metric-value" style={{ color: offlineCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{offlineCount}</div>
            </div>
            <div className={`bento-card kpi-card ${statusFilter === 'ALL' ? 'kpi-active' : ''}`} onClick={() => setStatusFilter('ALL')}>
              <div className="metric-title">Total Antennas</div>
              <div className="metric-value">{devices.length}</div>
            </div>
          </>
        )}

        {/* --- MAPA GEOGRÁFICO LEAFLET --- */}
        {activeTab === 'map' && (
          <div className="bento-card" style={{ gridColumn: 'span 4', gridRow: 'span 3', padding: 0 }}>
            <GeoMap devices={filteredDevices} onSelectDevice={setSelectedIp} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bento-card" style={{ gridColumn: 'span 4', gridRow: 'span 3', padding: 0 }}>
            <SettingsView devices={devices} />
          </div>
        )}
      </main>

      {activeDevice && <DeviceDrawer device={activeDevice} onClose={() => setSelectedIp(null)} />}
      {isAddModalOpen && <AddDeviceModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}

export default App;
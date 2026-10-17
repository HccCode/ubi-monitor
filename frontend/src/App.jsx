import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
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
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  
  // --- ESTADO PARA EL ÁRBOL COLAPSABLE ---
  const [expandedRows, setExpandedRows] = useState({});

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
      audio.play().catch(e => console.log("Audio block", e));
    }
    prevOfflineCount.current = offlineCount;
  }, [offlineCount, isMuted]);

  // Filtrado general
  const filteredDevices = devices.filter(dev => {
    const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || dev.ip.includes(searchQuery);
    const matchesFilter = statusFilter === 'ALL' ||
                          (statusFilter === 'ONLINE' && dev.status === 'Online') ||
                          (statusFilter === 'OFFLINE' && dev.status !== 'Online');
    return matchesSearch && matchesFilter;
  });

  const activeDevice = devices.find(d => d.ip === selectedIp);
  const isSearching = searchQuery.trim() !== '' || statusFilter !== 'ALL';

  // --- LÓGICA DE CONSTRUCCIÓN DEL ÁRBOL ---
  const buildTree = (list) => {
    const childrenMap = {};
    const tree = [];
    
    // Agrupamos a los hijos por la IP de su padre
    list.forEach(d => {
      if (d.parentIp) {
        if (!childrenMap[d.parentIp]) childrenMap[d.parentIp] = [];
        childrenMap[d.parentIp].push(d);
      }
    });

    // Identificamos las raíces (AP / Sectoriales que no tienen padre)
    list.forEach(d => {
      if (!d.parentIp) {
        tree.push({ ...d, children: childrenMap[d.ip] || [] });
      }
    });

    return tree;
  };

  const toggleRow = (ip, e) => {
    e.stopPropagation();
    setExpandedRows(prev => ({ ...prev, [ip]: !prev[ip] }));
  };

  // --- MOTOR DE RENDERIZADO RECURSIVO ---
  const renderDeviceRow = (dev, level = 0) => {
    const isOnline = dev.status === 'Online';
    const hasChildren = dev.children && dev.children.length > 0;
    const isExpanded = expandedRows[dev.ip];
    const signalColor = !isOnline ? 'var(--danger)' : (dev.signal < -75 ? 'var(--danger)' : dev.signal < -65 ? 'var(--warning)' : 'var(--success)');
    
    // Renderizamos la fila actual
    const row = (
      <tr key={dev.ip} onClick={() => setSelectedIp(dev.ip)} className={!isOnline && !isMuted ? 'row-critical' : ''} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <td style={{ fontWeight: '500', paddingLeft: `${level * 30 + 16}px`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icono de Carpeta/Árbol */}
          {hasChildren ? (
            <button onClick={(e) => toggleRow(dev.ip, e)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <div style={{ width: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>↳</div>
          )}
          {dev.name} {hasChildren && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px' }}>{dev.children.length} CPEs</span>}
        </td>
        <td className="mono-cell" style={{ color: 'var(--text-muted)' }}>{dev.ip}</td>
        <td>
          <span className="glow-indicator" style={{ background: isOnline ? signalColor : 'var(--danger)' }}></span>
          <span style={{ color: isOnline ? 'var(--text-main)' : 'var(--danger)', fontWeight: !isOnline ? '600' : 'normal' }}>{dev.status}</span>
        </td>
        <td style={{ textAlign: 'right' }}>
          {isOnline ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <div className="mono-cell" style={{ color: signalColor, width: '60px' }}>{dev.signal} dBm</div>
              <div className="mono-cell" style={{ color: dev.ccq < 80 ? 'var(--danger)' : 'var(--accent)', width: '50px' }}>{dev.ccq}%</div>
            </div>
          ) : <span className="mono-cell" style={{ color: 'var(--danger)' }}>ERR</span>}
        </td>
      </tr>
    );

    // Si tiene hijos y está expandido, renderizamos los hijos debajo
    let childrenRows = [];
    if (hasChildren && isExpanded) {
      childrenRows = dev.children.map(child => renderDeviceRow(child, level + 1));
    }

    return [row, ...childrenRows];
  };

  const treeData = buildTree(filteredDevices);

  return (
    <div className={`layout ${isKioskMode ? 'kiosk-mode' : ''}`}>
      {!isKioskMode && (
        <header className="topbar">
          <div className="brand">
            <div className={`status-dot ${offlineCount > 0 ? 'critical' : 'ok'}`}></div>
            UBI-MONITOR NOC
          </div>
          <div className="nav-pills">
            <button className={`pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`pill ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Heatmap</button>
            <button className={`pill ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Config</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-bar">
              <span style={{ opacity: 0.5 }}>🔍</span>
              <input type="text" placeholder="Buscar IP o Nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn-modern icon-btn" onClick={() => setIsMuted(!isMuted)}>{isMuted ? '🔕' : '🔔'}</button>
            <button className="btn-modern" onClick={() => setIsAddModalOpen(true)}>+ Provision Node</button>
          </div>
        </header>
      )}

      <main className="bento-container">
        {activeTab === 'overview' && (
          <>
            <div className="bento-card card-main">
              <div style={{ overflowY: 'auto', height: '100%', paddingRight: '8px' }}>
                <table className="ultra-table">
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(3,3,3,0.95)', backdropFilter: 'blur(10px)', zIndex: 5 }}>
                    <tr><th>Estructura de Red (AP / CPE)</th><th>IP Address</th><th>Estado</th><th style={{ textAlign: 'right' }}>Salud (Señal / CCQ)</th></tr>
                  </thead>
                  <tbody>
                    {filteredDevices.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Sin equipos</td></tr>
                    ) : (
                      // Si el usuario está buscando, aplanamos la lista. Si no, mostramos el árbol.
                      isSearching 
                        ? filteredDevices.map(dev => renderDeviceRow(dev, 0))
                        : treeData.map(rootNode => renderDeviceRow(rootNode, 0))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`bento-card kpi-card ${statusFilter === 'ONLINE' ? 'kpi-active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}>
              <div className="metric-title">Enlaces Activos</div>
              <div className="metric-value" style={{ color: 'var(--success)' }}>{onlineCount}</div>
            </div>
            <div className={`bento-card kpi-card ${statusFilter === 'OFFLINE' ? 'kpi-active-danger' : ''} ${offlineCount > 0 && !isMuted ? 'pulse-danger' : ''}`} onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}>
              <div className="metric-title">Enlaces Caídos</div>
              <div className="metric-value" style={{ color: offlineCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{offlineCount}</div>
            </div>
            <div className={`bento-card kpi-card ${statusFilter === 'ALL' ? 'kpi-active' : ''}`} onClick={() => setStatusFilter('ALL')}>
              <div className="metric-title">Total Antenas</div>
              <div className="metric-value">{devices.length}</div>
            </div>
          </>
        )}

        {activeTab === 'map' && <div className="bento-card" style={{ gridColumn: 'span 4', gridRow: 'span 3', padding: 0 }}><GeoMap devices={filteredDevices} onSelectDevice={setSelectedIp} /></div>}
        {activeTab === 'settings' && <div className="bento-card" style={{ gridColumn: 'span 4', gridRow: 'span 3', padding: 0 }}><SettingsView devices={devices} /></div>}
      </main>

      {activeDevice && <DeviceDrawer device={activeDevice} onClose={() => setSelectedIp(null)} />}
      {isAddModalOpen && <AddDeviceModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}

export default App;
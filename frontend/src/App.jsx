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
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('ONLINE'); 
  
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

  const filteredDevices = devices.filter(dev => {
    const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || dev.ip.includes(searchQuery);
    const matchesFilter = statusFilter === 'ALL' ||
                          (statusFilter === 'ONLINE' && dev.status === 'Online') ||
                          (statusFilter === 'OFFLINE' && dev.status !== 'Online');
    return matchesSearch && matchesFilter;
  });

  const activeDevice = devices.find(d => d.ip === selectedIp);
  const isSearching = searchQuery.trim() !== '' || statusFilter !== 'ALL';

  const buildTree = (list) => {
    const childrenMap = {};
    const tree = [];
    list.forEach(d => {
      if (d.parentIp) {
        if (!childrenMap[d.parentIp]) childrenMap[d.parentIp] = [];
        childrenMap[d.parentIp].push(d);
      }
    });
    list.forEach(d => {
      if (!d.parentIp) tree.push({ ...d, children: childrenMap[d.ip] || [] });
    });
    return tree;
  };

  const toggleRow = (ip, e) => {
    e.stopPropagation();
    setExpandedRows(prev => ({ ...prev, [ip]: !prev[ip] }));
  };

  const renderDeviceRow = (dev, level = 0) => {
    const isOnline = dev.status === 'Online';
    const hasChildren = dev.children && dev.children.length > 0;
    const isAP = hasChildren || !dev.parentIp; 
    const isExpanded = expandedRows[dev.ip];
    
    const signalColor = !isOnline ? '#ff3b30' : (dev.signal < -75 ? '#ff3b30' : dev.signal < -65 ? '#ffcc00' : '#00e676');
    const historyData = dev.trafficHistory || [];

    const row = (
      <tr key={dev.ip} onClick={() => setSelectedIp(dev.ip)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: isAP ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
        <td style={{ fontWeight: isAP ? 'bold' : '500', paddingLeft: `${level * 30 + 16}px`, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
          
          {hasChildren ? (
            <button onClick={(e) => toggleRow(dev.ip, e)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', width: '20px' }}>
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div style={{ width: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>↳</div>
          )}
          
          <span style={{ fontSize: isAP ? '1.2rem' : '1rem', opacity: isAP ? 1 : 0.7 }}>
            {isAP ? '📡' : '🏠'}
          </span>

          <span style={{ color: isAP ? '#fff' : '#888' }}>{dev.name}</span> 
        </td>
        <td className="mono-cell" style={{ color: isAP ? '#fff' : '#888' }}>{dev.ip}</td>
        <td>
          <span className="glow-indicator" style={{ background: signalColor, boxShadow: isOnline ? `0 0 8px ${signalColor}` : 'none', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px' }}></span>
          <span style={{ color: isOnline ? '#fff' : '#ff3b30', fontWeight: !isOnline ? '600' : 'normal' }}>{dev.status}</span>
        </td>
        <td style={{ textAlign: 'right' }}>
          {isOnline ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
              <div style={{ width: '70px', height: '26px', opacity: 0.8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                    <Line type="monotone" dataKey="signal" stroke={signalColor} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '60px' }}>
                <span className="mono-cell" style={{ color: signalColor, fontSize: '1.05rem', lineHeight: '1.1' }}>{dev.signal}</span>
                <span style={{ fontSize: '0.65rem', color: '#888' }}>SNR {dev.snr}dB</span>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '50px' }}>
                <span className="mono-cell" style={{ color: dev.ccq < 80 ? '#ff3b30' : '#3b82f6', fontSize: '1.05rem', lineHeight: '1.1' }}>{dev.ccq}%</span>
                <span style={{ fontSize: '0.65rem', color: '#888' }}>CCQ</span>
              </div>
            </div>
          ) : <span className="mono-cell" style={{ color: '#ff3b30' }}>ERR_CONN</span>}
        </td>
      </tr>
    );

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
            <button className="btn-icon-white" onClick={() => setIsMuted(!isMuted)}>{isMuted ? '🔕' : '🔔'}</button>
            <button className="btn-primary-white" onClick={() => setIsAddModalOpen(true)}>+ Provision Node</button>
          </div>
        </header>
      )}

      <main style={{ height: '100%' }}>
        {activeTab === 'overview' && (
          <div className="bento-overview">
            
            {/* TABLA PRINCIPAL */}
            <div className="table-card">
              <div className="custom-scrollbar" style={{ overflowY: 'auto', height: '100%', paddingRight: '12px' }}>
                <table className="ultra-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-dark)', zIndex: 5 }}>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Estructura de Red</th>
                      <th style={{ textAlign: 'left' }}>IP Address</th>
                      <th style={{ textAlign: 'left' }}>Estado</th>
                      <th style={{ textAlign: 'right' }}>Tendencia y Salud RF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Sin equipos</td></tr>
                    ) : (
                      isSearching ? filteredDevices.map(dev => renderDeviceRow(dev, 0)) : treeData.map(rootNode => renderDeviceRow(rootNode, 0))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* KPIS LATERALES */}
            <div className="side-kpis">
              <div className="kpi-card-modern" onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}>
                <div className="kpi-title">Enlaces Activos</div>
                <div className="kpi-number number-success">{onlineCount}</div>
              </div>
              <div className="kpi-card-modern" onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}>
                <div className="kpi-title">Enlaces Caídos</div>
                <div className={`kpi-number number-danger ${offlineCount > 0 ? 'active-danger' : ''}`}>{offlineCount}</div>
              </div>
            </div>

          </div>
        )}

        {/* MAPA Y CONFIGURACIÓN */}
        {activeTab === 'map' && <div style={{ height: 'calc(100vh - 100px)', padding: '0 30px 30px' }}><GeoMap devices={filteredDevices} onSelectDevice={setSelectedIp} /></div>}
        {activeTab === 'settings' && <div style={{ height: 'calc(100vh - 100px)', padding: '0 30px 30px' }}><SettingsView devices={devices} /></div>}
      </main>

      {activeDevice && <DeviceDrawer device={activeDevice} onClose={() => setSelectedIp(null)} />}
      {isAddModalOpen && <AddDeviceModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}

export default App;
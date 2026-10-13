import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

import DeviceList from './components/DeviceList';
import DeviceDrawer from './components/DeviceDrawer';
import AddDeviceModal from './components/AddDeviceModal';

function App() {
  const [devices, setDevices] = useState([]);
  const [selectedIp, setSelectedIp] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('device_updates', (data) => setDevices(data));
    return () => socket.disconnect();
  }, []);

  const activeDevice = devices.find(d => d.ip === selectedIp);
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#fff' }}></div>
          UBNT Analytics
        </div>
        <button className="btn" onClick={() => setIsAddModalOpen(true)}>Add Node</button>
      </header>

      <main className="container">
        
        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Infrastructure</div>
            <div className="stat-value">{devices.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Nodes Online</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{onlineCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Nodes Offline</div>
            <div className="stat-value" style={{ color: offlineCount > 0 ? 'var(--danger)' : 'var(--text)' }}>{offlineCount}</div>
          </div>
        </div>

        {/* List View */}
        <div className="list-wrapper">
          <div className="list-header">
            <div>Hostname</div>
            <div>IP Address</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>CPU</div>
          </div>
          <DeviceList devices={devices} onSelect={setSelectedIp} />
        </div>

      </main>

      {/* Paneles Deslizantes y Modales */}
      {activeDevice && <DeviceDrawer device={activeDevice} onClose={() => setSelectedIp(null)} />}
      
      {isAddModalOpen && (
        <AddDeviceModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => setIsAddModalOpen(false)} // Aquí puedes agregar la llamada a fetch si lo separas
        />
      )}
    </div>
  );
}

export default App;
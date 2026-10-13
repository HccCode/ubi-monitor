import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const formatUptime = (seconds) => {
  if (!seconds || seconds === 0) return '00:00:00';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m`;
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [configList, setConfigList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // Formulario
  const [newIp, setNewIp] = useState('');
  const [newCommunity, setNewCommunity] = useState('public');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // Reloj del NOC
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);

    const socket = io('http://localhost:3001');
    socket.on('device_updates', (data) => {
      setDevices(data);
      setLoading(false);
    });
    socket.on('new_log', (log) => {
      setLogs(prev => [log, ...prev].slice(0, 500));
    });

    fetchLogs();
    fetchConfig();

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  const fetchLogs = async () => {
    const res = await fetch('http://localhost:3001/api/logs');
    setLogs(await res.json());
  };

  const fetchConfig = async () => {
    const res = await fetch('http://localhost:3001/api/devices');
    setConfigList(await res.json());
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: newIp, community: newCommunity, name: newName })
    });
    setNewIp(''); setNewName('');
    fetchConfig();
    fetchLogs();
  };

  const handleDeleteDevice = async (ip) => {
    await fetch(`http://localhost:3001/api/devices/${ip}`, { method: 'DELETE' });
    fetchConfig();
    setDevices(devices.filter(d => d.ip !== ip));
  };

  // Cálculos NOC
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.length - onlineCount;
  const criticalLogs = logs.filter(l => l.type === 'CRÍTICO').length;

  return (
    <div className="noc-layout">
      
      {/* PANEL LATERAL (SIDEBAR) */}
      <aside className="noc-sidebar">
        <div className="noc-brand">
          <span className="noc-brand-icon">⚡</span> UBNT_NOC
        </div>
        <nav className="noc-nav">
          <button className={`noc-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span>🖥️ Dashboard</span>
          </button>
          <button className={`noc-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            <span>📋 Event Logs</span>
            {criticalLogs > 0 && <span style={{color: 'var(--noc-red)'}}>{criticalLogs}</span>}
          </button>
          <button className={`noc-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            <span>⚙️ Configuración</span>
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="noc-main">
        
        <header className="noc-topbar">
          <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--noc-green)', borderRadius: '50%', boxShadow: '0 0 8px var(--noc-green)'}}></div>
            SISTEMA OPERATIVO
          </div>
          <div className="noc-clock">{time} Local</div>
        </header>

        <div className="noc-content">
          
          {/* VISTA 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="kpi-grid">
                <div className="kpi-box" style={{ borderTopColor: 'var(--noc-cyan)' }}>
                  <div className="kpi-title">Total Nodos</div>
                  <div className="kpi-value">{devices.length}</div>
                </div>
                <div className="kpi-box" style={{ borderTopColor: 'var(--noc-green)' }}>
                  <div className="kpi-title">Nodos Activos</div>
                  <div className="kpi-value" style={{ color: 'var(--noc-green)' }}>{onlineCount}</div>
                </div>
                <div className="kpi-box" style={{ borderTopColor: offlineCount > 0 ? 'var(--noc-red)' : 'var(--noc-border)' }}>
                  <div className="kpi-title">Nodos Caídos</div>
                  <div className="kpi-value" style={{ color: offlineCount > 0 ? 'var(--noc-red)' : 'var(--noc-text-bright)' }}>{offlineCount}</div>
                </div>
              </div>

              {loading && configList.length > 0 ? (
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--noc-cyan)' }}>&gt; Recolectando telemetría SNMP...</div>
              ) : configList.length === 0 ? (
                <div>No hay equipos en la base de datos. Ve a Configuración.</div>
              ) : (
                <div className="device-grid">
                  {devices.map(dev => {
                    const isOnline = dev.status === 'Online';
                    const isWarning = isOnline && dev.cpu > 85;
                    const color = !isOnline ? 'var(--noc-red)' : isWarning ? 'var(--noc-orange)' : 'var(--noc-green)';
                    
                    return (
                      <div key={dev.ip} className="device-card" style={{ borderLeftColor: color }}>
                        <div className="device-header">
                          <div>
                            <h3 className="device-name">{dev.name.toUpperCase()}</h3>
                            <div className="device-ip">{dev.ip}</div>
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: color }}>
                            {isOnline ? 'ON' : 'OFF'}
                          </div>
                        </div>

                        <div className="metric-row">
                          <span>Uptime</span>
                          <span className="metric-val">{isOnline ? formatUptime(dev.uptime) : 'N/A'}</span>
                        </div>
                        
                        <div className="metric-row" style={{ marginTop: '16px' }}>
                          <span>CPU Load</span>
                          <span className="metric-val" style={{ color: isWarning ? 'var(--noc-orange)' : '' }}>
                            {isOnline ? `${dev.cpu}%` : '---'}
                          </span>
                        </div>
                        {/* Barra de progreso plana estilo Datadog */}
                        <div style={{ height: '4px', background: 'var(--noc-bg)', marginTop: '8px', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${isOnline ? dev.cpu : 0}%`, background: color, transition: 'width 0.5s' }}></div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* VISTA 2: LOGS DE EVENTOS */}
          {activeTab === 'logs' && (
            <div>
              <h2 style={{ marginTop: 0, color: 'var(--noc-text-bright)' }}>Syslog de Eventos</h2>
              <div className="noc-table-container">
                <table className="noc-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Host / IP</th>
                      <th>Severidad</th>
                      <th>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 && <tr><td colSpan="4">No hay eventos registrados.</td></tr>}
                    {logs.map(log => {
                       const badgeColor = log.type === 'CRÍTICO' ? 'var(--noc-red)' : log.type === 'RECUPERACIÓN' ? 'var(--noc-green)' : log.type === 'ADVERTENCIA' ? 'var(--noc-orange)' : 'var(--noc-cyan)';
                       const badgeBg = log.type === 'CRÍTICO' ? 'rgba(239, 68, 68, 0.1)' : log.type === 'RECUPERACIÓN' ? 'rgba(16, 185, 129, 0.1)' : log.type === 'ADVERTENCIA' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)';
                       
                       return (
                        <tr key={log.id}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td>
                            <div style={{ color: 'var(--noc-text-bright)' }}>{log.name}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{log.ip}</div>
                          </td>
                          <td>
                            <span className="badge" style={{ color: badgeColor, background: badgeBg }}>{log.type}</span>
                          </td>
                          <td>{log.message}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA 3: CONFIGURACIÓN */}
          {activeTab === 'admin' && (
            <div>
              <h2 style={{ marginTop: 0, color: 'var(--noc-text-bright)' }}>Gestión de Nodos</h2>
              
              <div style={{ background: 'var(--noc-panel)', padding: '24px', borderRadius: '6px', border: '1px solid var(--noc-border)', marginBottom: '32px' }}>
                <form onSubmit={handleAddDevice} className="form-group" style={{ marginBottom: 0 }}>
                  <input className="noc-input" placeholder="Hostname (ej. SW-CORE-01)" value={newName} onChange={e => setNewName(e.target.value)} required />
                  <input className="noc-input" placeholder="IP Address" value={newIp} onChange={e => setNewIp(e.target.value)} required />
                  <input className="noc-input" placeholder="SNMP Community" value={newCommunity} onChange={e => setNewCommunity(e.target.value)} required />
                  <button type="submit" className="noc-btn">Aprovisionar</button>
                </form>
              </div>

              <div className="noc-table-container">
                <table className="noc-table">
                  <thead>
                    <tr>
                      <th>Hostname</th>
                      <th>Dirección IP</th>
                      <th>Comunidad</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configList.map(dev => (
                      <tr key={dev.ip}>
                        <td style={{ color: 'var(--noc-text-bright)', fontWeight: '500' }}>{dev.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{dev.ip}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{dev.community}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="noc-btn-danger" onClick={() => handleDeleteDevice(dev.ip)}>Desvincular</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
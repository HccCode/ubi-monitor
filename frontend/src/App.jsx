import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const formatUptime = (seconds) => {
  if (!seconds || seconds === 0) return '0 min';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  let result = [];
  if (d > 0) result.push(`${d}d`);
  if (h > 0) result.push(`${h}h`);
  if (m > 0 || result.length === 0) result.push(`${m}m`);
  return result.join(' ');
};

function App() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIp, setSelectedIp] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('device_updates', (data) => {
      setDevices(data);
      setLoading(false);
    });
    return () => socket.disconnect();
  }, []);

  const activeDevice = devices.find(d => d.ip === selectedIp);

  // KPIs
  const totalDevices = devices.length;
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = totalDevices - onlineCount;
  
  const onlineDevices = devices.filter(d => d.status === 'Online');
  const avgCpu = onlineDevices.length > 0 
    ? Math.round(onlineDevices.reduce((sum, dev) => sum + dev.cpu, 0) / onlineDevices.length)
    : 0;

  return (
    <div className="app-container">
      {/* FONDO ANIMADO Y LUCES */}
      <div className="ambient-background">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>

      <style>
        {`
          :root {
            --bg-main: #030305;
            --glass-bg: rgba(255, 255, 255, 0.02);
            --glass-border: rgba(255, 255, 255, 0.05);
            --glass-hover: rgba(255, 255, 255, 0.04);
            --text-primary: #ffffff;
            --text-secondary: #8a8f98;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --radius-lg: 24px;
            --radius-md: 16px;
          }

          body {
            margin: 0;
            background-color: var(--bg-main);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: var(--text-primary);
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
          }

          .app-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            position: relative;
          }

          /* BACKGROUND GLOW EFFECTS */
          .ambient-background {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            z-index: -1; overflow: hidden; pointer-events: none;
          }
          .glow {
            position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15;
          }
          .glow-1 {
            background: #3b82f6; width: 600px; height: 600px;
            top: -200px; left: -200px;
          }
          .glow-2 {
            background: #8b5cf6; width: 500px; height: 500px;
            bottom: -100px; right: -100px;
          }

          /* NAVBAR */
          .glass-nav {
            height: 70px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 40px;
            background: rgba(3, 3, 5, 0.5);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--glass-border);
            position: sticky; top: 0; z-index: 50;
          }

          .nav-title {
            font-weight: 500; font-size: 1.1rem; letter-spacing: 0.5px;
            display: flex; align-items: center; gap: 12px;
          }

          @keyframes pulse-live {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }

          .live-badge {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            padding: 6px 14px; border-radius: 100px;
            font-size: 0.8rem; font-weight: 500;
            display: flex; align-items: center; gap: 8px;
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          .live-dot {
            width: 6px; height: 6px; background: var(--success); border-radius: 50%;
            animation: pulse-live 2s infinite;
          }

          /* BENTO BOX LAYOUT (KPIs & GRID) */
          .content-wrapper {
            padding: 40px; max-width: 1600px; margin: 0 auto; width: 100%; box-sizing: border-box;
          }

          .bento-kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px; margin-bottom: 32px;
          }

          .bento-card {
            background: var(--glass-bg);
            backdrop-filter: blur(24px);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: 28px;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .kpi-card { display: flex; flex-direction: column; gap: 12px; }
          .kpi-title { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; }
          .kpi-value { font-size: 2.5rem; font-weight: 600; letter-spacing: -1px; line-height: 1; }

          .bento-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
          }

          .device-card {
            cursor: pointer; position: relative; overflow: hidden;
            display: flex; flex-direction: column; justify-content: space-between;
          }
          .device-card:hover {
            background: var(--glass-hover);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          }

          /* PROGRESS BAR NEON */
          .neon-progress-bg {
            background: rgba(255,255,255,0.05); height: 6px; border-radius: 10px; overflow: hidden; margin-top: 10px;
          }
          .neon-progress-fill {
            height: 100%; border-radius: 10px; transition: width 0.6s ease;
          }

          /* MODAL REDISEÑADO */
          .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center; z-index: 100;
            animation: fadeIn 0.3s ease;
          }
          .modal-content {
            background: rgba(15, 15, 20, 0.8);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 32px; /* Super redondeado estilo Apple */
            padding: 40px; width: 90%; max-width: 460px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        `}
      </style>

      {/* NAVBAR */}
      <nav className="glass-nav">
        <div className="nav-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
          </svg>
          UBNT Analytics
        </div>
        <div className="live-badge">
          <span className="live-dot"></span> Live
        </div>
      </nav>

      <div className="content-wrapper">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
            Estableciendo conexión táctica...
          </div>
        ) : (
          <>
            {/* KPIs BENTO */}
            <div className="bento-kpis">
              <div className="bento-card kpi-card">
                <span className="kpi-title">Infraestructura Total</span>
                <span className="kpi-value">{totalDevices}</span>
              </div>
              <div className="bento-card kpi-card" style={{ background: onlineCount > 0 ? 'rgba(16, 185, 129, 0.05)' : '' }}>
                <span className="kpi-title">Nodos Activos</span>
                <span className="kpi-value" style={{ color: 'var(--success)' }}>{onlineCount}</span>
              </div>
              <div className="bento-card kpi-card" style={{ background: offlineCount > 0 ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                <span className="kpi-title">Nodos Caídos</span>
                <span className="kpi-value" style={{ color: offlineCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{offlineCount}</span>
              </div>
              <div className="bento-card kpi-card">
                <span className="kpi-title">Estrés Promedio</span>
                <span className="kpi-value">{avgCpu}<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>%</span></span>
              </div>
            </div>

            {/* GRID DE DISPOSITIVOS */}
            <div className="bento-grid">
              {devices.map(dev => {
                const isOnline = dev.status === 'Online';
                const isWarning = isOnline && dev.cpu > 85;
                const statusColor = !isOnline ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)';

                return (
                  <div key={dev.ip} className="bento-card device-card" onClick={() => setSelectedIp(dev.ip)}>
                    
                    {/* Header de la tarjeta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '500' }}>{dev.name}</h3>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{dev.ip}</div>
                      </div>
                      <div style={{ 
                        width: '12px', height: '12px', borderRadius: '50%', background: statusColor,
                        boxShadow: `0 0 12px ${statusColor}`,
                        animation: isWarning ? 'pulse-live 1s infinite' : 'none'
                      }}></div>
                    </div>

                    {/* Info de la tarjeta */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Uptime</span>
                        <span style={{ fontWeight: '500' }}>{isOnline ? formatUptime(dev.uptime) : 'Offline'}</span>
                      </div>
                      
                      {isOnline && (
                        <div style={{ marginTop: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>CPU</span>
                            <span style={{ fontWeight: '500', color: isWarning ? 'var(--warning)' : 'inherit' }}>{dev.cpu}%</span>
                          </div>
                          <div className="neon-progress-bg">
                            <div className="neon-progress-fill" style={{ 
                              width: `${dev.cpu}%`, 
                              background: statusColor,
                              boxShadow: `0 0 10px ${statusColor}` // Brillo de neón
                            }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL / BOTTOM SHEET */}
      {activeDevice && (
        <div className="modal-overlay" onClick={() => setSelectedIp(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: '600' }}>{activeDevice.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{activeDevice.ip}</div>
              </div>
              <button 
                onClick={() => setSelectedIp(null)} 
                style={{ 
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', 
                  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ✕
              </button>
            </div>

            <div style={{ 
              background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: 'var(--radius-md)', 
              border: '1px solid rgba(255,255,255,0.03)' 
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Estado del Enlace</span>
                  <span style={{ 
                    color: activeDevice.status === 'Online' ? 'var(--success)' : 'var(--danger)', 
                    fontWeight: '500', background: activeDevice.status === 'Online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    padding: '4px 12px', borderRadius: '100px'
                  }}>
                    {activeDevice.status}
                  </span>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tiempo Activo Continuo</span>
                  <span style={{ fontWeight: '500' }}>{activeDevice.status === 'Online' ? formatUptime(activeDevice.uptime) : 'N/A'}</span>
               </div>

               <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Rendimiento CPU</span>
                    <span style={{ fontWeight: '600' }}>{activeDevice.status === 'Online' ? `${activeDevice.cpu}%` : '---'}</span>
                  </div>
                  <div className="neon-progress-bg" style={{ height: '8px' }}>
                    <div className="neon-progress-fill" style={{ 
                      width: `${activeDevice.status === 'Online' ? activeDevice.cpu : 0}%`, 
                      background: activeDevice.cpu > 85 ? 'var(--warning)' : 'var(--success)',
                      boxShadow: `0 0 12px ${activeDevice.cpu > 85 ? 'var(--warning)' : 'var(--success)'}`
                    }}></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
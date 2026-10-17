import { useState, useEffect } from 'react';
import EditDeviceModal from './EditDeviceModal';

export default function SettingsView({ devices }) {
  const [editingDevice, setEditingDevice] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('nodes'); 
  
  // Estado para la configuración de SNMP
  const [snmpSettings, setSnmpSettings] = useState({
    port: 161, version: 'v2c', timeout: 5000, retries: 1
  });

  // Cargar configuración actual desde el backend al abrir
  useEffect(() => {
    fetch('http://localhost:3001/api/settings/snmp')
      .then(res => res.json())
      .then(data => setSnmpSettings(data))
      .catch(err => console.error("Error al cargar settings:", err));
  }, []);

  const handleDelete = async (ip, name) => {
    if (window.confirm(`¿Desvincular y destruir el nodo ${name} (${ip})?`)) {
      await fetch(`http://localhost:3001/api/devices/${ip}`, { method: 'DELETE' });
    }
  };

  const toggleReveal = (ip) => setRevealed(prev => ({ ...prev, [ip]: !prev[ip] }));

  // Guardar configuración SNMP en el backend
  const handleSaveSettings = async () => {
    try {
      await fetch('http://localhost:3001/api/settings/snmp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snmpSettings)
      });
      alert("✅ Ajustes globales de SNMP guardados aplicados con éxito.");
    } catch (error) {
      alert("❌ Error al conectar con el backend.");
    }
  };

  // Manejador de cambios para los inputs
  const handleChange = (e) => {
    setSnmpSettings({ ...snmpSettings, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px' }}>
      <style>{`
        /* Sub-Navegación */
        .sub-tab-container { display: flex; gap: 32px; border-bottom: 1px solid var(--glass-border); padding-bottom: 0; margin-bottom: 32px; }
        .sub-tab { background: transparent; border: none; color: var(--text-muted); font-size: 0.95rem; font-weight: 500; padding: 0 0 16px 0; cursor: pointer; position: relative; transition: color 0.2s; }
        .sub-tab:hover { color: var(--text-main); }
        .sub-tab.active { color: var(--accent); font-weight: 600; }
        .sub-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--accent); border-radius: 2px 2px 0 0; box-shadow: 0 -2px 10px rgba(59,130,246,0.5); }
        
        /* Grid y Tarjetas */
        .node-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; overflow-y: auto; padding-right: 12px; }
        .node-card { background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--glass-border); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 20px; transition: all 0.3s; }
        .node-card:hover { border-color: rgba(59, 130, 246, 0.3); transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5); }
        .ip-gradient { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 300; background: linear-gradient(90deg, #fff, #aeb2b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .secret-pill { display: inline-flex; gap: 8px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); padding: 6px 12px; border-radius: 8px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); cursor: pointer; }
        .card-actions { display: flex; gap: 12px; margin-top: auto; border-top: 1px solid var(--glass-border); padding-top: 20px; }
        .action-btn { flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 10px; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 500;}
        .action-btn.delete { color: var(--danger); border-color: rgba(244, 63, 94, 0.2); }
        
        /* Panel SNMP */
        .snmp-panel { background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--glass-border); border-radius: 20px; padding: 32px; max-width: 500px; }
      `}</style>

      {/* --- HEADER --- */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '2.2rem', fontWeight: '600', letterSpacing: '-1px' }}>Settings</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Gestión de infraestructura y credenciales globales.
        </p>
      </div>

      {/* --- SUB-NAVEGACIÓN --- */}
      <div className="sub-tab-container">
        <button className={`sub-tab ${activeSubTab === 'nodes' ? 'active' : ''}`} onClick={() => setActiveSubTab('nodes')}>
          Infrastructure Nodes
        </button>
        <button className={`sub-tab ${activeSubTab === 'snmp' ? 'active' : ''}`} onClick={() => setActiveSubTab('snmp')}>
          SNMP Configuration
        </button>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      {activeSubTab === 'nodes' ? (
        
        <div className="node-grid">
          {devices.length === 0 ? (
             <div style={{ gridColumn: '1 / -1', padding: '80px 20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px' }}>
             <p style={{ color: 'var(--text-muted)' }}>Sin Nodos Activos</p>
           </div>
          ) : (
            devices.map(dev => (
              <div key={dev.ip} className="node-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dev.status === 'Online' ? 'var(--success)' : 'var(--danger)' }}></div>
                    <span style={{ fontWeight: '600' }}>{dev.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>SNMPv2c</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>IPv4 Address</div>
                  <div className="ip-gradient">{dev.ip}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Community String</div>
                  <button className="secret-pill" onClick={() => toggleReveal(dev.ip)}>
                    <span style={{ opacity: 0.5 }}>{revealed[dev.ip] ? '👁️' : '🙈'}</span>
                    {revealed[dev.ip] ? dev.community : '••••••••••••'}
                  </button>
                </div>
                <div className="card-actions">
                  <button className="action-btn" onClick={() => setEditingDevice(dev)}>Configure</button>
                  <button className="action-btn delete" onClick={() => handleDelete(dev.ip, dev.name)}>Revoke</button>
                </div>
              </div>
            ))
          )}
        </div>

      ) : (

        <div className="snmp-panel">
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.3rem', fontWeight: '500' }}>Global SNMP Engine</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>Default Port</label>
              <input className="input" name="port" value={snmpSettings.port} onChange={handleChange} style={{ maxWidth: '200px' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>SNMP Version</label>
              <select className="input" name="version" value={snmpSettings.version} onChange={handleChange} style={{ maxWidth: '200px', cursor: 'pointer' }}>
                <option value="v1" style={{background: '#000'}}>SNMPv1</option>
                <option value="v2c" style={{background: '#000'}}>SNMPv2c</option>
                <option value="v3" style={{background: '#000'}}>SNMPv3</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>Timeout (ms)</label>
              <input className="input" name="timeout" value={snmpSettings.timeout} onChange={handleChange} style={{ maxWidth: '200px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>Retries</label>
              <input className="input" name="retries" value={snmpSettings.retries} onChange={handleChange} style={{ maxWidth: '200px' }} />
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
            <button className="btn-modern" style={{ background: 'var(--accent)', color: '#fff', width: '200px' }} onClick={handleSaveSettings}>
              Save Settings
            </button>
          </div>
        </div>

      )}

      {editingDevice && (
        <EditDeviceModal 
          device={editingDevice} 
          onClose={() => setEditingDevice(null)} 
        />
      )}
    </div>
  );
}
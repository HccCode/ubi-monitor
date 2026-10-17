import { useState, useEffect } from 'react';

// Sub-componente Modal de Edición (Mismo estilo Glassmorphism)
const EditDeviceModal = ({ device, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: device.name || '',
    community: device.community || 'public',
    clientIp: device.clientIp || '',
    parentIp: device.parentIp || '',
    lat: device.lat || '',
    lng: device.lng || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(device.ip, formData);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
      <div style={{ background: 'var(--bg-dark)', width: '450px', padding: '32px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff' }}>Editar Nodo</h2>
            <div className="mono-cell" style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '4px' }}>{device.ip} (IP Gestión Fija)</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hostname / Cliente</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comunidad SNMP</label>
              <input type="text" name="community" required value={formData.community} onChange={handleChange} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IP Tenda (Servicio)</label>
              <input type="text" name="clientIp" value={formData.clientIp} onChange={handleChange} placeholder="Ej. 10.4.193.x" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sectorial Padre</label>
              <input type="text" name="parentIp" value={formData.parentIp} onChange={handleChange} placeholder="IP de la antena AP" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latitud</label><input type="text" name="lat" value={formData.lat} onChange={handleChange} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} /></div>
            <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Longitud</label><input type="text" name="lng" value={formData.lng} onChange={handleChange} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} /></div>
          </div>
          
          <button type="submit" disabled={saving} style={{ background: 'var(--accent)', color: '#fff', padding: '14px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>
            {saving ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
};


export default function SettingsView({ devices }) {
  const [activeTab, setActiveTab] = useState('nodes');
  const [snmpSettings, setSnmpSettings] = useState({ port: 161, version: 'v2c', timeout: 5000, retries: 1 });
  const [loadingSnmp, setLoadingSnmp] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null); // Estado para controlar el modal

  useEffect(() => {
    fetch('http://localhost:3001/api/settings/snmp')
      .then(res => res.json())
      .then(data => setSnmpSettings(data))
      .catch(err => console.error("Error cargando SNMP settings:", err));
  }, []);

  const handleRevoke = async (ip) => {
    if (!window.confirm(`¿Estás seguro de que deseas revocar el nodo ${ip}?`)) return;
    try {
      await fetch(`http://localhost:3001/api/devices/${ip}`, { method: 'DELETE' });
    } catch (e) {
      alert("Error eliminando nodo");
    }
  };

  const handleSaveDevice = async (ip, updatedData) => {
    try {
      const res = await fetch(`http://localhost:3001/api/devices/${ip}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) {
        alert("Error al actualizar la configuración");
      } else {
        setEditingDevice(null); // Cierra el modal al tener éxito
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    }
  };

  const handleSaveSnmp = async (e) => {
    e.preventDefault();
    setLoadingSnmp(true);
    try {
      const res = await fetch('http://localhost:3001/api/settings/snmp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snmpSettings)
      });
      if (res.ok) alert('Configuración SNMP global actualizada');
      else alert('Error al guardar ajustes');
    } catch (error) {
      alert('Error de conexión');
    }
    setLoadingSnmp(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      
      {/* Modal Condicional */}
      {editingDevice && (
        <EditDeviceModal 
          device={editingDevice} 
          onClose={() => setEditingDevice(null)} 
          onSave={handleSaveDevice} 
        />
      )}

      {/* Cabecera Fija */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestión de infraestructura y credenciales globales.</p>
      </div>

      {/* Pestañas Fijas */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('nodes')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'nodes' ? '2px solid var(--accent)' : 'none', color: activeTab === 'nodes' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '5px', fontWeight: 'bold' }}
        >
          Infrastructure Nodes
        </button>
        <button 
          onClick={() => setActiveTab('snmp')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'snmp' ? '2px solid var(--accent)' : 'none', color: activeTab === 'snmp' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '5px', fontWeight: 'bold' }}
        >
          SNMP Configuration
        </button>
      </div>

      {/* ÁREA CON SCROLL */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
        
        {activeTab === 'nodes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {devices.map(dev => (
              <div key={dev.ip} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dev.status === 'Online' ? 'var(--success)' : 'var(--danger)' }}></span>
                    {dev.name}
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>SNMPv2c</span>
                </div>
                
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>IPv4 Address</div>
                  <div className="mono-cell" style={{ color: '#fff', fontSize: '1.8rem', margin: '5px 0' }}>{dev.ip}</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Community String</div>
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '8px', display: 'inline-block', marginTop: '5px', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    🐵 {dev.community.replace(/./g, '•')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Al hacer clic, abrimos el modal pasándole el equipo */}
                  <button onClick={() => setEditingDevice(dev)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}>Configure</button>
                  <button onClick={() => handleRevoke(dev.ip)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}>Revoke</button>
                </div>
              </div>
            ))}
            {devices.length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>
                No hay equipos registrados en el sistema.
              </div>
            )}
          </div>
        )}

        {activeTab === 'snmp' && (
          <form onSubmit={handleSaveSnmp} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: '12px', maxWidth: '500px', margin: '0 auto' }}>
            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>Global SNMP Parameters</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>Puerto UDP</label>
              <input type="number" value={snmpSettings.port} onChange={e => setSnmpSettings({...snmpSettings, port: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>Versión SNMP</label>
              <select value={snmpSettings.version} onChange={e => setSnmpSettings({...snmpSettings, version: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }}>
                <option value="v1">SNMP v1</option>
                <option value="v2c">SNMP v2c</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>Timeout (ms)</label>
              <input type="number" value={snmpSettings.timeout} onChange={e => setSnmpSettings({...snmpSettings, timeout: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>Reintentos</label>
              <input type="number" value={snmpSettings.retries} onChange={e => setSnmpSettings({...snmpSettings, retries: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
            </div>

            <button type="submit" disabled={loadingSnmp} style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loadingSnmp ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
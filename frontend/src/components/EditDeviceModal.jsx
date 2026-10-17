import { useState } from 'react';

export default function EditDeviceModal({ device, onClose }) {
  const [name, setName] = useState(device.name || '');
  const [community, setCommunity] = useState(device.community || 'public');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3001/api/devices/${device.ip}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, community })
      });
      onClose();
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  return (
    <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div 
        style={{ background: 'linear-gradient(145deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98))', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)' }} 
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '1.5rem' }}>Configure Node</h3>
        <p className="mono-cell" style={{ marginBottom: '32px' }}>{device.ip}</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Hostname</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>SNMP Community</label>
            <input className="input" value={community} onChange={e => setCommunity(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-modern" style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-modern" style={{ flex: 1, background: 'var(--accent)', color: '#fff' }}>Save Config</button>
          </div>
        </form>
      </div>
    </div>
  );
}
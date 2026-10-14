import { useState } from 'react';

export default function EditDeviceModal({ device, onClose }) {
  const [name, setName] = useState(device.name || '');
  const [community, setCommunity] = useState(device.community || 'public');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviamos el método PUT o PATCH a la API para actualizar
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
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 24px 0', fontWeight: '600', fontSize: '1.2rem' }}>Edit Node: {device.ip}</h3>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>IP Address (Read-Only)</label>
          <input className="input" value={device.ip} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />

          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>Hostname</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} required />

          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>SNMP Community</label>
          <input className="input" value={community} onChange={e => setCommunity(e.target.value)} required />

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" style={{ flex: 1, background: 'var(--unifi-blue)' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
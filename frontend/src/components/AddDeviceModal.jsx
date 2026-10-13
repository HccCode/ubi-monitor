import { useState } from 'react';

export default function AddDeviceModal({ onClose, onSuccess }) {
  const [ip, setIp] = useState('');
  const [name, setName] = useState('');
  const [community, setCommunity] = useState('public');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, name, community })
    });
    onSuccess();
  };

  return (
    <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 24px 0' }}>Provision New Node</h3>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>Hostname</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="core-router-01" required />

          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>IP Address</label>
          <input className="input" value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.1" required />

          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>SNMP Community</label>
          <input className="input" value={community} onChange={e => setCommunity(e.target.value)} placeholder="public" required />

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" style={{ flex: 1 }}>Add Node</button>
          </div>
        </form>
      </div>
    </div>
  );
}
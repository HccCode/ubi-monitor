import { useState } from 'react';

export default function AddDeviceModal({ onClose }) {
  const [ip, setIp] = useState('');
  const [name, setName] = useState('');
  const [community, setCommunity] = useState('public');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:3001/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, name, community })
      });
      onClose(); 
    } catch (error) {
      console.error("Error al provisionar el nodo:", error);
    }
  };

  return (
    <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div 
        style={{ background: 'linear-gradient(145deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '1.5rem' }}>Provision Node</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', marginTop: 0 }}>Registra un nuevo equipo para monitoreo SNMP.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Hostname</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="SW-CORE-01" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>IPv4 Address</label>
            <input className="input" value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.254" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>SNMP Community</label>
            <input className="input" value={community} onChange={e => setCommunity(e.target.value)} placeholder="public" required />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-modern" style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-modern" style={{ flex: 1, background: '#fff', color: '#000' }}>Deploy Node</button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useState } from 'react';

export default function AddDeviceModal({ onClose }) {
  const [ip, setIp] = useState('');
  const [clientIp, setClientIp] = useState(''); // <-- Nuevo estado para la IP del Tenda
  const [name, setName] = useState('');
  const [community, setCommunity] = useState('public');
  const [parentIp, setParentIp] = useState('');
  const [lat, setLat] = useState('32.6245');
  const [lng, setLng] = useState('-115.4523');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos ambas IPs al servidor
        body: JSON.stringify({ ip, clientIp, name, community, lat: parseFloat(lat), lng: parseFloat(lng), parentIp: parentIp || null })
      });
      if (res.ok) onClose();
      else alert((await res.json()).error || 'Error al provisionar');
    } catch (error) { alert('Error de conexión'); }
    setLoading(false);
  };

  const getMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); },
        err => alert("Activa el GPS.")
      );
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
      <div style={{ background: 'var(--bg-dark)', width: '450px', padding: '32px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#fff' }}>Provisionar Equipo</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IP Antena (Ej. 10.1.3.50)</label>
              <input type="text" required value={ip} onChange={e => setIp(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IP Tenda (Ej. 10.4.193.10)</label>
              <input type="text" value={clientIp} onChange={e => setClientIp(e.target.value)} placeholder="Opcional" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff' }} />
            </div>
          </div>

          <div><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hostname / Cliente</label><input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff' }} /></div>
          
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 'bold' }}>Conectado a (Sectorial Padre)</label>
            <input type="text" value={parentIp} onChange={e => setParentIp(e.target.value)} placeholder="IP de la Antena Sectorial" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latitud</label><input type="text" value={lat} onChange={e => setLat(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff' }} /></div>
            <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Longitud</label><input type="text" value={lng} onChange={e => setLng(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff' }} /></div>
          </div>
          <button type="button" onClick={getMyLocation} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>📍 GPS Actual</button>
          
          <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: '#fff', padding: '14px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>{loading ? 'Guardando...' : '➕ Adoptar Equipo'}</button>
        </form>
      </div>
    </div>
  );
}
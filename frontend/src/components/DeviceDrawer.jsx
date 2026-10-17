import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DeviceDrawer({ device, onClose }) {
  const isOnline = device.status === 'Online';
  const isSuspended = device.suspended === true; // Nuevo estado del CRM
  
  const signalQualityColor = !isOnline ? 'var(--danger)' : (device.signal < -75 ? 'var(--danger)' : device.signal < -65 ? 'var(--warning)' : 'var(--success)');
  const glowColor = !isOnline ? 'var(--danger)' : (isSuspended ? '#f43f5e' : signalQualityColor);
  const trafficData = device.trafficHistory || [];

  const [testing, setTesting] = useState(false);
  const [speedResult, setSpeedResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  const runSpeedtest = async () => {
    setTesting(true);
    setSpeedResult(null);
    try {
      const res = await fetch(`http://localhost:3001/api/devices/${device.ip}/speedtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Pro029240937' })
      });
      const data = await res.json();
      if(data.success) setSpeedResult(data);
    } catch (e) { console.error(e); }
    setTesting(false);
  };

  // --- NUEVA LÓGICA: Alternar Suspensión ---
  const toggleSuspension = async () => {
    setProcessing(true);
    const endpoint = isSuspended ? 'resume' : 'suspend';
    try {
      await fetch(`http://localhost:3001/api/devices/${device.ip}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: 'admin', 
          password: 'Pro029240937', 
          serverIp: '10.4.193.55' // <-- CAMBIA ESTO por la IP local de tu PC/Servidor Node.js
        })
      });
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="drawer-overlay" style={{ justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '640px', background: 'var(--bg-dark)', borderLeft: '1px solid var(--glass-border)', padding: '40px', animation: 'slideIn 0.3s', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .custom-tooltip { background: rgba(0,0,0,0.8); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; }
        `}</style>

        {/* --- HEADER CON BOTONES CRM --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: glowColor, boxShadow: `0 0 15px ${glowColor}` }}></div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '400', letterSpacing: '-1px', color: isSuspended ? '#f43f5e' : '#fff' }}>
                {device.name} {isSuspended && '(SUSPENDIDO)'}
              </h2>
            </div>
            <div className="mono-cell" style={{ fontSize: '0.9rem' }}>{device.ip}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            
            {/* BOTÓN DEL PORTAL CAUTIVO */}
            <button 
              className="btn-modern" 
              onClick={toggleSuspension} 
              disabled={processing || !isOnline} 
              style={{ background: isSuspended ? 'var(--success)' : 'rgba(244, 63, 94, 0.1)', color: isSuspended ? '#fff' : '#f43f5e', border: isSuspended ? 'none' : '1px solid #f43f5e', padding: '8px 14px' }}
            >
              {processing ? '...' : isSuspended ? '🟢 Reactivar' : '🔴 Suspender'}
            </button>

            <button className="btn-modern" onClick={runSpeedtest} disabled={testing || !isOnline} style={{ background: 'var(--accent)', color: '#fff', padding: '8px 14px' }}>
              {testing ? 'Auditing...' : '⚡ Speedtest'}
            </button>
            <button className="btn-modern" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '8px 14px' }} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* --- MATRIZ DE RADIOFRECUENCIA AVANZADA --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>Señal</div>
            <div className="mono-cell" style={{ color: !isOnline ? 'var(--text-muted)' : (device.signal < -75 ? 'var(--danger)' : 'var(--success)'), fontSize: '1.1rem' }}>{isOnline && device.signal ? `${device.signal} dBm` : '---'}</div>
          </div>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>Ruido</div>
            <div className="mono-cell" style={{ color: !isOnline ? 'var(--text-muted)' : (device.noise > -85 ? 'var(--warning)' : 'var(--accent)'), fontSize: '1.1rem' }}>{isOnline && device.noise ? `${device.noise} dBm` : '---'}</div>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '14px', borderRadius: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>SNR</div>
            <div className="mono-cell" style={{ color: !isOnline ? 'var(--text-muted)' : (device.snr < 15 ? 'var(--danger)' : device.snr >= 25 ? 'var(--success)' : 'var(--warning)'), fontSize: '1.1rem', fontWeight: 'bold' }}>{isOnline && device.snr ? `${device.snr} dB` : '---'}</div>
          </div>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>CCQ</div>
            <div className="mono-cell" style={{ color: !isOnline ? 'var(--text-muted)' : (device.ccq < 80 ? 'var(--warning)' : 'var(--accent)'), fontSize: '1.1rem' }}>{isOnline && device.ccq ? `${device.ccq}%` : '---'}</div>
          </div>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>STAs</div>
            <div className="mono-cell" style={{ color: '#fff', fontSize: '1.1rem' }}>{isOnline && device.clients !== undefined ? device.clients : '0'}</div>
          </div>
        </div>

        {/* --- RESULTADO DEL SPEEDTEST --- */}
        {speedResult && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '16px', borderRadius: '8px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span style={{ display: 'block', color: 'var(--success)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}>Active Audit Result</span></div>
            <div className="mono-cell" style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', gap: '15px' }}><span style={{ color: 'var(--accent)' }}>DL: {speedResult.download} Mbps</span><span style={{ color: 'var(--success)' }}>UL: {speedResult.upload} Mbps</span></div>
          </div>
        )}

        {/* --- GRÁFICO DE TRÁFICO EN VIVO --- */}
        <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Network Traffic (Mbps)</span>
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            {isOnline ? (
              <ResponsiveContainer>
                <AreaChart data={trafficData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--success)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="rx" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorRx)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="tx" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No telemetry available</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '0.85rem' }}>Hora: {payload[0].payload.time}</p>
        <p style={{ margin: 0, color: 'var(--accent)', fontSize: '0.85rem' }} className="mono-cell">Rx: {payload[0].value} Mbps</p>
        <p style={{ margin: 0, color: 'var(--success)', fontSize: '0.85rem' }} className="mono-cell">Tx: {payload[1].value} Mbps</p>
      </div>
    );
  }
  return null;
};
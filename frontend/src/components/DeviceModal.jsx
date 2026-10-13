import { formatUptime } from '../utils/timeFormat';

export default function DeviceModal({ device, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: '600' }}>{device.name}</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{device.ip}</div>
          </div>
          <button 
            onClick={onClose} 
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
                color: device.status === 'Online' ? 'var(--success)' : 'var(--danger)', 
                fontWeight: '500', background: device.status === 'Online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '4px 12px', borderRadius: '100px'
              }}>
                {device.status}
              </span>
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tiempo Activo Continuo</span>
              <span style={{ fontWeight: '500' }}>{device.status === 'Online' ? formatUptime(device.uptime) : 'N/A'}</span>
           </div>

           <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Rendimiento CPU</span>
                <span style={{ fontWeight: '600' }}>{device.status === 'Online' ? `${device.cpu}%` : '---'}</span>
              </div>
              <div className="neon-progress-bg" style={{ height: '8px' }}>
                <div className="neon-progress-fill" style={{ 
                  width: `${device.status === 'Online' ? device.cpu : 0}%`, 
                  background: device.cpu > 85 ? 'var(--warning)' : 'var(--success)',
                  boxShadow: `0 0 12px ${device.cpu > 85 ? 'var(--warning)' : 'var(--success)'}`
                }}></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
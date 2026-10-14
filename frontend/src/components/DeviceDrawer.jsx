import { formatUptime } from '../utils/timeFormat';

export default function DeviceDrawer({ device, onClose }) {
  const isOnline = device.status === 'Online';
  const isWarning = isOnline && device.cpu > 85;
  const color = !isOnline ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)';

  const handleDelete = async () => {
    if (window.confirm(`Remove ${device.name} from monitoring?`)) {
      await fetch(`http://localhost:3001/api/devices/${device.ip}`, { method: 'DELETE' });
      onClose();
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', letterSpacing: '-0.5px' }}>{device.name}</h2>
            <div className="mono-text">{device.ip}</div>
          </div>
          <button className="btn-outline" onClick={onClose} style={{ padding: '6px 12px', borderRadius: '6px' }}>Esc</button>
        </div>

        <div className="drawer-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ color: 'var(--muted)' }}>Status</span>
            <span style={{ color: color, fontWeight: '500' }}>{device.status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Uptime</span>
            <span className="mono-text" style={{ color: 'var(--text)' }}>
              {isOnline ? formatUptime(device.uptime) : 'Offline'}
            </span>
          </div>
        </div>

        <div className="drawer-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--muted)' }}>CPU Utilization</span>
            <span className="mono-text" style={{ color: isWarning ? 'var(--warning)' : 'var(--text)' }}>
              {isOnline ? `${device.cpu}%` : '0%'}
            </span>
          </div>
          
          <div style={{ background: '#000', height: '4px', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ 
              width: `${isOnline ? device.cpu : 0}%`, 
              height: '100%', 
              background: color,
              transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}></div>
          </div>
        </div>

        <div className="drawer-section">
          <button className="btn-outline" onClick={handleDelete} style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(248, 113, 113, 0.2)' }}>
            Remove Device
          </button>
        </div>

      </div>
    </div>
  );
}
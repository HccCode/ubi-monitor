import { formatUptime } from '../utils/timeFormat';

export default function DeviceCard({ device, onSelect }) {
  const isOnline = device.status === 'Online';
  const isWarning = isOnline && device.cpu > 85;
  const statusColor = !isOnline ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="bento-card device-card" onClick={onSelect}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '500' }}>{device.name}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{device.ip}</div>
        </div>
        <div style={{ 
          width: '12px', height: '12px', borderRadius: '50%', background: statusColor,
          boxShadow: `0 0 12px ${statusColor}`,
          animation: isWarning ? 'pulse-live 1s infinite' : 'none'
        }}></div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Uptime</span>
          <span style={{ fontWeight: '500' }}>{isOnline ? formatUptime(device.uptime) : 'Offline'}</span>
        </div>
        
        {isOnline && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>CPU</span>
              <span style={{ fontWeight: '500', color: isWarning ? 'var(--warning)' : 'inherit' }}>{device.cpu}%</span>
            </div>
            <div className="neon-progress-bg">
              <div className="neon-progress-fill" style={{ 
                width: `${device.cpu}%`, 
                background: statusColor,
                boxShadow: `0 0 10px ${statusColor}`
              }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
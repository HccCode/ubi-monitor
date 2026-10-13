export default function DeviceList({ devices, onSelect }) {
  if (devices.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>No nodes provisioned.</div>;
  }

  return (
    <div>
      {devices.map(dev => {
        const isOnline = dev.status === 'Online';
        const isWarning = isOnline && dev.cpu > 85;
        const color = !isOnline ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)';

        return (
          <div key={dev.ip} className="list-row" onClick={() => onSelect(dev.ip)}>
            <div style={{ fontWeight: '500' }}>{dev.name}</div>
            <div className="mono-text">{dev.ip}</div>
            <div>
              <span className="badge" style={{ borderColor: isOnline ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)' }}>
                <span className="dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }}></span>
                {dev.status}
              </span>
            </div>
            <div className="mono-text" style={{ textAlign: 'right', color: isWarning ? 'var(--warning)' : '' }}>
              {isOnline ? `${dev.cpu}%` : '---'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
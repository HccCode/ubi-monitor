export default function DeviceTable({ devices, selectedIp, onSelect }) {
  return (
    <table className="unifi-table">
      <thead>
        <tr>
          <th style={{ width: '50px' }}>Type</th>
          <th>Name</th>
          <th>Application</th>
          <th>Status</th>
          <th>IP Address</th>
        </tr>
      </thead>
      <tbody>
        {devices.map(dev => {
          const isSelected = dev.ip === selectedIp;
          const isOnline = dev.status === 'Online';
          const dotColor = isOnline ? 'var(--unifi-green)' : 'var(--unifi-red)';

          return (
            <tr 
              key={dev.ip} 
              className={isSelected ? 'selected' : ''}
              onClick={() => onSelect(dev.ip)}
            >
              <td style={{ textAlign: 'center' }}>
                <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', margin: '0 auto' }}></div>
              </td>
              <td style={{ fontWeight: isSelected ? '600' : '400' }}>{dev.name}</td>
              <td>Network</td>
              <td>
                <span className="status-dot" style={{ background: dotColor, marginRight: '8px' }}></span>
                {dev.status}
              </td>
              <td style={{ color: 'var(--unifi-text)' }}>{dev.ip}</td>
            </tr>
          );
        })}
        {devices.length === 0 && (
          <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No hay dispositivos registrados</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
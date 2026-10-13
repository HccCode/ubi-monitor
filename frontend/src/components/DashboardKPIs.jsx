export default function DashboardKPIs({ devices }) {
  const totalDevices = devices.length;
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = totalDevices - onlineCount;
  const onlineDevices = devices.filter(d => d.status === 'Online');
  const avgCpu = onlineDevices.length > 0 
    ? Math.round(onlineDevices.reduce((sum, dev) => sum + dev.cpu, 0) / onlineDevices.length)
    : 0;

  return (
    <div className="bento-kpis">
      <div className="bento-card kpi-card">
        <span className="kpi-title">Infraestructura Total</span>
        <span className="kpi-value">{totalDevices}</span>
      </div>
      <div className="bento-card kpi-card" style={{ background: onlineCount > 0 ? 'rgba(16, 185, 129, 0.05)' : '' }}>
        <span className="kpi-title">Nodos Activos</span>
        <span className="kpi-value" style={{ color: 'var(--success)' }}>{onlineCount}</span>
      </div>
      <div className="bento-card kpi-card" style={{ background: offlineCount > 0 ? 'rgba(239, 68, 68, 0.05)' : '' }}>
        <span className="kpi-title">Nodos Caídos</span>
        <span className="kpi-value" style={{ color: offlineCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{offlineCount}</span>
      </div>
      <div className="bento-card kpi-card">
        <span className="kpi-title">Estrés Promedio</span>
        <span className="kpi-value">{avgCpu}<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>%</span></span>
      </div>
    </div>
  );
}
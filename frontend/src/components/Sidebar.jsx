export default function Sidebar({ onAddClick }) {
  return (
    <aside className="unifi-sidebar">
      <input type="text" className="search-box" placeholder="🔍 Search" />
      
      {/* Botón Principal para Agregar Dispositivos */}
      <button 
        onClick={onAddClick}
        style={{
          background: 'var(--unifi-blue)', 
          color: '#ffffff', 
          border: 'none', 
          padding: '10px', 
          borderRadius: '4px', 
          cursor: 'pointer', 
          fontWeight: '600', 
          marginBottom: '24px',
          fontFamily: '"Inter", sans-serif',
          transition: 'background 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'var(--unifi-blue-hover)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'var(--unifi-blue)'}
      >
        + Add Device
      </button>

      {/* Filtros de Estado */}
      <div className="sidebar-section">
        <div className="sidebar-title">Status</div>
        <label className="sidebar-item">
          <input type="checkbox" /> Online
        </label>
        <label className="sidebar-item">
          <input type="checkbox" /> Offline
        </label>
      </div>

      {/* Filtros de Tipo de Dispositivo */}
      <div className="sidebar-section">
        <div className="sidebar-title">UniFi Devices</div>
        <label className="sidebar-item">
          <input type="checkbox" /> Gateway
        </label>
        <label className="sidebar-item">
          <input type="checkbox" /> Access Point
        </label>
      </div>
    </aside>
  );
}
import { useState } from 'react';
import EditDeviceModal from './EditDeviceModal';

export default function SettingsView({ devices }) {
  const [editingDevice, setEditingDevice] = useState(null);
  const [revealed, setRevealed] = useState({}); // Estado para mostrar/ocultar comunidades

  const handleDelete = async (ip, name) => {
    if (window.confirm(`¿Desvincular y destruir el nodo ${name} (${ip})?`)) {
      try {
        await fetch(`http://localhost:3001/api/devices/${ip}`, { 
          method: 'DELETE' 
        });
      } catch (error) {
        console.error("Error al eliminar el dispositivo:", error);
      }
    }
  };

  const toggleReveal = (ip) => {
    setRevealed(prev => ({ ...prev, [ip]: !prev[ip] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px' }}>
      {/* --- ESTILOS ULTRA MODERNOS INYECTADOS --- */}
      <style>{`
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
        }
        
        .node-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          overflow-y: auto;
          padding-right: 12px;
          padding-bottom: 40px;
        }

        .node-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .node-card:hover {
          background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.1);
        }

        .ip-gradient {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 300;
          letter-spacing: -1px;
          background: linear-gradient(90deg, #fff, #aeb2b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .secret-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 6px 12px;
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .secret-pill:hover {
          border-color: rgba(255,255,255,0.2);
          color: var(--text-main);
        }

        .card-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 20px;
        }

        .action-btn {
          flex: 1;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-main);
          padding: 10px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.edit:hover { background: rgba(255,255,255,0.05); }
        .action-btn.delete { color: var(--danger); border-color: rgba(244, 63, 94, 0.2); }
        .action-btn.delete:hover { background: rgba(244, 63, 94, 0.1); }
      `}</style>

      {/* --- HEADER --- */}
      <div className="settings-header">
        <div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '2.2rem', fontWeight: '600', letterSpacing: '-1px' }}>
            Infrastructure
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Ajustes avanzados, seguridad SNMP y gestión del ciclo de vida de los nodos.
          </p>
        </div>
      </div>

      {/* --- GRID DE TARJETAS --- */}
      <div className="node-grid">
        {devices.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '80px 20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.5 }}>🕸️</div>
            <h3 style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Sin Nodos Activos</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Provisiona tu primer equipo desde el panel principal.</p>
          </div>
        ) : (
          devices.map(dev => (
            <div key={dev.ip} className="node-card">
              
              {/* Header de la Tarjeta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dev.status === 'Online' ? 'var(--success)' : 'var(--danger)', boxShadow: `0 0 12px ${dev.status === 'Online' ? 'var(--success)' : 'var(--danger)'}` }}></div>
                  <span style={{ fontWeight: '600', fontSize: '0.95rem', letterSpacing: '0.5px' }}>{dev.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                  SNMPv2c
                </span>
              </div>

              {/* IP con Gradiente */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>IPv4 Address</div>
                <div className="ip-gradient">{dev.ip}</div>
              </div>

              {/* Comunidad con Toggle de Seguridad */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Community String</div>
                <button className="secret-pill" onClick={() => toggleReveal(dev.ip)}>
                  <span style={{ opacity: 0.5 }}>{revealed[dev.ip] ? '👁️' : '🙈'}</span>
                  {revealed[dev.ip] ? dev.community : '••••••••••••'}
                </button>
              </div>

              {/* Acciones */}
              <div className="card-actions">
                <button className="action-btn edit" onClick={() => setEditingDevice(dev)}>
                  Configure
                </button>
                <button className="action-btn delete" onClick={() => handleDelete(dev.ip, dev.name)}>
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL --- */}
      {editingDevice && (
        <EditDeviceModal 
          device={editingDevice} 
          onClose={() => setEditingDevice(null)} 
        />
      )}
    </div>
  );
}
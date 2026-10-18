import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// CSS para forzar que cualquier mapa libre se vuelva un oscuro "NOC"
const darkMapStyle = {
  height: '100%',
  width: '100%',
  background: '#0a0a0a',
  filter: 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%)', // Transforma OSM a Dark Mode gratis
};

// Ícono para la Antena Sectorial (AP) - Azul y más grande
const apIcon = new L.DivIcon({
  className: 'custom-icon',
  html: '<div style="background: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 15px #3b82f6; display: flex; justify-content: center; align-items: center;"><span style="font-size: 10px;">📡</span></div>',
  iconSize: [22, 22]
});

// Ícono para el Cliente (CPE) - Depende de la calidad de señal
const getCpeIcon = (signal, isOnline) => {
  if (!isOnline) return new L.DivIcon({ className: 'custom-icon', html: `<div style="background: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px #ef4444;"></div>`, iconSize: [14, 14] });
  
  const color = signal < -75 ? '#ef4444' : signal < -65 ? '#f59e0b' : '#10b981';
  return new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff;"></div>`,
    iconSize: [14, 14]
  });
};

export default function GeoMap({ devices, onSelectDevice }) {
  // Centrar el mapa en el AP principal o en el primer nodo disponible
  const centerNode = devices.find(d => !d.parentIp) || devices[0];
  const center = centerNode ? [centerNode.lat, centerNode.lng] : [32.6245, -115.4523];

  // Construir las líneas topológicas entre AP y CPEs
  const topologicalLinks = [];
  devices.forEach(dev => {
    if (dev.parentIp) {
      const parent = devices.find(d => d.ip === dev.parentIp);
      if (parent) {
        topologicalLinks.push({
          positions: [[parent.lat, parent.lng], [dev.lat, dev.lng]],
          color: dev.status === 'Online' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        });
      }
    }
  });

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      {/* Aplicamos el filtro de inversión de color aquí */}
      <div style={darkMapStyle}>
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          
          {/* Servidor Libre de OpenStreetMap (Inmune a bloqueos) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {/* Dibujar las líneas (Enlaces inalámbricos) */}
          {topologicalLinks.map((line, idx) => (
            <Polyline key={idx} positions={line.positions} color={line.color} weight={3} dashArray="5, 10" />
          ))}

          {/* Dibujar los Nodos */}
          {devices.map(dev => {
            const isAP = !dev.parentIp || (dev.children && dev.children.length > 0);
            return (
              <Marker 
                key={dev.ip} 
                position={[dev.lat, dev.lng]} 
                icon={isAP ? apIcon : getCpeIcon(dev.signal, dev.status === 'Online')}
                eventHandlers={{ click: () => onSelectDevice(dev.ip) }}
              >
                <Popup className="noc-popup">
                  {/* Nota: En el Popup deshacemos el filtro de inversión para que el texto se lea blanco natural */}
                  <div style={{ background: '#111', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', filter: 'invert(100%) hue-rotate(180deg) brightness(110%)' }}>
                    <h4 style={{ margin: '0 0 5px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAP ? '📡' : '🏠'} {dev.name}
                    </h4>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                      <div><strong>IP:</strong> {dev.ip}</div>
                      {dev.status === 'Online' ? (
                        <>
                          <div><strong>Señal:</strong> <span style={{ color: dev.signal < -75 ? '#ff4444' : '#00ff66', fontWeight: '600' }}>{dev.signal} dBm</span></div>
                          <div><strong>CCQ:</strong> {dev.ccq}%</div>
                        </>
                      ) : (
                        <div style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '5px' }}>OFFLINE</div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function GeoMap({ devices, onSelectDevice }) {
  // Centro geográfico de Mexicali
  const centerPosition = [32.6245, -115.4523];

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div style={{ padding: '20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(3,3,3,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.8rem', color: '#fff', fontWeight: 600 }}>Geolocalización WISP</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Visualización espacial de calidad de enlace (SNR)</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div> SNR {'>'} 25
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }}></div> SNR 15-25
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }}></div> SNR {'<'} 15 / Offline
            </div>
          </div>
        </div>
      </div>

      <MapContainer center={centerPosition} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        {/* Capa Dark Mode de CartoDB */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        />

        {devices.map((dev) => {
          const lat = dev.lat || 32.6245;
          const lng = dev.lng || -115.4523;
          const isOnline = dev.status === 'Online';
          const color = !isOnline ? '#f43f5e' : (dev.snr < 15 ? '#f43f5e' : dev.snr < 25 ? '#fbbf24' : '#10b981');

          return (
            <CircleMarker
              key={dev.ip}
              center={[lat, lng]}
              radius={8}
              pathOptions={{ fillColor: color, color: color, fillOpacity: 0.8, weight: 2 }}
              eventHandlers={{ click: () => onSelectDevice(dev.ip) }}
            >
              <Popup className="noc-popup">
                <div style={{ background: '#111', padding: '10px', borderRadius: '6px', color: '#fff', minWidth: '150px' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>{dev.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dev.ip}</span>
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333', color: color, fontWeight: 'bold' }}>
                    SNR: {dev.snr || '---'} dB
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      <style>{`
        .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .leaflet-popup-tip { display: none; }
      `}</style>
    </div>
  );
}
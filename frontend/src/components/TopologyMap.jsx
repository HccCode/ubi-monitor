import { useMemo, useCallback, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function TopologyMap({ devices, onSelectDevice }) {
  const graphRef = useRef();

  // Transformamos los dispositivos en Nodos y Enlaces
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

    // Nodo central (Torre Principal / Nodo Óptico)
    nodes.push({ id: 'CORE', name: 'Site Principal', group: 'core', val: 30 });

    devices.forEach(dev => {
      // Determinamos la salud RF basada en el SNR para el mapa de calor
      // SNR < 15 (Crítico/Rojo), SNR 15-25 (Alerta/Amarillo), SNR > 25 (Óptimo/Verde)
      let heatColor = 'rgba(16, 185, 129, '; // Verde por defecto
      let statusColor = '#10b981';

      if (dev.status !== 'Online') {
        heatColor = 'rgba(244, 63, 94, '; // Rojo oscuro si está caído
        statusColor = '#f43f5e';
      } else if (dev.snr && dev.snr < 15) {
        heatColor = 'rgba(244, 63, 94, '; // Foco de Interferencia (Rojo)
        statusColor = '#f43f5e';
      } else if (dev.snr && dev.snr < 25) {
        heatColor = 'rgba(251, 191, 36, '; // Zonas ruidosas (Amarillo)
        statusColor = '#fbbf24';
      }

      nodes.push({ ...dev, id: dev.ip, color: statusColor, heatColor, val: 15 });

      if (dev.name.toLowerCase().includes('loco') || dev.name.toLowerCase().includes('cpe')) {
        const ap = devices.find(d => d.name.toLowerCase().includes('powerbeam') || d.name.toLowerCase().includes('ap'));
        if (ap) {
          links.push({ source: dev.ip, target: ap.ip });
        } else {
          links.push({ source: dev.ip, target: 'CORE' });
        }
      } else {
        links.push({ source: dev.ip, target: 'CORE' });
      }
    });

    return { nodes, links };
  }, [devices]);

  useEffect(() => {
    if (graphRef.current) {
      // Configuramos las físicas para agrupar las zonas naturalmente
      graphRef.current.d3Force('charge').strength(-300);
      graphRef.current.d3Force('link').distance(70);
    }
  }, []);

  // --- MOTOR DE RENDERIZADO DEL MAPA DE CALOR ---
  const paintNode = useCallback((node, ctx, globalScale) => {
    // 1. DIBUJAR AURA TÉRMICA (HEATMAP)
    // Solo dibujamos el aura para equipos reales (no para el CORE)
    if (node.id !== 'CORE') {
      const heatRadius = 60; // Radio de expansión del calor
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, heatRadius);
      
      // El centro es más intenso, se desvanece hacia los bordes
      gradient.addColorStop(0, `${node.heatColor}0.4)`); // 40% opacidad en el centro
      gradient.addColorStop(0.5, `${node.heatColor}0.1)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');      // Transparente al final

      ctx.beginPath();
      ctx.arc(node.x, node.y, heatRadius, 0, 2 * Math.PI, false);
      ctx.fillStyle = gradient;
      // Usamos el modo "lighter" para que las auras que colisionan sumen su intensidad
      ctx.globalCompositeOperation = 'lighter'; 
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; // Restauramos el modo normal para el texto
    }

    // 2. DIBUJAR NODO FÍSICO
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px "Inter", monospace`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8); 

    // Punto central del equipo
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.id === 'CORE' ? 12 : 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#3b82f6';
    ctx.shadowColor = node.color || '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Etiqueta flotante
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 12, bckgDimensions[0], bckgDimensions[1]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(node.x - bckgDimensions[0] / 2, node.y + 12, bckgDimensions[0], bckgDimensions[1]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, node.x, node.y + 12 + bckgDimensions[1] / 2);
  }, []);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#050505' }}>
      
      <div style={{ padding: '32px', borderBottom: '1px solid var(--glass-border)', zIndex: 10, background: 'rgba(3,3,3,0.7)', backdropFilter: 'blur(10px)', position: 'absolute', top: 0, left: 0, right: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: '600', letterSpacing: '-1px' }}>RF Heatmap Analytics</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Análisis geoespacial de SNR. Las zonas rojas indican alta concentración de ruido espectral.</p>
          </div>
          {/* Leyenda de espectro */}
          <div style={{ display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.5)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}></div> SNR {'>'} 25 (Óptimo)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px rgba(251,191,36,0.5)' }}></div> SNR 15-25 (Alerta)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px rgba(244,63,94,0.5)' }}></div> SNR {'<'} 15 (Crítico)
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', marginTop: '100px' }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodeRelSize={6}
          linkColor={() => 'rgba(255, 255, 255, 0.1)'}
          linkWidth={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.003}
          onNodeClick={(node) => {
            if (node.id !== 'CORE') onSelectDevice(node.id);
          }}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current.zoomToFit(400)}
        />
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Save, RotateCcw, Trash2, PenTool, MousePointer, CheckCircle, Info } from 'lucide-react';

interface DrawRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineCode: string;
  lineName: string;
  direction: 'ida' | 'volta';
  initialPath: [number, number][];
  onSave: (newPath: [number, number][]) => void;
}

export const DrawRouteModal: React.FC<DrawRouteModalProps> = ({
  isOpen,
  onClose,
  lineCode,
  lineName,
  direction,
  initialPath,
  onSave,
}) => {
  if (!isOpen) return null;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [path, setPath] = useState<[number, number][]>(initialPath || []);
  const [mode, setMode] = useState<'click' | 'freehand'>('click');
  const [isDrawing, setIsDrawing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = path.length > 0 ? path[0] : [-3.7319, -38.5267]; // Fortaleza center
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: false,
        dragging: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Use OpenStreetMap tiles (free, no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = layerGroup;

      const polyline = L.polyline(path, {
        color: direction === 'ida' ? '#10b981' : '#06b6d4',
        weight: 5,
        opacity: 0.85,
      }).addTo(map);
      polylineRef.current = polyline;

      // Map click handler for 'click' mode
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (mode === 'click') {
          const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
          setPath((prev) => [...prev, newPt]);
        }
      });

      // Freehand drawing & right-click panning handlers
      const domContainer = map.getContainer();
      domContainer.addEventListener('contextmenu', (e) => e.preventDefault());

      let isPanningWithRight = false;
      let lastX = 0;
      let lastY = 0;

      const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 2) {
          // Right click: pan map
          isPanningWithRight = true;
          lastX = e.clientX;
          lastY = e.clientY;
          e.preventDefault();
          return;
        }

        if (e.button === 0 && mode === 'freehand') {
          // Left click: start drawing
          setIsDrawing(true);
          const containerPoint = L.point(
            e.clientX - domContainer.getBoundingClientRect().left,
            e.clientY - domContainer.getBoundingClientRect().top
          );
          const latlng = map.containerPointToLatLng(containerPoint);
          setPath((prev) => [...prev, [latlng.lat, latlng.lng]]);
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (isPanningWithRight) {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          map.panBy([-dx, -dy], { animate: false });
          return;
        }

        if (mode === 'freehand' && isDrawing) {
          const containerPoint = L.point(
            e.clientX - domContainer.getBoundingClientRect().left,
            e.clientY - domContainer.getBoundingClientRect().top
          );
          const latlng = map.containerPointToLatLng(containerPoint);
          setPath((prev) => {
            const last = prev[prev.length - 1];
            if (last && Math.abs(last[0] - latlng.lat) < 0.0001 && Math.abs(last[1] - latlng.lng) < 0.0001) {
              return prev;
            }
            return [...prev, [latlng.lat, latlng.lng]];
          });
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 2) {
          isPanningWithRight = false;
        }
        if (e.button === 0 && mode === 'freehand') {
          setIsDrawing(false);
        }
      };

      domContainer.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      mapInstanceRef.current = map;

      return () => {
        domContainer.removeEventListener('contextmenu', (e) => e.preventDefault());
        domContainer.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        map.remove();
        mapInstanceRef.current = null;
      };
    }
  }, [mode]);

  // Update polyline and markers whenever path changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(path);
    }

    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
      path.forEach((pt, index) => {
        const isStart = index === 0;
        const isEnd = index === path.length - 1;
        const color = isStart ? '#10b981' : isEnd ? '#ef4444' : '#3b82f6';
        
        if (isStart || isEnd || index % 5 === 0) {
          const circleMarker = L.circleMarker(pt, {
            radius: isStart || isEnd ? 6 : 4,
            color: '#ffffff',
            weight: 2,
            fillColor: color,
            fillOpacity: 1,
          });
          markersLayerRef.current?.addLayer(circleMarker);
        }
      });
    }
  }, [path]);

  const handleUndo = () => {
    setPath((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPath([]);
  };

  const handleSaveClick = () => {
    if (path.length < 2) {
      alert('O traçado precisa ter pelo menos 2 pontos.');
      return;
    }
    onSave(path);
    setSuccessMsg('Traçado salvo com sucesso!');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  // Calculate approximate distance
  const totalDistanceKm = React.useMemo(() => {
    if (path.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = L.latLng(path[i][0], path[i][1]);
      const p2 = L.latLng(path[i + 1][0], path[i + 1][1]);
      dist += p1.distanceTo(p2);
    }
    return (dist / 1000).toFixed(2);
  }, [path]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              {lineCode}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Desenhar Rota no Mapa ({direction === 'ida' ? 'Sentido Ida' : 'Sentido Volta'})</span>
              </h2>
              <p className="text-xs text-slate-400">{lineName} • {path.length} pontos ({totalDistanceKm} km)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Modo de Traçado:</span>
            <button
              type="button"
              onClick={() => setMode('click')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                mode === 'click'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Clique por Pontos</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('freehand')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                mode === 'freehand'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Desenho Livre (Arraste / Toque)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={path.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium disabled:opacity-50 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Desfazer Ponto</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={path.length === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-200 font-medium disabled:opacity-50 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Tudo</span>
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="px-4 py-2 bg-sky-950/60 border-b border-sky-900/50 text-[11px] text-sky-200 flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0 text-sky-400" />
          <span>
            {mode === 'click'
              ? 'Clique consecutivamente no mapa para traçar os pontos da rota. Use o botão direito do mouse para arrastar o mapa.'
              : 'Clique e arraste com o botão esquerdo para desenhar livremente. Use o botão direito do mouse (pressionar e arrastar) para mover o mapa.'}
          </span>
        </div>

        {successMsg && (
          <div className="px-4 py-2 bg-emerald-950 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative w-full h-full bg-slate-950">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Total de pontos: <span className="text-white font-bold">{path.length}</span> • Extensão aprox.: <span className="text-white font-bold">{totalDistanceKm} km</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Traçado do Mapa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

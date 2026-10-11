import React, { useState } from 'react';
import { RecordedGpsTrack, BusLine, BusStop } from '../types/bus';
import { RoutingService } from '../services/routingService';
import { StorageService } from '../services/storage';
import { X, Copy, Radio, Sparkles, Navigation, CheckCircle } from 'lucide-react';

interface ApplyGpsTrackModalProps {
  track: RecordedGpsTrack;
  lines: BusLine[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedLines: BusLine[], message: string) => void;
}

export const ApplyGpsTrackModal: React.FC<ApplyGpsTrackModalProps> = ({
  track,
  lines,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.id || '');
  const [direction, setDirection] = useState<'ida' | 'volta'>('ida');
  const [snapToStreets, setSnapToStreets] = useState(true);
  const [importMarkedStops, setImportMarkedStops] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const line = lines.find((l) => l.id === selectedLineId);
      if (!line) return;

      let finalCoords = [...track.points];

      if (snapToStreets && finalCoords.length >= 2) {
        try {
          const sampled: { lat: number; lng: number }[] = [];
          const step = Math.max(1, Math.floor(finalCoords.length / 25));
          for (let i = 0; i < finalCoords.length; i += step) {
            sampled.push({ lat: finalCoords[i][0], lng: finalCoords[i][1] });
          }
          const lastPt = finalCoords[finalCoords.length - 1];
          if (
            sampled[sampled.length - 1].lat !== lastPt[0] ||
            sampled[sampled.length - 1].lng !== lastPt[1]
          ) {
            sampled.push({ lat: lastPt[0], lng: lastPt[1] });
          }

          const snapped = await RoutingService.fetchStreetRoute(sampled, { forceRefresh: true });
          if (snapped && snapped.length > 5) {
            finalCoords = snapped;
          }
        } catch (e) {
          console.warn('Falha ao calibrar OSRM, usando coordenadas brutas de GPS:', e);
        }
      }

      const updatedLine: BusLine = {
        ...line,
        routePathIda: direction === 'ida' ? finalCoords : line.routePathIda,
        routePathVolta: direction === 'volta' ? finalCoords : line.routePathVolta,
      };

      if (importMarkedStops && track.markedStops && track.markedStops.length > 0) {
        const newStops: BusStop[] = track.markedStops.map((ms, idx) => ({
          id: 'stop-gps-' + Date.now() + '-' + idx,
          name: ms.name,
          lat: ms.lat,
          lng: ms.lng,
          order: idx + 1,
          isTerminal: idx === 0 || idx === track.markedStops!.length - 1,
          landmark: 'Gravado via GPS',
        }));

        if (direction === 'ida') {
          updatedLine.stopsIda = newStops;
        } else {
          updatedLine.stopsVolta = newStops;
        }
      }

      const updatedLines = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
      StorageService.saveLines(updatedLines);

      onSuccess(
        updatedLines,
        `Trajeto GPS copiado com sucesso para a Linha ${line.code} (${direction.toUpperCase()}) com ${finalCoords.length} pontos!`
      );
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao aplicar trajeto GPS na linha.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Copiar Trajeto GPS Gravado</h3>
              <p className="text-[11px] text-slate-400">
                {track.name} • {track.points.length} pontos • {track.totalDistanceKm} km
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Copiar para qual Linha?
            </label>
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Sentido do Itinerário:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('ida')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  direction === 'ida'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Sentido IDA</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection('volta')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  direction === 'volta'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className="w-4 h-4 text-cyan-400 rotate-180" />
                <span>Sentido VOLTA</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={snapToStreets}
                onChange={(e) => setSnapToStreets(e.target.checked)}
                className="rounded-sm bg-slate-950 border-slate-700 text-purple-600 focus:ring-0 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Calibrar percurso sobre as ruas reais com OSRM
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Ajusta os pontos do GPS exatamente ao asfalto das ruas de Fortaleza.
                </span>
              </div>
            </label>

            {track.markedStops && track.markedStops.length > 0 && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importMarkedStops}
                  onChange={(e) => setImportMarkedStops(e.target.checked)}
                  className="rounded-sm bg-slate-950 border-slate-700 text-purple-600 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-200">
                    Importar as {track.markedStops.length} paradas marcadas pelo GPS
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
          >
            {isApplying ? (
              <span>Copiando...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Copiar para a Linha Selecionada</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

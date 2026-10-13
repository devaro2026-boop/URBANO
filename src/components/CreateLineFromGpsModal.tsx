import React, { useState } from 'react';
import { RecordedGpsTrack, BusLine, BusStop } from '../types/bus';
import { RoutingService } from '../services/routingService';
import { StorageService } from '../services/storage';
import { X, PlusCircle, Radio, Sparkles, Navigation } from 'lucide-react';

interface CreateLineFromGpsModalProps {
  track: RecordedGpsTrack;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const CreateLineFromGpsModal: React.FC<CreateLineFromGpsModalProps> = ({
  track,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('0' + Math.floor(10 + Math.random() * 89));
  const [name, setName] = useState(track.name || 'Nova Rota GPS');
  const [origin, setOrigin] = useState('Terminal de Origem');
  const [destination, setDestination] = useState('Terminal de Destino');
  const [direction, setDirection] = useState<'ida' | 'volta'>('ida');
  const [snapToStreets, setSnapToStreets] = useState(true);
  const [importMarkedStops, setImportMarkedStops] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!code.trim() || !name.trim()) {
      alert('Informe o código e o nome da nova linha.');
      return;
    }

    setIsCreating(true);
    try {
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

      let stops: BusStop[] = [];
      if (importMarkedStops && track.markedStops && track.markedStops.length > 0) {
        stops = track.markedStops.map((ms, idx) => ({
          id: 'stop-gps-' + Date.now() + '-' + idx,
          name: ms.name,
          lat: ms.lat,
          lng: ms.lng,
          order: idx + 1,
          isTerminal: idx === 0 || idx === track.markedStops!.length - 1,
          landmark: 'Coletado via GPS',
        }));
      } else {
        stops = [
          {
            id: 'stop-start-' + Date.now(),
            name: origin,
            lat: finalCoords[0][0],
            lng: finalCoords[0][1],
            order: 1,
            isTerminal: true,
            landmark: 'Origem',
          },
          {
            id: 'stop-end-' + Date.now(),
            name: destination,
            lat: finalCoords[finalCoords.length - 1][0],
            lng: finalCoords[finalCoords.length - 1][1],
            order: 2,
            isTerminal: true,
            landmark: 'Destino',
          },
        ];
      }

      const newLine: BusLine = {
        id: 'line-' + Date.now(),
        code: code.trim(),
        name: name.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        routePathIda: direction === 'ida' ? finalCoords : [finalCoords[0]],
        routePathVolta: direction === 'volta' ? finalCoords : [finalCoords[0]],
        stopsIda: direction === 'ida' ? stops : [],
        stopsVolta: direction === 'volta' ? stops : [],
        estimatedDurationMinutes: Math.max(15, Math.round(track.durationSeconds / 60)),
        frequencyMinutes: 10,
        fleetCount: 4,
      };

      const existingLines = StorageService.getLines();
      StorageService.saveLines([...existingLines, newLine]);

      onSuccess(`Nova linha ${newLine.code} - ${newLine.name} criada com sucesso a partir do trajeto GPS!`);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar nova linha a partir do trajeto GPS.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Criar Nova Rota com Trajeto GPS</h3>
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
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Código</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: 045"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nome da Linha</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Parangaba / Centro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Origem</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Destino</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Sentido da Rota</label>
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
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-950/40 transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isCreating ? 'Criando Linha...' : 'Criar Nova Linha'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

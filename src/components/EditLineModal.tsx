import { BusLine, RecordedGpsTrack } from '../types/bus';
import { StorageService } from '../services/storage';
import { RoutingService } from '../services/routingService';
import {
  X,
  Save,
  Route,
  Navigation,
  Milestone,
  RotateCcw,
  Layers,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  Radio,
} from 'lucide-react';
import React, { useState } from 'react';

interface EditLineModalProps {
  line: BusLine;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedLine: BusLine) => void;
}

export const EditLineModal: React.FC<EditLineModalProps> = ({
  line,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState(line.code);
  const [name, setName] = useState(line.name);
  const [origin, setOrigin] = useState(line.origin);
  const [destination, setDestination] = useState(line.destination);
  const [category, setCategory] = useState<BusLine['category']>(line.category);
  const [color, setColor] = useState(line.color);
  const [speedLimit, setSpeedLimit] = useState(line.speedLimit || 50);
  const [frequencyMinutes, setFrequencyMinutes] = useState(line.frequencyMinutes || 12);
  const [operatingDays, setOperatingDays] = useState(line.operatingDays || 'Dias úteis');
  const [activePrefix, setActivePrefix] = useState(line.activePrefix || '02501');

  // Textual street list
  const [streetsIdaText, setStreetsIdaText] = useState((line.streetListIda || []).join('\n'));
  const [streetsVoltaText, setStreetsVoltaText] = useState((line.streetListVolta || []).join('\n'));

  // Path coordinates
  const [pathIda, setPathIda] = useState<[number, number][]>(line.routePathIda || []);
  const [pathVolta, setPathVolta] = useState<[number, number][]>(line.routePathVolta || []);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Available GPS tracks
  const recordedTracks: RecordedGpsTrack[] = StorageService.getRecordedTracks();

  const showMsg = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Recalculate route strictly following streets with OSRM
  const handleRecalculateStreets = async (direction: 'ida' | 'volta') => {
    setIsCalibrating(true);
    try {
      const stops = direction === 'ida' ? line.stopsIda : line.stopsVolta;
      if (stops.length < 2) {
        showMsg(`A rota de ${direction} precisa de pelo menos 2 paradas para traçar.`, true);
        return;
      }
      showMsg(`Buscando rota pelas ruas com OSRM para sentido ${direction}...`);
      const streetCoords = await RoutingService.fetchStreetRoute(
        stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        { forceRefresh: true }
      );
      if (direction === 'ida') {
        setPathIda(streetCoords);
      } else {
        setPathVolta(streetCoords);
      }
      showMsg(`Traçado de ${direction} calibrado com ${streetCoords.length} pontos sobre as ruas!`);
    } catch (err) {
      console.error(err);
      showMsg('Erro ao conectar com serviço de traçado de ruas.', true);
    } finally {
      setIsCalibrating(false);
    }
  };

  // Invert Ida trajectory to Volta
  const handleInvertIdaToVolta = () => {
    if (pathIda.length < 2) {
      showMsg('O traçado de Ida não tem pontos suficientes para inverter.', true);
      return;
    }
    const inverted = [...pathIda].reverse();
    setPathVolta(inverted);
    showMsg(`Traçado de volta gerado por espelhamento da Ida (${inverted.length} pontos)!`);
  };

  // Apply a recorded GPS track
  const handleApplyGpsTrack = (track: RecordedGpsTrack, targetDir: 'ida' | 'volta') => {
    if (targetDir === 'ida') {
      setPathIda(track.points);
    } else {
      setPathVolta(track.points);
    }
    showMsg(`Trajeto GPS "${track.name}" (${track.points.length} pontos) aplicado ao sentido ${targetDir}!`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      showMsg('Código e Nome da linha são obrigatórios.', true);
      return;
    }

    const updatedLine: BusLine = {
      ...line,
      code: code.trim(),
      name: name.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      category,
      color,
      speedLimit: Number(speedLimit) || 50,
      frequencyMinutes: Number(frequencyMinutes) || 12,
      operatingDays: operatingDays.trim(),
      activePrefix: activePrefix.trim(),
      streetListIda: streetsIdaText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      streetListVolta: streetsVoltaText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      routePathIda: pathIda,
      routePathVolta: pathVolta,
    };

    StorageService.updateLine(updatedLine);
    onSaved(updatedLine);
    showMsg('Linha atualizada com sucesso!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
              style={{ backgroundColor: color }}
            >
              {code || '---'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Editar Rota & Linha</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-normal">
                  ID: {line.id}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Altere dados cadastrais, itinerário de vias e traçado no mapa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              statusMsg.isError
                ? 'bg-rose-950/90 text-rose-200 border-b border-rose-800'
                : 'bg-emerald-950/90 text-emerald-200 border-b border-emerald-800'
            }`}
          >
            {statusMsg.isError ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>1. Informações Principais</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Código da Linha
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: 040"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nome da Linha
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Parangaba / Lagoa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Origem
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Terminal Parangaba"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Destino
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Terminal Lagoa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusLine['category'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Troncal">Troncal</option>
                  <option value="Inter-terminais">Inter-terminais</option>
                  <option value="Radial">Radial</option>
                  <option value="Circular">Circular</option>
                  <option value="Alimentadora">Alimentadora</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Cor da Linha
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Limite de Velocidade (km/h)
                </label>
                <input
                  type="number"
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Frequência Média (min)
                </label>
                <input
                  type="number"
                  value={frequencyMinutes}
                  onChange={(e) => setFrequencyMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Dias de Operação
                </label>
                <input
                  type="text"
                  value={operatingDays}
                  onChange={(e) => setOperatingDays(e.target.value)}
                  placeholder="Dias úteis, sábados e domingos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Trajectory & GPS Map Path */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5" />
                <span>2. Traçado no Mapa (Coordenadas Reais sobre as Ruas)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ida Path Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Sentido IDA: {pathIda.length} pontos
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRecalculateStreets('ida')}
                      disabled={isCalibrating}
                      className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Milestone className="w-3 h-3" />
                      <span>{isCalibrating ? 'Traçando...' : 'Traçar Ruas (OSRM)'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {pathIda.length > 20
                    ? `Traçado de alta fidelidade (${pathIda.length} coordenadas navegáveis).`
                    : 'Traçado simplificado ou preliminar.'}
                </p>

                {/* Apply GPS Track to Ida */}
                {recordedTracks.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-[10px] font-semibold text-purple-300 mb-1 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                      Copiar Trajeto Gravado via GPS para IDA:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {recordedTracks.slice(0, 3).map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handleApplyGpsTrack(track, 'ida')}
                          className="px-2 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-[10px] font-medium transition flex items-center gap-1"
                        >
                          <span>{track.name}</span>
                          <span className="text-[9px] text-purple-400 font-mono">
                            ({track.points.length} pts, {track.totalDistanceKm}km)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Volta Path Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    Sentido VOLTA: {pathVolta.length} pontos
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleInvertIdaToVolta}
                      title="Copiar e inverter traçado da ida para a volta"
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                      <span>Inverter da Ida</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecalculateStreets('volta')}
                      disabled={isCalibrating}
                      className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Milestone className="w-3 h-3" />
                      <span>{isCalibrating ? 'Traçando...' : 'Traçar Ruas'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {pathVolta.length > 20
                    ? `Traçado de volta com ${pathVolta.length} coordenadas pelas ruas.`
                    : 'Traçado simplificado ou preliminar.'}
                </p>

                {/* Apply GPS Track to Volta */}
                {recordedTracks.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-[10px] font-semibold text-purple-300 mb-1 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                      Copiar Trajeto Gravado via GPS para VOLTA:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {recordedTracks.slice(0, 3).map((track) => (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handleApplyGpsTrack(track, 'volta')}
                          className="px-2 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-[10px] font-medium transition flex items-center gap-1"
                        >
                          <span>{track.name}</span>
                          <span className="text-[9px] text-purple-400 font-mono">
                            ({track.points.length} pts, {track.totalDistanceKm}km)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Textual Street List (Itinerário das Ruas) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              <span>3. Ruas Percorridas (Itinerário Descritivo para o Motorista)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Ruas do Sentido IDA (uma por linha)
                </label>
                <textarea
                  rows={4}
                  value={streetsIdaText}
                  onChange={(e) => setStreetsIdaText(e.target.value)}
                  placeholder="Rua Carlos Amora&#10;Rua Gomes Brasil&#10;Avenida Osório de Paiva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Ruas do Sentido VOLTA (uma por linha)
                </label>
                <textarea
                  rows={4}
                  value={streetsVoltaText}
                  onChange={(e) => setStreetsVoltaText(e.target.value)}
                  placeholder="Avenida Augusto dos Anjos&#10;Rua Dom Pedro II&#10;Terminal Parangaba"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações da Rota</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

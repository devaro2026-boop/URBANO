import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Square,
  Copy,
  MapPin,
  Trash2,
  CheckCircle,
  Navigation,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Info,
  Car,
  X,
} from 'lucide-react';
import { useGpsRecorder } from '../hooks/useGpsRecorder';
import { BusLine } from '../types/bus';
import { StorageService } from '../services/storage';

interface GpsTrackRecorderWidgetProps {
  currentLine: BusLine;
  allLines: BusLine[];
  onLineUpdated?: (updatedLine: BusLine) => void;
  // If the parent map has current simulator coords or GPS coords, can provide them
  currentCoords?: [number, number];
  isSimulatingBus?: boolean;
  onClose?: () => void;
}

export const GpsTrackRecorderWidget: React.FC<GpsTrackRecorderWidgetProps> = ({
  currentLine,
  allLines,
  onLineUpdated,
  currentCoords,
  isSimulatingBus,
  onClose,
}) => {
  const {
    isRecording,
    isPaused,
    points,
    markedStops,
    totalDistanceKm,
    durationSeconds,
    currentAccuracy,
    currentSpeedKmh,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
    addPoint,
    markStop,
    copyToLine,
  } = useGpsRecorder();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [targetLineId, setTargetLineId] = useState<string>(currentLine.id);
  const [targetDirection, setTargetDirection] = useState<'ida' | 'volta'>('ida');
  const [snapToStreets, setSnapToStreets] = useState(true);
  const [importMarkedStops, setImportMarkedStops] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Keep targetLineId in sync if currentLine changes
  useEffect(() => {
    setTargetLineId(currentLine.id);
  }, [currentLine.id]);

  // Feed simulator coordinates to recorder if user is running test simulation while recording
  useEffect(() => {
    if (isRecording && !isPaused && currentCoords) {
      addPoint(currentCoords[0], currentCoords[1], 3, currentSpeedKmh || 30);
    }
  }, [isRecording, isPaused, currentCoords, addPoint, currentSpeedKmh]);

  const showFeedback = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startRecording();
    setIsExpanded(true);
    showFeedback('Gravação de trajeto GPS iniciada! Ande na linha para copiar o trajeto.');
  };

  const handleMarkStop = () => {
    const num = markedStops.length + 1;
    const name = prompt(`Nome da parada #${num}:`, `Parada Gravada #${num}`);
    if (name !== null) {
      markStop(name);
      showFeedback(`Parada "${name}" marcada nas coordenadas atuais.`);
    }
  };

  const handleOpenCopyModal = () => {
    if (points.length < 2) {
      showFeedback('Grave pelo menos 2 pontos GPS antes de copiar o trajeto.', true);
      return;
    }
    setShowCopyModal(true);
  };

  const handleConfirmCopy = async () => {
    setIsCopying(true);
    try {
      const res = await copyToLine(targetLineId, targetDirection, {
        snapToStreets,
        importMarkedStops,
      });

      if (res.success && res.updatedLine) {
        showFeedback(res.message);
        if (onLineUpdated) {
          onLineUpdated(res.updatedLine);
        }
        setShowCopyModal(false);
      } else {
        showFeedback(res.message, true);
      }
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao copiar trajeto para o mapa da linha.', true);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      {/* Floating GPS Recorder Pill on the map */}
      <div className="absolute top-16 right-3 z-30 flex flex-col items-end gap-2 max-w-sm">
        {/* Feedback pill */}
        {feedback && (
          <div
            className={`px-3 py-2 rounded-xl text-xs font-bold shadow-xl border flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 ${
              feedback.isError
                ? 'bg-rose-950/90 text-rose-200 border-rose-700'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Recorder Card */}
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200 w-72 sm:w-80">
          {/* Header Strip */}
          <div
            className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer border-b ${
              isRecording
                ? 'bg-purple-950/70 border-purple-800/80'
                : 'bg-slate-950/80 border-slate-800'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {isRecording && !isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isRecording
                      ? isPaused
                        ? 'bg-amber-400'
                        : 'bg-purple-500'
                      : 'bg-slate-500'
                  }`}
                ></span>
              </span>
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {isRecording
                    ? isPaused
                      ? 'GPS Pausado'
                      : 'Gravando Trajeto GPS...'
                    : 'Copiador de Trajeto GPS'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isRecording && (
                <span className="text-[11px] font-mono font-bold text-purple-300 tabular-nums">
                  {formatTime(durationSeconds)}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md"
                title={isExpanded ? 'Recolher' : 'Expandir'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
                  title="Fechar painel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats bar if recording */}
          {isRecording && (
            <div className="px-3.5 py-2 bg-purple-950/30 border-b border-purple-900/40 grid grid-cols-3 gap-1 text-center">
              <div>
                <span className="block text-[9px] uppercase font-semibold text-purple-300/80">
                  Pontos
                </span>
                <span className="text-xs font-black text-white font-mono">{points.length}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-semibold text-purple-300/80">
                  Distância
                </span>
                <span className="text-xs font-black text-white font-mono">
                  {totalDistanceKm.toFixed(2)} km
                </span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-semibold text-purple-300/80">
                  Precisão
                </span>
                <span className="text-xs font-black text-white font-mono">
                  {currentAccuracy ? `±${currentAccuracy}m` : 'Alta'}
                </span>
              </div>
            </div>
          )}

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="p-3.5 space-y-3">
              <p className="text-[11px] text-slate-400 leading-tight">
                Grave a trilha exata percorrida pelo ônibus para copiar e calibrar a rota no mapa
                automaticamente.
              </p>

              {/* Action Buttons */}
              {!isRecording ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleStart}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Gravação de Trajeto Real</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {isPaused ? (
                      <button
                        onClick={resumeRecording}
                        className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Retomar</span>
                      </button>
                    ) : (
                      <button
                        onClick={pauseRecording}
                        className="py-1.5 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pausar</span>
                      </button>
                    )}

                    <button
                      onClick={handleMarkStop}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Parada ({markedStops.length})</span>
                    </button>
                  </div>

                  <button
                    onClick={handleOpenCopyModal}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar Trajeto para Linha...</span>
                  </button>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      onClick={() => {
                        stopRecording();
                        showFeedback('Trajeto finalizado e salvo no histórico.');
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <Square className="w-3 h-3 text-rose-400 fill-rose-400" />
                      <span>Finalizar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Deseja descartar a gravação atual?')) {
                          reset();
                          showFeedback('Gravação descartada.');
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Descartar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Copiar Trajeto para Linha */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Copiar Trajeto GPS para Linha</h3>
                  <p className="text-[11px] text-slate-400">
                    Substitua o itinerário no mapa pelo percurso gravado
                  </p>
                </div>
              </div>
            </div>

            {/* Trajectory summary info */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Pontos GPS</span>
                <span className="font-bold text-white font-mono">{points.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Distância</span>
                <span className="font-bold text-white font-mono">{totalDistanceKm.toFixed(2)} km</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Paradas Marcadas</span>
                <span className="font-bold text-white font-mono">{markedStops.length}</span>
              </div>
            </div>

            {/* Target Line Select */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                Selecione a Linha de Destino:
              </label>
              <select
                value={targetLineId}
                onChange={(e) => setTargetLineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
              >
                {allLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.code} - {line.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Direction */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                Sentido a Substituir no Mapa:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetDirection('ida')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    targetDirection === 'ida'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>Sentido IDA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetDirection('volta')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    targetDirection === 'volta'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Navigation className="w-4 h-4 text-cyan-400 rotate-180" />
                  <span>Sentido VOLTA</span>
                </button>
              </div>
            </div>

            {/* Options */}
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
                    Calibrar e ajustar percurso 100% nas ruas reais (OSRM)
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Garante que o traçado siga o asfalto das curvas perfeitamente sem cortes.
                  </span>
                </div>
              </label>

              {markedStops.length > 0 && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importMarkedStops}
                    onChange={(e) => setImportMarkedStops(e.target.checked)}
                    className="rounded-sm bg-slate-950 border-slate-700 text-purple-600 focus:ring-0 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Importar as {markedStops.length} paradas marcadas
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Substitui a lista de paradas deste sentido pelas registradas pelo GPS.
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCopy}
                disabled={isCopying}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition"
              >
                {isCopying ? (
                  <span>Copiando e Calibrando...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copiar Trajeto para Linha</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

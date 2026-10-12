import React, { useState, useEffect } from 'react';
import {
  Bus,
  Plus,
  Trash2,
  Edit3,
  Clock,
  MapPin,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Truck,
  Layers,
  ChevronDown,
  ChevronUp,
  Milestone,
  Route,
  RefreshCw,
  Radio,
  ArrowUp,
  ArrowDown,
  Copy,
} from 'lucide-react';
import { BusLine, BusStop, DepartureTime, BusVehicle, RecordedGpsTrack } from '../types/bus';
import { StorageService } from '../services/storage';
import { RoutingService } from '../services/routingService';
import { EditLineModal } from './EditLineModal';
import { EditStopModal } from './EditStopModal';
import { ApplyGpsTrackModal } from './ApplyGpsTrackModal';

interface AdminDashboardProps {
  lines: BusLine[];
  vehicles: BusVehicle[];
  onLinesChange: (lines: BusLine[]) => void;
  onVehiclesChange: (vehicles: BusVehicle[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lines,
  vehicles,
  onLinesChange,
  onVehiclesChange,
}) => {
  const [activeTab, setActiveTab] = useState<'lines' | 'stops' | 'schedules' | 'vehicles' | 'gpsTracks' | 'backup'>('lines');
  const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.id || '');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [calibratingLineId, setCalibratingLineId] = useState<string | null>(null);
  const [isCalibratingAll, setIsCalibratingAll] = useState(false);

  // Edit Line Modal state
  const [editingLine, setEditingLine] = useState<BusLine | null>(null);

  // Edit Stop Modal state
  const [editingStop, setEditingStop] = useState<{ stop: BusStop; direction: 'ida' | 'volta' } | null>(null);

  // Apply GPS track modal state
  const [applyingTrack, setApplyingTrack] = useState<RecordedGpsTrack | null>(null);

  // Recorded GPS tracks list
  const [recordedTracks, setRecordedTracks] = useState<RecordedGpsTrack[]>(() =>
    StorageService.getRecordedTracks()
  );

  // Listen to recorded tracks updates
  useEffect(() => {
    const handleTracksUpdated = () => {
      setRecordedTracks(StorageService.getRecordedTracks());
    };
    window.addEventListener('vfc_recorded_tracks_updated', handleTracksUpdated);
    return () => {
      window.removeEventListener('vfc_recorded_tracks_updated', handleTracksUpdated);
    };
  }, []);

  // New Line Form state
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [newLineCode, setNewLineCode] = useState('');
  const [newLineName, setNewLineName] = useState('');
  const [newLineOrigin, setNewLineOrigin] = useState('');
  const [newLineDestination, setNewLineDestination] = useState('');
  const [newLineColor, setNewLineColor] = useState('#15803d');
  const [newLineCategory, setNewLineCategory] = useState<BusLine['category']>('Troncal');
  const [newLineSpeedLimit, setNewLineSpeedLimit] = useState(50);
  const [newLineFrequency, setNewLineFrequency] = useState(12);

  // New Stop Form state
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [stopDirection, setStopDirection] = useState<'ida' | 'volta'>('ida');
  const [newStopName, setNewStopName] = useState('');
  const [newStopLat, setNewStopLat] = useState(-3.7371);
  const [newStopLng, setNewStopLng] = useState(-38.5878);
  const [newStopLandmark, setNewStopLandmark] = useState('');
  const [newStopIsTerminal, setNewStopIsTerminal] = useState(false);

  // New Schedule Form state
  const [newDepartTime, setNewDepartTime] = useState('07:30');
  const [newDepartDriver, setNewDepartDriver] = useState('Motorista Operador');
  const [newDepartPrefix, setNewDepartPrefix] = useState('02501');
  const [newDepartDir, setNewDepartDir] = useState<'ida' | 'volta'>('ida');

  // New Vehicle Form state
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehPrefix, setNewVehPrefix] = useState('');
  const [newVehPlate, setNewVehPlate] = useState('');
  const [newVehModel, setNewVehModel] = useState('Caio Apache VIP V - MB OF-1721');
  const [newVehAC, setNewVehAC] = useState(true);

  const currentSelectedLine = lines.find((l) => l.id === selectedLineId) || lines[0];

  const showFeedback = (text: string, isError = false) => {
    setFeedbackMessage({ text, isError });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Recalculate single line street routes with OSRM
  const handleRecalculateLineStreets = async (line: BusLine) => {
    setCalibratingLineId(line.id);
    try {
      const updated = await RoutingService.recalculateLineRoutes(line);
      const updatedLines = lines.map((l) => (l.id === updated.id ? updated : l));
      onLinesChange(updatedLines);
      StorageService.saveLines(updatedLines);
      showFeedback(`🛣️ Traçado da linha ${line.code} calibrado nas ruas reais (${updated.routePathIda.length} pontos de ida)!`);
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao traçar rota pelas ruas. Tente novamente.', true);
    } finally {
      setCalibratingLineId(null);
    }
  };

  // Recalculate ALL lines with OSRM
  const handleRecalculateAllLinesStreets = async () => {
    setIsCalibratingAll(true);
    try {
      showFeedback('Iniciando calibração de todas as linhas pelas ruas reais...');
      const updated = await RoutingService.recalculateAllLines(lines);
      onLinesChange(updated);
      StorageService.saveLines(updated);
      showFeedback('🛣️ Todas as linhas foram 100% calibradas pelas ruas reais de Fortaleza!');
    } catch (err) {
      console.error(err);
      showFeedback('Falha ao recalcular todas as linhas.', true);
    } finally {
      setIsCalibratingAll(false);
    }
  };

  // Handle Create Line
  const handleCreateLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineCode.trim() || !newLineName.trim()) {
      showFeedback('Informe o código e nome da linha.', true);
      return;
    }

    const created: BusLine = {
      id: 'line-' + Date.now(),
      code: newLineCode.trim(),
      name: newLineName.trim(),
      origin: newLineOrigin.trim() || 'Terminal Origem',
      destination: newLineDestination.trim() || 'Terminal Destino',
      category: newLineCategory,
      color: newLineColor,
      speedLimit: Number(newLineSpeedLimit) || 50,
      frequencyMinutes: Number(newLineFrequency) || 15,
      operatingDays: 'Dias úteis',
      activePrefix: '02501',
      streetListIda: [newLineOrigin.trim() || 'Terminal Origem', newLineDestination.trim() || 'Terminal Destino'],
      streetListVolta: [newLineDestination.trim() || 'Terminal Destino', newLineOrigin.trim() || 'Terminal Origem'],
      maneuversIda: [
        {
          id: 'm-' + Date.now() + '-1',
          instruction: 'Siga em frente pela via principal',
          streetName: newLineOrigin.trim() || 'Terminal Origem',
          turnType: 'straight',
          lat: -3.7371,
          lng: -38.5878,
        },
      ],
      maneuversVolta: [
        {
          id: 'm-' + Date.now() + '-2',
          instruction: 'Siga em frente no retorno',
          streetName: newLineDestination.trim() || 'Terminal Destino',
          turnType: 'straight',
          lat: -3.7397,
          lng: -38.4808,
        },
      ],
      stopsIda: [
        {
          id: 'stop-' + Date.now() + '-1',
          name: newLineOrigin.trim() || 'Terminal Origem',
          lat: -3.7371,
          lng: -38.5878,
          order: 1,
          isTerminal: true,
          landmark: 'Ponto de Saída',
        },
      ],
      stopsVolta: [
        {
          id: 'stop-' + Date.now() + '-2',
          name: newLineDestination.trim() || 'Terminal Destino',
          lat: -3.7397,
          lng: -38.4808,
          order: 1,
          isTerminal: true,
          landmark: 'Ponto de Retorno',
        },
      ],
      routePathIda: [
        [-3.7371, -38.5878],
        [-3.7397, -38.4808],
      ],
      routePathVolta: [
        [-3.7397, -38.4808],
        [-3.7371, -38.5878],
      ],
      departures: [
        {
          id: 'dep-' + Date.now(),
          time: '06:00',
          driverName: 'Motorista Turno Manhã',
          vehiclePrefix: '02501',
          direction: 'ida',
          status: 'previsto',
        },
      ],
    };

    const updated = [created, ...lines];
    onLinesChange(updated);
    StorageService.saveLines(updated);
    setSelectedLineId(created.id);
    setIsAddingLine(false);
    setNewLineCode('');
    setNewLineName('');
    showFeedback(`Linha ${created.code} cadastrada com sucesso!`);
  };

  // Handle Delete Line
  const handleDeleteLine = (lineId: string) => {
    const lineToDelete = lines.find((l) => l.id === lineId);
    if (lines.length <= 1) {
      showFeedback('É necessário manter pelo menos uma linha cadastrada.', true);
      return;
    }
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a rota "${lineToDelete?.code} - ${lineToDelete?.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    const updated = lines.filter((l) => l.id !== lineId);
    onLinesChange(updated);
    StorageService.saveLines(updated);
    setSelectedLineId(updated[0]?.id || '');
    showFeedback(`Linha ${lineToDelete?.code || ''} excluída do sistema com sucesso.`);
  };

  // Reorder Stop up or down
  const handleMoveStop = (stopId: string, dir: 'ida' | 'volta', move: 'up' | 'down') => {
    if (!currentSelectedLine) return;
    const list = dir === 'ida' ? [...currentSelectedLine.stopsIda] : [...currentSelectedLine.stopsVolta];
    const idx = list.findIndex((s) => s.id === stopId);
    if (idx === -1) return;
    if (move === 'up' && idx === 0) return;
    if (move === 'down' && idx === list.length - 1) return;

    const targetIdx = move === 'up' ? idx - 1 : idx + 1;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    // re-assign order numbers
    const reordered = list.map((s, i) => ({ ...s, order: i + 1 }));
    const updatedLine: BusLine = {
      ...currentSelectedLine,
      stopsIda: dir === 'ida' ? reordered : currentSelectedLine.stopsIda,
      stopsVolta: dir === 'volta' ? reordered : currentSelectedLine.stopsVolta,
    };

    const updatedLines = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
    onLinesChange(updatedLines);
    StorageService.saveLines(updatedLines);
    showFeedback(`Ordem da parada atualizada.`);
  };

  // Handle Save Edited Stop
  const handleSaveEditedStop = (updatedStop: BusStop) => {
    if (!currentSelectedLine || !editingStop) return;
    const dir = editingStop.direction;
    const list = dir === 'ida' ? currentSelectedLine.stopsIda : currentSelectedLine.stopsVolta;
    const updatedList = list.map((s) => (s.id === updatedStop.id ? updatedStop : s));

    const updatedLine: BusLine = {
      ...currentSelectedLine,
      stopsIda: dir === 'ida' ? updatedList : currentSelectedLine.stopsIda,
      stopsVolta: dir === 'volta' ? updatedList : currentSelectedLine.stopsVolta,
    };

    const updatedLines = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
    onLinesChange(updatedLines);
    StorageService.saveLines(updatedLines);
    showFeedback(`Parada "${updatedStop.name}" atualizada com sucesso!`);
  };

  // Handle Add Stop
  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedLine || !newStopName.trim()) return;

    const targetList = stopDirection === 'ida' ? currentSelectedLine.stopsIda : currentSelectedLine.stopsVolta;
    const newStop: BusStop = {
      id: 'stop-' + Date.now(),
      name: newStopName.trim(),
      lat: Number(newStopLat),
      lng: Number(newStopLng),
      order: targetList.length + 1,
      landmark: newStopLandmark.trim(),
      isTerminal: newStopIsTerminal,
    };

    const updatedStops = [...targetList, newStop];
    const updatedLine: BusLine = {
      ...currentSelectedLine,
      stopsIda: stopDirection === 'ida' ? updatedStops : currentSelectedLine.stopsIda,
      stopsVolta: stopDirection === 'volta' ? updatedStops : currentSelectedLine.stopsVolta,
      routePathIda:
        stopDirection === 'ida'
          ? [...currentSelectedLine.routePathIda, [newStop.lat, newStop.lng]]
          : currentSelectedLine.routePathIda,
      routePathVolta:
        stopDirection === 'volta'
          ? [...currentSelectedLine.routePathVolta, [newStop.lat, newStop.lng]]
          : currentSelectedLine.routePathVolta,
    };

    const updatedLines = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
    onLinesChange(updatedLines);
    StorageService.saveLines(updatedLines);

    setIsAddingStop(false);
    setNewStopName('');
    setNewStopLandmark('');
    showFeedback(`Parada "${newStop.name}" adicionada ao itinerário.`);
  };

  // Handle Delete Stop
  const handleDeleteStop = (stopId: string, dir: 'ida' | 'volta') => {
    if (!currentSelectedLine) return;
    const list = dir === 'ida' ? currentSelectedLine.stopsIda : currentSelectedLine.stopsVolta;
    if (list.length <= 1) {
      showFeedback('A linha precisa de pelo menos uma parada.', true);
      return;
    }
    const filtered = list
      .filter((s) => s.id !== stopId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    const updatedLine: BusLine = {
      ...currentSelectedLine,
      stopsIda: dir === 'ida' ? filtered : currentSelectedLine.stopsIda,
      stopsVolta: dir === 'volta' ? filtered : currentSelectedLine.stopsVolta,
    };

    const updatedLines = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
    onLinesChange(updatedLines);
    StorageService.saveLines(updatedLines);
    showFeedback('Parada excluída.');
  };

  // Handle Add Departure
  const handleAddDeparture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedLine || !newDepartTime) return;

    const newDep: DepartureTime = {
      id: 'dep-' + Date.now(),
      time: newDepartTime,
      driverName: newDepartDriver,
      vehiclePrefix: newDepartPrefix,
      direction: newDepartDir,
      status: 'previsto',
    };

    const updatedDeps = [...currentSelectedLine.departures, newDep].sort((a, b) =>
      a.time.localeCompare(b.time)
    );
    const updatedLine = { ...currentSelectedLine, departures: updatedDeps };
    const updatedLines = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
    onLinesChange(updatedLines);
    StorageService.saveLines(updatedLines);
    showFeedback(`Horário ${newDepartTime} adicionado.`);
  };

  // Handle Delete Departure
  const handleDeleteDeparture = (depId: string) => {
    if (!currentSelectedLine) return;
    const filtered = currentSelectedLine.departures.filter((d) => d.id !== depId);
    const updatedLine = { ...currentSelectedLine, departures: filtered };
    const updatedLines = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
    onLinesChange(updatedLines);
    StorageService.saveLines(updatedLines);
    showFeedback('Horário removido.');
  };

  // Handle Add Vehicle
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehPrefix.trim()) return;

    const newVeh: BusVehicle = {
      id: 'veh-' + Date.now(),
      prefix: newVehPrefix.trim(),
      plate: newVehPlate.trim() || 'POX-0000',
      model: newVehModel.trim(),
      hasAirConditioning: newVehAC,
      hasAccessibilityLift: true,
      status: 'operando',
    };

    const updatedVehicles = [newVeh, ...vehicles];
    onVehiclesChange(updatedVehicles);
    StorageService.saveVehicles(updatedVehicles);
    setIsAddingVehicle(false);
    setNewVehPrefix('');
    setNewVehPlate('');
    showFeedback(`Carro ${newVeh.prefix} adicionado à frota.`);
  };

  // Handle Export JSON
  const handleExportJSON = () => {
    const jsonStr = StorageService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viacao_fortaleza_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showFeedback('Backup JSON exportado com sucesso!');
  };

  // Handle Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importDatabaseJSON(content);
      if (res.success) {
        onLinesChange(StorageService.getLines());
        onVehiclesChange(StorageService.getVehicles());
        showFeedback(res.message);
      } else {
        showFeedback(res.message, true);
      }
    };
    reader.readAsText(file);
  };

  // Reset to default lines
  const handleResetDefaults = () => {
    if (window.confirm('Tem certeza que deseja restaurar as linhas e veículos padrão da Viação Fortaleza?')) {
      StorageService.resetToDefaults();
      onLinesChange(StorageService.getLines());
      onVehiclesChange(StorageService.getVehicles());
      showFeedback('Dados restaurados para o padrão de fábrica.');
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Bus className="w-6 h-6 text-emerald-500" />
              Painel de Gestão Operacional & Itinerários
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Viação Fortaleza • Cadastro manual de linhas, paradas, tabelas horárias e frota
            </p>
          </div>

          {/* Line Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Linha ativa:</span>
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2"
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback alert */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
              feedbackMessage.isError
                ? 'bg-rose-950/80 border border-rose-700 text-rose-200'
                : 'bg-emerald-950/80 border border-emerald-700 text-emerald-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('lines')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'lines'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Linhas ({lines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stops')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stops'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>2. Paradas & Itinerário</span>
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schedules'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>3. Tabela de Horários ({currentSelectedLine?.departures?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'vehicles'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>4. Frota & Veículos ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gpsTracks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'gpsTracks'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Radio className="w-4 h-4 text-purple-400" />
            <span>5. Trajetos GPS Gravados ({recordedTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>6. Backup & Nuvem</span>
          </button>
        </div>

        {/* TAB 1: LINES MANAGEMENT */}
        {activeTab === 'lines' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Linhas Cadastradas</h2>
              <button
                onClick={() => setIsAddingLine(!isAddingLine)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Linha</span>
              </button>
            </div>

            {/* Create Line Form */}
            {isAddingLine && (
              <form
                onSubmit={handleCreateLine}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3"
              >
                <h3 className="text-sm font-bold text-emerald-400">Cadastrar Nova Linha</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Código da Linha (ex: 074, 026)
                    </label>
                    <input
                      type="text"
                      required
                      value={newLineCode}
                      onChange={(e) => setNewLineCode(e.target.value)}
                      placeholder="Ex: 082"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome da Linha
                    </label>
                    <input
                      type="text"
                      required
                      value={newLineName}
                      onChange={(e) => setNewLineName(e.target.value)}
                      placeholder="Ex: Antônio Bezerra / Messejana / Perimetral"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
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
                      value={newLineOrigin}
                      onChange={(e) => setNewLineOrigin(e.target.value)}
                      placeholder="Terminal Antônio Bezerra"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Destino
                    </label>
                    <input
                      type="text"
                      value={newLineDestination}
                      onChange={(e) => setNewLineDestination(e.target.value)}
                      placeholder="Terminal Messejana"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={newLineCategory}
                      onChange={(e) => setNewLineCategory(e.target.value as BusLine['category'])}
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
                      Cor Identificadora
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newLineColor}
                        onChange={(e) => setNewLineColor(e.target.value)}
                        className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-slate-400">{newLineColor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLine(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Salvar Linha
                  </button>
                </div>
              </form>
            )}

            {/* Lines List Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    line.id === selectedLineId
                      ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-sm"
                      style={{ backgroundColor: line.color }}
                    >
                      {line.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{line.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {line.origin} ➔ {line.destination}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                          {line.stopsIda.length} paradas (Ida)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                          {line.frequencyMinutes} min freq.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 items-end">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedLineId(line.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          line.id === selectedLineId
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {line.id === selectedLineId ? 'Ativa' : 'Selecionar'}
                      </button>

                      <button
                        onClick={() => setEditingLine(line)}
                        className="px-2.5 py-1 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white border border-sky-500/40 text-xs font-bold flex items-center gap-1 transition shadow-sm"
                        title="Editar nome, itinerário de vias, paradas e traçado desta rota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Rota</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRecalculateLineStreets(line)}
                        disabled={calibratingLineId === line.id}
                        title="Calibrar traçado 100% nas ruas reais com OSRM"
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition"
                      >
                        <Milestone className="w-3 h-3" />
                        <span>{calibratingLineId === line.id ? 'Traçando...' : 'Traçar Ruas'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        title="Excluir linha do sistema"
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: STOPS & ITINERARY */}
        {activeTab === 'stops' && currentSelectedLine && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Itinerário da Linha {currentSelectedLine.code}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-normal">
                    {currentSelectedLine.name}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Cadastre as paradas na ordem em que o ônibus as percorre.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Direction Switch */}
                <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
                  <button
                    onClick={() => setStopDirection('ida')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      stopDirection === 'ida'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sentido Ida ({currentSelectedLine.stopsIda.length})
                  </button>
                  <button
                    onClick={() => setStopDirection('volta')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      stopDirection === 'volta'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sentido Volta ({currentSelectedLine.stopsVolta.length})
                  </button>
                </div>

                <button
                  onClick={() => handleRecalculateLineStreets(currentSelectedLine)}
                  disabled={calibratingLineId === currentSelectedLine.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
                  title="Calcular e traçar percurso exatamente sobre o asfalto das ruas reais (OSRM)"
                >
                  <Milestone className="w-4 h-4" />
                  <span>{calibratingLineId === currentSelectedLine.id ? 'Traçando...' : 'Traçar pelas Ruas (OSRM)'}</span>
                </button>

                <button
                  onClick={() => setIsAddingStop(!isAddingStop)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Parada</span>
                </button>
              </div>
            </div>

            {/* Add Stop Form */}
            {isAddingStop && (
              <form
                onSubmit={handleAddStop}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3"
              >
                <h3 className="text-sm font-bold text-emerald-400">
                  Adicionar Parada ({stopDirection === 'ida' ? 'Ida' : 'Volta'})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome da Parada / Estação
                    </label>
                    <input
                      type="text"
                      required
                      value={newStopName}
                      onChange={(e) => setNewStopName(e.target.value)}
                      placeholder="Ex: Estação Instituto dos Cegos"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Ponto Notável / Referência
                    </label>
                    <input
                      type="text"
                      value={newStopLandmark}
                      onChange={(e) => setNewStopLandmark(e.target.value)}
                      placeholder="Ex: Av. Bezerra de Menezes, 1400"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newStopLat}
                      onChange={(e) => setNewStopLat(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newStopLng}
                      onChange={(e) => setNewStopLng(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="isTerminal"
                      checked={newStopIsTerminal}
                      onChange={(e) => setNewStopIsTerminal(e.target.checked)}
                      className="rounded-sm bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <label htmlFor="isTerminal" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      É Terminal / Ponto de Integração
                    </label>
                  </div>
                </div>

                {/* Quick Coordinates presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <span>Atalhos de Fortaleza:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStopLat(-3.7371);
                      setNewStopLng(-38.5878);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Term. Antônio Bezerra
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStopLat(-3.7397);
                      setNewStopLng(-38.4808);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Term. Papicu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStopLat(-3.8340);
                      setNewStopLng(-38.497);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Term. Messejana
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStopLat(-3.7745);
                      setNewStopLng(-38.563);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Term. Parangaba
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStopLat(-3.7700);
                      setNewStopLng(-38.4795);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Unifor
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingStop(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Gravar Parada
                  </button>
                </div>
              </form>
            )}

            {/* Stops Table */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-12 text-center">Nº</th>
                    <th className="p-3">Nome da Parada</th>
                    <th className="p-3">Referência / Local</th>
                    <th className="p-3">Coordenadas</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(stopDirection === 'ida' ? currentSelectedLine.stopsIda : currentSelectedLine.stopsVolta).map(
                    (stop) => (
                      <tr key={stop.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-center font-bold text-emerald-400">{stop.order}</td>
                        <td className="p-3 font-semibold text-white">{stop.name}</td>
                        <td className="p-3 text-slate-400">{stop.landmark || '—'}</td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                        </td>
                        <td className="p-3">
                          {stop.isTerminal ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                              ★ Terminal
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Ponto Comum</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleMoveStop(stop.id, stopDirection, 'up')}
                              disabled={stop.order === 1}
                              title="Mover parada para cima"
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition rounded hover:bg-slate-800"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveStop(stop.id, stopDirection, 'down')}
                              title="Mover parada para baixo"
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition rounded hover:bg-slate-800"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStop({ stop, direction: stopDirection })}
                              title="Editar nome ou coordenadas desta parada"
                              className="p-1 text-sky-400 hover:text-sky-300 transition rounded hover:bg-sky-950/40"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStop(stop.id, stopDirection)}
                              title="Excluir parada"
                              className="p-1 text-slate-500 hover:text-rose-400 transition rounded hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULES / DEPARTURES */}
        {activeTab === 'schedules' && currentSelectedLine && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Tabela de Horários • Linha {currentSelectedLine.code}
                </h2>
                <p className="text-xs text-slate-400">
                  Horários de saída programados para os motoristas e veículos.
                </p>
              </div>
            </div>

            {/* Quick Add Departure Form */}
            <form
              onSubmit={handleAddDeparture}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-wrap items-end gap-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Horário (HH:MM)
                </label>
                <input
                  type="time"
                  required
                  value={newDepartTime}
                  onChange={(e) => setNewDepartTime(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Sentido
                </label>
                <select
                  value={newDepartDir}
                  onChange={(e) => setNewDepartDir(e.target.value as 'ida' | 'volta')}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ida">Ida</option>
                  <option value="volta">Volta</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Carro / Prefixo
                </label>
                <input
                  type="text"
                  value={newDepartPrefix}
                  onChange={(e) => setNewDepartPrefix(e.target.value)}
                  placeholder="02501"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex-1 min-w-[180px]">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Motorista Escalado
                </label>
                <input
                  type="text"
                  value={newDepartDriver}
                  onChange={(e) => setNewDepartDriver(e.target.value)}
                  placeholder="Nome do motorista"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Partida</span>
              </button>
            </form>

            {/* Departures Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentSelectedLine.departures.map((dep) => (
                <div
                  key={dep.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
                      <span className="text-base font-black text-white tabular-nums">{dep.time}</span>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">
                        {dep.direction}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-white">{dep.driverName || 'Sem motorista'}</p>
                      <p className="text-[11px] text-slate-400">Carro: {dep.vehiclePrefix || '—'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDeparture(dep.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: VEHICLES / FLEET */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Frota de Ônibus da Viação Fortaleza</h2>
                <p className="text-xs text-slate-400">
                  Veículos cadastrados com prefixo, placa, acessibilidade e ar condicionado.
                </p>
              </div>

              <button
                onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Veículo</span>
              </button>
            </div>

            {/* Add Vehicle Form */}
            {isAddingVehicle && (
              <form
                onSubmit={handleAddVehicle}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3"
              >
                <h3 className="text-sm font-bold text-emerald-400">Adicionar Veículo à Frota</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Prefixo do Carro (ex: 02501)
                    </label>
                    <input
                      type="text"
                      required
                      value={newVehPrefix}
                      onChange={(e) => setNewVehPrefix(e.target.value)}
                      placeholder="02503"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Placa Mercosul
                    </label>
                    <input
                      type="text"
                      value={newVehPlate}
                      onChange={(e) => setNewVehPlate(e.target.value)}
                      placeholder="POX-3C45"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Modelo / Chassi
                    </label>
                    <input
                      type="text"
                      value={newVehModel}
                      onChange={(e) => setNewVehModel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="vehAC"
                      checked={newVehAC}
                      onChange={(e) => setNewVehAC(e.target.checked)}
                      className="rounded-sm bg-slate-950 border-slate-700 text-emerald-600"
                    />
                    <label htmlFor="vehAC" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Equipado com Ar Condicionado
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingVehicle(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Salvar Veículo
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {vehicles.map((veh) => (
                <div
                  key={veh.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm">
                      {veh.prefix.slice(-3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Carro {veh.prefix}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded-sm">
                          {veh.plate}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{veh.model}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {veh.hasAirConditioning && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 text-[10px] font-semibold border border-sky-800/60">
                            ❄️ Ar Condicionado
                          </span>
                        )}
                        {veh.hasAccessibilityLift && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] font-semibold border border-slate-800">
                            ♿ Acessível
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: RECORDED GPS TRACKS */}
        {activeTab === 'gpsTracks' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-400" />
                  <span>Trajetos Gravados via GPS pelos Motoristas</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 font-bold border border-purple-800">
                    {recordedTracks.length} salvos
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Histórico de trajetos percorridos e gravados por GPS. Copie a trilha para o traçado de qualquer linha.
                </p>
              </div>

              {recordedTracks.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Deseja limpar todo o histórico de trajetos GPS gravados?')) {
                      StorageService.clearRecordedTracks();
                      showFeedback('Histórico de trajetos GPS limpo.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Histórico GPS</span>
                </button>
              )}
            </div>

            {recordedTracks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 mx-auto">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white">Nenhum trajeto GPS gravado ainda</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Para gravar um trajeto real, o motorista ou fiscal pode abrir a tela de{' '}
                  <strong className="text-emerald-400">Navegação do Motorista</strong> e clicar em{' '}
                  <strong className="text-purple-400">"📡 Copiador de Trajeto GPS"</strong>. Conforme o ônibus
                  percorre a rota, o sistema registra as coordenadas e copia a rota no mapa!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recordedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                          <Radio className="w-3 h-3" />
                          <span>{new Date(track.timestamp).toLocaleDateString('pt-BR')}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(track.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white mt-1.5">{track.name}</h3>

                      {track.lineCode && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-bold text-emerald-400">
                            Linha {track.lineCode}
                          </span>
                          {track.direction && (
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Sentido {track.direction}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1 mt-3 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center text-xs">
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 block">Pontos</span>
                          <span className="font-black text-white font-mono">{track.points.length}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 block">Distância</span>
                          <span className="font-black text-white font-mono">{track.totalDistanceKm} km</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 block">Duração</span>
                          <span className="font-black text-white font-mono">
                            {Math.floor(track.durationSeconds / 60)}m {track.durationSeconds % 60}s
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setApplyingTrack(track)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar para Linha</span>
                      </button>

                      <button
                        onClick={() => {
                          const geojson = {
                            type: 'FeatureCollection',
                            features: [
                              {
                                type: 'Feature',
                                properties: { name: track.name, distanceKm: track.totalDistanceKm },
                                geometry: {
                                  type: 'LineString',
                                  coordinates: track.points.map(([lat, lng]) => [lng, lat]),
                                },
                              },
                            ],
                          };
                          const blob = new Blob([JSON.stringify(geojson, null, 2)], {
                            type: 'application/geo+json',
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `trajeto_gps_${track.id}.geojson`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        title="Baixar arquivo GeoJSON"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o trajeto gravado "${track.name}"?`)) {
                            StorageService.deleteRecordedTrack(track.id);
                            showFeedback('Trajeto excluído do histórico.');
                          }
                        }}
                        title="Excluir gravação"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BACKUP & NUVEM */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Backup e Sincronização de Dados</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Exporte todo o itinerário e frota em formato JSON para transferir entre dispositivos ou salvar cópia de segurança.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Turso Cloud Sync Card */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col justify-between gap-4">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Turso SQLite Cloud</h3>
                  <p className="text-xs text-emerald-300/80 mt-1 font-mono truncate">
                    urbano-devaro.aws-us-east-1.turso.io
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Banco de dados otimizado. Cadastre e sincronize todas as rotas e veículos na nuvem agora.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    showFeedback('Sincronizando rotas com o Turso SQLite...');
                    const res = await StorageService.forceSyncToTurso();
                    showFeedback(res.message, !res.success);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Cadastrar / Sincronizar no Turso</span>
                </button>
              </div>

              {/* OSRM Calibration Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4">
                <div>
                  <Milestone className="w-6 h-6 text-amber-400 mb-2" />
                  <h3 className="font-bold text-sm text-white">Traçado nas Ruas (OSRM)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Calibra todas as linhas para seguir 100% o asfalto das ruas de Fortaleza.
                  </p>
                </div>
                <button
                  onClick={handleRecalculateAllLinesStreets}
                  disabled={isCalibratingAll}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${isCalibratingAll ? 'animate-spin' : ''}`} />
                  <span>{isCalibratingAll ? 'Calibrando...' : 'Calibrar Todas nas Ruas'}</span>
                </button>
              </div>

              {/* Export Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4">
                <div>
                  <Download className="w-6 h-6 text-emerald-400 mb-2" />
                  <h3 className="font-bold text-sm text-white">Exportar Dados (JSON)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Baixe o arquivo com todas as linhas, paradas e horários cadastrados.
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Backup</span>
                </button>
              </div>

              {/* Import Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4">
                <div>
                  <Upload className="w-6 h-6 text-sky-400 mb-2" />
                  <h3 className="font-bold text-sm text-white">Restaurar / Importar</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Carregue um arquivo JSON salvo anteriormente para atualizar as linhas.
                  </p>
                </div>
                <label className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>Selecionar Arquivo JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4">
                <div>
                  <RotateCcw className="w-6 h-6 text-rose-400 mb-2" />
                  <h3 className="font-bold text-sm text-white">Restaurar Padrão</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Volta para as linhas oficiais da Viação Fortaleza com traçados calibrados nas ruas.
                  </p>
                </div>
                <button
                  onClick={handleResetDefaults}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Fábrica</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Line Modal */}
      {editingLine && (
        <EditLineModal
          line={editingLine}
          isOpen={Boolean(editingLine)}
          onClose={() => setEditingLine(null)}
          onSaved={(updatedLine) => {
            const updated = lines.map((l) => (l.id === updatedLine.id ? updatedLine : l));
            onLinesChange(updated);
            showFeedback(`Rota ${updatedLine.code} atualizada com sucesso!`);
          }}
        />
      )}

      {/* Edit Stop Modal */}
      {editingStop && (
        <EditStopModal
          stop={editingStop.stop}
          direction={editingStop.direction}
          isOpen={Boolean(editingStop)}
          onClose={() => setEditingStop(null)}
          onSave={handleSaveEditedStop}
        />
      )}

      {/* Apply GPS Track Modal */}
      {applyingTrack && (
        <ApplyGpsTrackModal
          track={applyingTrack}
          lines={lines}
          isOpen={Boolean(applyingTrack)}
          onClose={() => setApplyingTrack(null)}
          onSuccess={(updatedLines, msg) => {
            onLinesChange(updatedLines);
            showFeedback(msg);
          }}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { X, Save, MapPin, CheckCircle, Navigation } from 'lucide-react';

interface EditStopModalProps {
  stop: BusStop;
  direction: 'ida' | 'volta';
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStop: BusStop) => void;
}

export const EditStopModal: React.FC<EditStopModalProps> = ({
  stop,
  direction,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(stop.name);
  const [landmark, setLandmark] = useState(stop.landmark || '');
  const [lat, setLat] = useState(stop.lat);
  const [lng, setLng] = useState(stop.lng);
  const [isTerminal, setIsTerminal] = useState(Boolean(stop.isTerminal));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: BusStop = {
      ...stop,
      name: name.trim(),
      landmark: landmark.trim(),
      lat: Number(lat),
      lng: Number(lng),
      isTerminal,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Editar Parada #{stop.order}</h3>
              <p className="text-[11px] text-slate-400">
                Sentido: {direction === 'ida' ? 'Ida' : 'Volta'}
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Nome da Parada / Estação
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Terminal Parangaba"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Referência / Cruzamento / Bairro
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Ex: Próximo à estação do metrô"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editStopIsTerminal"
              checked={isTerminal}
              onChange={(e) => setIsTerminal(e.target.checked)}
              className="rounded-sm bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
            />
            <label
              htmlFor="editStopIsTerminal"
              className="text-xs text-slate-300 font-semibold cursor-pointer"
            >
              É Terminal de Integração / Ponto Inicial ou Final
            </label>
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
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Parada</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

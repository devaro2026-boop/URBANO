import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bus,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { IncidentReport, BusLine, BusVehicle } from '../types/bus';
import { StorageService } from '../services/storage';

interface CcoDispatchProps {
  lines: BusLine[];
  vehicles: BusVehicle[];
}

export const CcoDispatch: React.FC<CcoDispatchProps> = ({ lines, vehicles }) => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  const loadIncidents = () => {
    setIncidents(StorageService.getIncidents());
  };

  useEffect(() => {
    loadIncidents();
    const handleUpdate = () => loadIncidents();
    window.addEventListener('vfc_incidents_updated', handleUpdate);
    return () => window.removeEventListener('vfc_incidents_updated', handleUpdate);
  }, []);

  const handleUpdateStatus = (incidentId: string, newStatus: IncidentReport['status']) => {
    const updated = incidents.map((inc) =>
      inc.id === incidentId ? { ...inc, status: newStatus } : inc
    );
    setIncidents(updated);
    localStorage.setItem('vfc_incidents_v1', JSON.stringify(updated));
  };

  const pendingCount = incidents.filter((i) => i.status === 'pendente').length;

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
              CCO • Centro de Controle Operacional
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Viação Fortaleza • Monitoramento em tempo real de ocorrências e telemetria da frota
            </p>
          </div>

          <button
            onClick={loadIncidents}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Fleet Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Linhas em Operação</span>
            <p className="text-2xl font-black text-white mt-1">{lines.length}</p>
            <span className="text-[11px] text-emerald-400">100% monitoradas</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Frota Ativa</span>
            <p className="text-2xl font-black text-white mt-1">
              {vehicles.filter((v) => v.status === 'operando').length} carros
            </p>
            <span className="text-[11px] text-slate-400">
              {vehicles.filter((v) => v.hasAirConditioning).length} com ar condicionado
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Ocorrências Pendentes</span>
            <p className="text-2xl font-black text-rose-400 mt-1">{pendingCount}</p>
            <span className="text-[11px] text-rose-300/80">Requer atenção do rádio</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Pontualidade Média</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">96.4%</p>
            <span className="text-[11px] text-emerald-300/80">Dentro da meta Etufor</span>
          </div>
        </div>

        {/* Incidents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Feed de Ocorrências dos Motoristas
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              {incidents.length} registros
            </span>
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-200">Nenhuma ocorrência registrada no momento</p>
              <p className="text-xs text-slate-500 mt-1">
                Todas as linhas operando normalmente na malha viária de Fortaleza.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    inc.status === 'pendente'
                      ? 'bg-rose-950/40 border-rose-700/60'
                      : inc.status === 'em_atendimento'
                      ? 'bg-amber-950/40 border-amber-700/60'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        inc.status === 'pendente'
                          ? 'bg-rose-600/30 text-rose-400'
                          : inc.status === 'em_atendimento'
                          ? 'bg-amber-600/30 text-amber-400'
                          : 'bg-emerald-600/30 text-emerald-400'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-white">
                          Linha {inc.lineCode} • Carro {inc.vehiclePrefix}
                        </span>
                        <span className="text-xs text-slate-400">({inc.driverName})</span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {inc.timestamp}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-200 mt-1 uppercase tracking-wide">
                        {inc.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">{inc.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {inc.status === 'pendente' && (
                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'em_atendimento')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs"
                      >
                        Atender Rádio
                      </button>
                    )}
                    {inc.status !== 'resolvido' && (
                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'resolvido')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                      >
                        Resolver
                      </button>
                    )}
                    {inc.status === 'resolvido' && (
                      <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 font-bold text-xs border border-emerald-800">
                        ✓ Concluído
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Bus,
  Navigation,
  Settings,
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Shield,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { DriverSettings } from '../services/storage';

interface NavbarProps {
  currentTab: 'driver' | 'admin' | 'cco';
  onChangeTab: (tab: 'driver' | 'admin' | 'cco') => void;
  settings: DriverSettings;
  onUpdateSettings: (settings: DriverSettings) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  settings,
  onUpdateSettings,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-3 select-none">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40">
          <Bus className="w-5 h-5" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm text-white tracking-tight">VIAÇÃO FORTALEZA</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-950 text-emerald-400 border border-emerald-700/60 uppercase">
              Urbano
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-none">Auxiliar de Bordo & Rotas GPS</p>
        </div>
      </div>

      {/* Main Mode Navigation (Tabs) */}
      <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => onChangeTab('driver')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            currentTab === 'driver'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Motorista</span>
        </button>

        <button
          onClick={() => onChangeTab('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            currentTab === 'admin'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Gestão & Linhas</span>
        </button>

        <button
          onClick={() => onChangeTab('cco')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            currentTab === 'cco'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-rose-400" />
          <span>CCO</span>
        </button>
      </nav>

      {/* Right Tools: Clock, Sound Toggle, Fullscreen, PWA Install */}
      <div className="flex items-center gap-2">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 tabular-nums">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime}</span>
        </div>

        {/* Audio Mute / Unmute */}
        <button
          onClick={() => {
            const next = !settings.voiceAnnouncements;
            onUpdateSettings({ ...settings, voiceAnnouncements: next, soundAlerts: next });
          }}
          title={settings.voiceAnnouncements ? 'Desativar avisos de voz' : 'Ativar avisos de voz'}
          className={`p-2 rounded-xl border transition ${
            settings.voiceAnnouncements
              ? 'bg-slate-800 text-emerald-400 border-slate-700'
              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
          }`}
        >
          {settings.voiceAnnouncements ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition hidden sm:flex"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />
      </div>
    </header>
  );
};

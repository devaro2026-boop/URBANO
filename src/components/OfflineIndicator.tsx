import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, HardDrive } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      const timer = setTimeout(() => setShowReconnectedBanner(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-xl bg-amber-950/95 border border-amber-600/80 px-4 py-2.5 text-xs text-amber-200 shadow-2xl backdrop-blur-md">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-100 flex items-center gap-1.5">
            <span>Modo Offline Ativo</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-amber-300">
              <HardDrive className="w-3 h-3" /> Memória Local
            </span>
          </p>
          <p className="text-[11px] text-amber-300/80">
            Navegação, itinerários e paradas funcionando 100% offline.
          </p>
        </div>
      </div>
    );
  }

  if (showReconnectedBanner) {
    return (
      <div className="fixed bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-emerald-950/95 border border-emerald-600/80 px-4 py-2 text-xs text-emerald-200 shadow-2xl backdrop-blur-md">
        <Wifi className="w-4 h-4 text-emerald-400" />
        <span>Conexão restabelecida. Operação sincronizada.</span>
      </div>
    );
  }

  return null;
};

import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Monitor, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden md:inline">PWA Instalado</span>
      </span>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Instalar Viação Fortaleza no celular ou computador (PWA)"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30 transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span className="whitespace-nowrap">Instalar App</span>
      </button>

      {/* Guide Modal for iOS or manual install fallback */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instalar Aplicativo PWA</h3>
                  <p className="text-[11px] text-slate-400">Viação Fortaleza Driver</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="text-slate-200 font-medium">Para instalar no seu iPhone ou iPad:</p>
                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    No Safari, toque no botão de <strong className="text-white">Compartilhar</strong> (ícone do quadrado com a seta para cima na barra inferior).
                  </p>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Role as opções e toque em <strong className="text-white">Adicionar à Tela de Início</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    Toque em <strong className="text-white">Adicionar</strong> no canto superior direito. Pronto! O app aparecerá junto com seus outros aplicativos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="text-slate-200 font-medium">Instalação direta no Android / Chrome / Computador:</p>
                
                {isInstallable ? (
                  <button
                    onClick={async () => {
                      const res = await install();
                      if (res) setShowGuide(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Confirmar Instalação Agora
                  </button>
                ) : (
                  <>
                    <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <p>
                        No navegador, clique no menu de três pontinhos <strong className="text-white">(⋮)</strong> no canto superior.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <p>
                        Selecione <strong className="text-white">Instalar Aplicativo</strong> ou <strong className="text-white">Adicionar à tela inicial</strong>.
                      </p>
                    </div>
                  </>
                )}

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>Funciona offline, inicialização instantânea e tela inteira sem barra de endereço.</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

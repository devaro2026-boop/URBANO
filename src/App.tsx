/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BusLine, BusVehicle } from './types/bus';
import { StorageService, DriverSettings } from './services/storage';
import { Navbar } from './components/Navbar';
import { DriverNavigation } from './components/DriverNavigation';
import { AdminDashboard } from './components/AdminDashboard';
import { CcoDispatch } from './components/CcoDispatch';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [lines, setLines] = useState<BusLine[]>(() => StorageService.getLines());
  const [vehicles, setVehicles] = useState<BusVehicle[]>(() => StorageService.getVehicles());
  const [selectedLineId, setSelectedLineId] = useState<string>(() => lines[0]?.id || 'line-004');
  const [currentTab, setCurrentTab] = useState<'driver' | 'admin' | 'cco'>('driver');
  const [settings, setSettings] = useState<DriverSettings>(() => StorageService.getSettings());

  // Listen to cross-component or cross-tab updates and init Turso sync
  useEffect(() => {
    StorageService.initTursoSync();

    const handleLinesUpdated = () => {
      setLines(StorageService.getLines());
    };
    const handleVehiclesUpdated = () => {
      setVehicles(StorageService.getVehicles());
    };
    const handleSettingsUpdated = () => {
      setSettings(StorageService.getSettings());
    };

    window.addEventListener('vfc_lines_updated', handleLinesUpdated);
    window.addEventListener('vfc_vehicles_updated', handleVehiclesUpdated);
    window.addEventListener('vfc_settings_updated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('vfc_lines_updated', handleLinesUpdated);
      window.removeEventListener('vfc_vehicles_updated', handleVehiclesUpdated);
      window.removeEventListener('vfc_settings_updated', handleSettingsUpdated);
    };
  }, []);

  const handleUpdateSettings = (newSettings: DriverSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const selectedLine = lines.find((l) => l.id === selectedLineId) || lines[0];

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col relative w-full h-[calc(100vh-64px)] overflow-hidden">
        {currentTab === 'driver' && selectedLine && (
          <DriverNavigation
            selectedLine={selectedLine}
            onSelectLine={setSelectedLineId}
            allLines={lines}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            lines={lines}
            vehicles={vehicles}
            onLinesChange={setLines}
            onVehiclesChange={setVehicles}
          />
        )}

        {currentTab === 'cco' && (
          <CcoDispatch lines={lines} vehicles={vehicles} />
        )}
      </main>

      {/* Real-time Offline Warning Indicator */}
      <OfflineIndicator />
    </div>
  );
}

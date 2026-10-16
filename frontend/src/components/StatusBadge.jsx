import React from 'react';
import { Wifi, WifiOff, Cpu, Radio, ShieldAlert } from 'lucide-react';

export function DataSourceBadge({ source }) {
  if (source === 'hardware') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm" title="Données émises directement par le microcontrôleur ESP32 physique">
        <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
        MATÉRIEL CONNECTÉ (ESP32)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm" title="Données générées par le moteur de simulation bio-thermodynamique">
      <Cpu className="w-3.5 h-3.5 text-amber-700" />
      DONNÉES SIMULÉES
    </span>
  );
}

export function ConnectionBadge({ isOnline, diffSeconds }) {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-eco-light text-eco-dark border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-eco-primary animate-pulse" />
        <Wifi className="w-3.5 h-3.5 text-eco-primary" />
        En ligne {diffSeconds !== undefined ? `(${diffSeconds}s)` : ''}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      <WifiOff className="w-3.5 h-3.5 text-red-600" />
      Hors ligne {diffSeconds ? `(${diffSeconds}s)` : ''}
    </span>
  );
}

export function AlertLevelBadge({ level }) {
  switch (level) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          <ShieldAlert className="w-3 h-3" />
          Critique
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Avertissement
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Information
        </span>
      );
  }
}

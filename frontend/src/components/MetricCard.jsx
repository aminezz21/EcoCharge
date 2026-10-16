import React from 'react';

export function MetricCard({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  status = 'ok', // 'ok', 'warning', 'critical', 'neutral'
  badge, 
  subtitle,
  thresholds,
  isSimulated = false
}) {
  const getStatusBorder = () => {
    if (status === 'critical') return 'border-red-400 bg-red-50/20';
    if (status === 'warning') return 'border-amber-400 bg-amber-50/20';
    return 'border-eco-border bg-white';
  };

  const getStatusIconColor = () => {
    if (status === 'critical') return 'text-eco-danger bg-red-100';
    if (status === 'warning') return 'text-eco-warning bg-amber-100';
    return 'text-eco-primary bg-eco-light';
  };

  const displayValue = (value !== null && value !== undefined && value !== '') 
    ? (typeof value === 'number' 
        ? (Number.isInteger(value) ? value : (unit === 'm³' || unit === 'kWh' ? value.toFixed(2) : value.toFixed(1))) 
        : value) 
    : '—';

  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${getStatusBorder()}`}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold text-gray-600 tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${getStatusIconColor()}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-eco-dark tracking-tight">
          {displayValue}
        </span>
        {unit && <span className="text-base font-semibold text-gray-500">{unit}</span>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
        {subtitle && (
          <span className="text-gray-500 font-medium">
            {subtitle}
          </span>
        )}
        
        {thresholds && (
          <span className="text-gray-500 font-mono text-[11px] bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
            Plage: {thresholds.min} ~ {thresholds.max} {unit}
          </span>
        )}

        {badge && <div>{badge}</div>}
      </div>

      {isSimulated && (
        <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-mono">
          Modèle simulé
        </div>
      )}
    </div>
  );
}

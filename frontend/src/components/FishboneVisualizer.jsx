import React from 'react';
import { 
  Users, 
  Cog, 
  FlaskConical, 
  FileSpreadsheet, 
  Gauge, 
  Building2,
  AlertOctagon,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const CATEGORY_CONFIG = {
  man: { label: 'Man (Personnel)', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  machine: { label: 'Machine (Equipment)', icon: Cog, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  material: { label: 'Material (Solvents/Raw)', icon: FlaskConical, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  method: { label: 'Method (SOPs/Process)', icon: FileSpreadsheet, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  measurement: { label: 'Measurement (Testing)', icon: Gauge, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  milieu: { label: 'Milieu (Environment)', icon: Building2, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export default function FishboneVisualizer({ fishboneData, problemStatement }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Potential Root Cause':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-1.5 py-0.5 rounded text-[9px]">Root Cause</span>;
      case 'Contributing Factor':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[9px]">Contributing</span>;
      case 'Ruled Out':
        return <span className="bg-slate-100 text-slate-500 line-through border border-slate-200 px-1.5 py-0.5 rounded text-[9px]">Ruled Out</span>;
      default:
        return <span className="bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded text-[9px]">Investigating</span>;
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Ishikawa 6M Causal Diagram</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">ICH Q9 Risk Analysis</span>
        </div>
        <div className="flex items-center space-x-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Potential Root Cause</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Contributing Factor</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Ruled Out</span>
        </div>
      </div>

      {/* Grid of 6Ms connecting towards the Fish Head */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const factors = fishboneData?.[key] || [];
          const Icon = config.icon;

          return (
            <div 
              key={key} 
              className={`rounded-lg border p-3 ${config.bg} ${config.border} shadow-sm transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                  {factors.length}
                </span>
              </div>

              <div className="space-y-1.5 min-h-[70px]">
                {factors.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic py-2 text-center">No factors logged</div>
                ) : (
                  factors.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="bg-white/95 rounded p-2 border border-slate-200/80 shadow-xs text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-slate-800 font-medium leading-snug ${item.status === 'Ruled Out' ? 'line-through text-slate-400' : ''}`}>
                          {item.factor}
                        </span>
                        <div className="flex-shrink-0">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                      {item.justification && (
                        <p className="text-[10px] text-slate-500 italic leading-tight">
                          {item.justification}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Central Spine to Problem Statement (Fish Head) */}
      <div className="mt-4 pt-3 border-t-2 border-slate-300 flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <AlertOctagon className="h-4 w-4 text-teal-600" />
          <span>FOCAL PROBLEM STATEMENT (FISH HEAD):</span>
        </div>
        <p className="text-xs font-semibold text-slate-900 max-w-2xl text-right">
          {problemStatement || 'Problem statement not specified yet. Run AI extraction to populate.'}
        </p>
      </div>

    </div>
  );
}

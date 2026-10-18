import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { X, History, Shield, Clock, User, CheckCircle } from 'lucide-react';

export default function AuditTrailModal({ isOpen, onClose }) {
  const investigation = useSelector((state) => state.investigation);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && investigation.id) {
      setLoading(true);
      fetch(`/api/v1/investigations/${investigation.id}/audit-trail`)
        .then(res => res.json())
        .then(data => setLogs(data))
        .catch(err => console.error('Failed to load audit trail:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, investigation.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Audit Trail Record</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  21 CFR Part 11 Compliant
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Deviation: <strong className="text-white font-mono">{investigation.deviation_number}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Audit Log Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading audit trail history...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No audit trail records found yet for this investigation.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="relative pl-6 border-l-2 border-slate-200 space-y-1">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white"></div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>Operator: <strong className="text-slate-800">{log.performed_by}</strong></span>
                </div>
                {log.details && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                    {log.details}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

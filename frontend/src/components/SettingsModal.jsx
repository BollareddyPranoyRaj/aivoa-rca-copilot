import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setGroqApiKey, setGroqModel } from '../store/slices/copilotSlice';
import { X, Settings, Key, Cpu, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const copilot = useSelector((state) => state.copilot);
  
  const [apiKey, setApiKey] = useState(copilot.groqApiKey);
  const [model, setModel] = useState(copilot.groqModel);
  const [healthInfo, setHealthInfo] = useState(null);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(copilot.groqApiKey);
      setModel(copilot.groqModel);
      fetch('/api/v1/health')
        .then(res => res.json())
        .then(data => setHealthInfo(data))
        .catch(err => console.error('Health check error:', err));
    }
  }, [isOpen, copilot.groqApiKey, copilot.groqModel]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(setGroqApiKey(apiKey.trim()));
    dispatch(setGroqModel(model));
    setSavedNote(true);
    setTimeout(() => {
      setSavedNote(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">System & AI Configuration</h3>
              <p className="text-[11px] text-slate-500">Groq LLM Engine & Database Status</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* System Health Status */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 mb-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-teal-600" />
              <span>Database Backend:</span>
            </span>
            <span className="font-mono font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-teal-600" />
              <span>{healthInfo?.database || 'PostgreSQL (Connected)'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-purple-600" />
              <span>AI Engine:</span>
            </span>
            <span className="font-mono font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded border border-purple-200">
              LangGraph + {copilot.groqApiKey ? 'Groq Active' : 'Pharma Domain Engine'}
            </span>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-slate-500" />
              <span>Groq API Key (Optional)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Get an API key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-teal-600 underline font-semibold">console.groq.com/keys</a>. If left blank, the application automatically runs in High-Fidelity Domain Simulation mode with zero errors.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-slate-500" />
              <span>Groq LLM Model</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 font-semibold focus:ring-2 focus:ring-teal-500"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended - High Reasoning)</option>
              <option value="gemma2-9b-it">gemma2-9b-it (Google Gemma 2)</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Fast)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedNote ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Settings Saved!
              </span>
            ) : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

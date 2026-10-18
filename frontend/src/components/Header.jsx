import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Sparkles, 
  Save, 
  FileText, 
  FolderOpen, 
  History, 
  Settings as SettingsIcon, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Download,
  Upload,
  Loader2
} from 'lucide-react';
import { resetInvestigation, setSaveStatus, loadInvestigation, applyAiExtractedData } from '../store/slices/investigationSlice';
import { setModalOpen as setSavedModalOpen, fetchSavedInvestigations } from '../store/slices/investigationsListSlice';
import { 
  toggleCopilot, 
  startAnalysis, 
  analysisSuccess, 
  analysisFailure, 
  setFileName, 
  setSourceType, 
  setRawInput 
} from '../store/slices/copilotSlice';
import confetti from 'canvas-confetti';

export default function Header({ onOpenSettings, onOpenAuditTrail, onExportPdf }) {
  const dispatch = useDispatch();
  const investigation = useSelector((state) => state.investigation);
  const copilot = useSelector((state) => state.copilot);
  const savedCount = useSelector((state) => state.investigationsList.items.length);
  const [saveLoading, setSaveLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please select a valid PDF deviation report.');
      return;
    }

    setUploadLoading(true);
    dispatch(startAnalysis());
    dispatch(setFileName(file.name));
    dispatch(setSourceType('PDF Document'));

    const formData = new FormData();
    formData.append('file', file);
    if (copilot.groqApiKey) {
      formData.append('groq_api_key', copilot.groqApiKey);
    }
    formData.append('groq_model', copilot.groqModel || 'llama-3.3-70b-versatile');

    try {
      const res = await fetch('/api/v1/ai/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'PDF extraction and RCA analysis failed');
      }

      const result = await res.json();
      dispatch(analysisSuccess(result));
      dispatch(applyAiExtractedData(result));
      if (result.extracted_text) {
        dispatch(setRawInput(result.extracted_text));
      }
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.2 } });
    } catch (err) {
      dispatch(analysisFailure(err.message));
      alert(`PDF Upload Error: ${err.message}`);
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNew = () => {
    if (investigation.isDirty && !window.confirm('Discard unsaved changes and start a new investigation?')) {
      return;
    }
    dispatch(resetInvestigation());
  };

  const handleOpenSaved = () => {
    dispatch(fetchSavedInvestigations());
    dispatch(setSavedModalOpen(true));
  };

  const handleSave = async () => {
    if (!investigation.title || !investigation.deviation_number) {
      alert('Please ensure Deviation Number and Title are entered before saving.');
      return;
    }

    setSaveLoading(true);
    dispatch(setSaveStatus({ isSaving: true, message: null }));

    try {
      const payload = {
        deviation_number: investigation.deviation_number,
        title: investigation.title,
        product_name: investigation.product_name || 'Unspecified API',
        product_code: investigation.product_code || '',
        batch_number: investigation.batch_number || 'N/A',
        manufacturing_stage: investigation.manufacturing_stage || '',
        incident_date: investigation.incident_date || new Date().toISOString().split('T')[0],
        severity: investigation.severity || 'Major',
        status: investigation.status || 'Draft',
        source_type: investigation.source_type || 'Text',
        source_content: investigation.source_content || '',
        immediate_containment: investigation.immediate_containment || '',
        impact_assessment: investigation.impact_assessment || '',
        problem_statement: investigation.problem_statement || '',
        direct_cause: investigation.direct_cause || '',
        contributing_factors: investigation.contributing_factors || [],
        root_cause: investigation.root_cause || '',
        root_cause_category: investigation.root_cause_category || 'Equipment / Maintenance',
        five_whys: investigation.five_whys || [],
        fishbone_data: investigation.fishbone_data || {},
        evidence_analyzed: investigation.evidence_analyzed || [],
        missing_evidence: investigation.missing_evidence || [],
        capa_items: investigation.capa_items || [],
        investigator_name: investigation.investigator_name || 'Lead Quality Investigator',
        qp_name: investigation.qp_name || '',
        qp_approval_status: investigation.qp_approval_status || 'Pending Review',
        qp_notes: investigation.qp_notes || '',
        ai_confidence_score: investigation.ai_confidence_score || 0.0,
      };

      const method = investigation.id ? 'PUT' : 'POST';
      const url = investigation.id ? `/api/v1/investigations/${investigation.id}` : '/api/v1/investigations';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save investigation');
      }

      const savedData = await response.json();
      dispatch(loadInvestigation(savedData));
      dispatch(setSaveStatus({
        isSaving: false,
        message: `Saved to PostgreSQL database as #${savedData.deviation_number}`,
        lastSavedAt: new Date().toLocaleTimeString(),
      }));

      // Trigger celebratory confetti for compliant GxP save
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.15 }
      });

      dispatch(fetchSavedInvestigations());
    } catch (err) {
      alert(`Save error: ${err.message}`);
      dispatch(setSaveStatus({ isSaving: false, message: null }));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-lg text-white">AIVOA<span className="text-teal-400">.AI</span></span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-teal-950 text-teal-300 border border-teal-800">RCA Copilot</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <span>Pharma API Quality Engineering</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-teal-400 font-mono">ICH Q7 • Q9 • Q10</span>
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* New Investigation */}
          <button
            onClick={handleNew}
            title="Start fresh investigation form"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <PlusCircle className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden md:inline">New Dossier</span>
          </button>

          {/* Upload PDF Report */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePdfUpload} 
            accept=".pdf,application/pdf" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            title="Upload deviation report PDF to extract text and auto-populate RCA form"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-sm shadow-teal-500/20 active:scale-95 disabled:opacity-50"
          >
            {uploadLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
            ) : (
              <Upload className="h-3.5 w-3.5 stroke-[2.5] text-slate-900" />
            )}
            <span className="hidden md:inline">{uploadLoading ? 'Extracting...' : 'Upload PDF'}</span>
          </button>

          {/* Saved Records */}
          <button
            onClick={handleOpenSaved}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <FolderOpen className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden md:inline">Saved Investigations</span>
            {savedCount > 0 && (
              <span className="ml-1 bg-sky-950 text-sky-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-sky-800">
                {savedCount}
              </span>
            )}
          </button>

          {/* Audit Trail */}
          <button
            onClick={onOpenAuditTrail}
            disabled={!investigation.id}
            title={investigation.id ? "View 21 CFR Part 11 Audit Trail" : "Save investigation first to view audit trail"}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            <History className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden lg:inline">Audit Trail</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={onExportPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Export GxP PDF</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <SettingsIcon className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Settings</span>
            <span className={`w-2 h-2 rounded-full ${copilot.groqApiKey ? 'bg-emerald-400' : 'bg-amber-400 ring-2 ring-amber-400/20'}`} />
          </button>

          {/* Primary Save Button */}
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="flex items-center space-x-2 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 rounded-lg transition-all shadow-md shadow-teal-500/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{saveLoading ? 'Saving...' : (investigation.id ? 'Update Record' : 'Save Record')}</span>
          </button>

          {/* Copilot Toggle */}
          <button
            onClick={() => dispatch(toggleCopilot())}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
              copilot.isOpen 
                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        </div>

      </div>

      {/* Save Success Banner */}
      {investigation.saveSuccessMessage && (
        <div className="bg-emerald-950/80 border-t border-emerald-800/60 px-4 py-1.5 text-center text-xs text-emerald-300 flex items-center justify-center space-x-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{investigation.saveSuccessMessage}</span>
          {investigation.lastSavedAt && (
            <span className="text-emerald-400/80 font-mono text-[11px]">[{investigation.lastSavedAt}]</span>
          )}
        </div>
      )}
    </header>
  );
}

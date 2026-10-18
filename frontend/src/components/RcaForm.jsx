import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateField, 
  updateFiveWhyStep, 
  verifyFiveWhyStep, 
  addFiveWhyStep, 
  removeFiveWhyStep,
  updateFishboneFactor,
  addFishboneFactor,
  removeFishboneFactor,
  updateMissingEvidence,
  addMissingEvidenceItem,
  toggleMissingEvidenceStatus,
  updateCapaItem,
  addCapaItem,
  removeCapaItem,
  confirmAllSuggestions,
  setSaveStatus,
  loadInvestigation,
  applyAiExtractedData
} from '../store/slices/investigationSlice';
import { 
  startAnalysis, 
  analysisSuccess, 
  analysisFailure, 
  setFileName, 
  setSourceType, 
  setRawInput 
} from '../store/slices/copilotSlice';
import FishboneVisualizer from './FishboneVisualizer';
import { 
  FileText, 
  GitBranch, 
  Network, 
  Search, 
  Target, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  UserCheck, 
  Check, 
  FileCheck,
  ChevronDown,
  Info,
  Upload,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RcaForm({ onOpenAuditTrail }) {
  const dispatch = useDispatch();
  const investigation = useSelector((state) => state.investigation);
  const copilot = useSelector((state) => state.copilot);
  const [activeSection, setActiveSection] = useState('overview');
  const [newFishboneCategory, setNewFishboneCategory] = useState('machine');
  const [newFactorText, setNewFactorText] = useState('');
  const [newFactorStatus, setNewFactorStatus] = useState('Contributing Factor');
  const [newFactorJustification, setNewFactorJustification] = useState('');
  const [showAddFactorModal, setShowAddFactorModal] = useState(false);

  const sectionFileInputRef = useRef(null);
  const [pdfUploadLoading, setPdfUploadLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const processPdfFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please select a valid PDF deviation document.');
      return;
    }

    setPdfUploadLoading(true);
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
        throw new Error(errData.detail || 'PDF processing failed');
      }

      const result = await res.json();
      dispatch(analysisSuccess(result));
      dispatch(applyAiExtractedData(result));
      if (result.extracted_text) {
        dispatch(setRawInput(result.extracted_text));
      }
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.3 } });
    } catch (err) {
      dispatch(analysisFailure(err.message));
      alert(`PDF Extraction Error: ${err.message}`);
    } finally {
      setPdfUploadLoading(false);
      if (sectionFileInputRef.current) sectionFileInputRef.current.value = '';
    }
  };

  // New Missing Evidence state
  const [newGapItem, setNewGapItem] = useState('');
  const [newGapReason, setNewGapReason] = useState('');
  const [newGapDept, setNewGapDept] = useState('Engineering Maintenance');
  const [newGapPriority, setNewGapPriority] = useState('High');
  const [showAddGapModal, setShowAddGapModal] = useState(false);

  // Qualified Person Signoff Handler
  const handleQpSignoff = async (status) => {
    const qpName = prompt('Enter Qualified Person (QP) Electronic Signature Name:', investigation.qp_name || 'Dr. Arthur Vance, QP');
    if (!qpName) return;

    try {
      let targetId = investigation.id;

      // If not yet saved to PostgreSQL, auto-save first
      if (!targetId) {
        const payload = {
          deviation_number: investigation.deviation_number || `DEV-2024-${Date.now().toString().slice(-4)}`,
          title: investigation.title || 'Untitled Quality Investigation',
          product_name: investigation.product_name || 'Unspecified API',
          product_code: investigation.product_code || '',
          batch_number: investigation.batch_number || 'N/A',
          manufacturing_stage: investigation.manufacturing_stage || '',
          incident_date: investigation.incident_date || new Date().toISOString().split('T')[0],
          severity: investigation.severity || 'Major',
          status: 'In Investigation',
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
          qp_name: qpName,
          qp_approval_status: 'Pending Review',
          qp_notes: investigation.qp_notes || '',
          ai_confidence_score: investigation.ai_confidence_score || 0.0,
        };

        const saveRes = await fetch('/api/v1/investigations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!saveRes.ok) {
          const err = await saveRes.json();
          throw new Error(err.detail || 'Auto-save failed');
        }

        const savedData = await saveRes.json();
        targetId = savedData.id;
        dispatch(loadInvestigation(savedData));
      }

      const res = await fetch(`/api/v1/investigations/${targetId}/signoff?qp_name=${encodeURIComponent(qpName)}&approval_status=${encodeURIComponent(status)}&notes=${encodeURIComponent(investigation.qp_notes || 'Reviewed per ICH Q7/Q10')}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Signoff failed');
      const updated = await res.json();
      dispatch(loadInvestigation(updated));
      if (status === 'Approved') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      }
      alert(`Investigation successfully approved & signed off by Qualified Person ${qpName}.`);
    } catch (err) {
      alert(`Error during signoff: ${err.message}`);
    }
  };

  const handleAddFactorSubmit = (e) => {
    e.preventDefault();
    if (!newFactorText.trim()) return;
    dispatch(addFishboneFactor({
      category: newFishboneCategory,
      factor: newFactorText,
      status: newFactorStatus,
      justification: newFactorJustification,
    }));
    setNewFactorText('');
    setNewFactorJustification('');
    setShowAddFactorModal(false);
  };

  const handleAddGapSubmit = (e) => {
    e.preventDefault();
    if (!newGapItem.trim()) return;
    dispatch(addMissingEvidenceItem({
      requested_item: newGapItem,
      reason: newGapReason,
      department: newGapDept,
      priority: newGapPriority,
    }));
    setNewGapItem('');
    setNewGapReason('');
    setShowAddGapModal(false);
  };

  const navItems = [
    { id: 'overview', label: '1. Incident Overview', icon: FileText },
    { id: 'five_whys', label: '2. 5-Whys Analysis', icon: GitBranch, count: investigation.five_whys?.length },
    { id: 'fishbone', label: '3. Ishikawa 6M', icon: Network },
    { id: 'evidence', label: '4. Evidence & Gaps', icon: Search, badge: investigation.missing_evidence?.length },
    { id: 'root_cause', label: '5. Root Cause', icon: Target },
    { id: 'capa', label: '6. CAPA Matrix', icon: ShieldCheck, count: investigation.capa_items?.length },
    { id: 'signoff', label: '7. QP Sign-Off', icon: UserCheck },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Dossier Title Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                {investigation.deviation_number || 'DEV-DRAFT'}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                investigation.severity === 'Critical' 
                  ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                  : (investigation.severity === 'Major' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700')
              }`}>
                {investigation.severity} Severity
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Status: {investigation.status}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {investigation.title || 'Untitled Quality Investigation (API Manufacturing)'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Product: <strong className="text-slate-800">{investigation.product_name || 'Not specified'}</strong> | Batch: <span className="font-mono text-slate-800 font-semibold">{investigation.batch_number || 'N/A'}</span> | Stage: {investigation.manufacturing_stage || 'N/A'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => dispatch(confirmAllSuggestions())}
              className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
              title="Confirm that AI suggestions have been reviewed and accepted by Quality team"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Accept AI Suggestions</span>
            </button>
            {investigation.id && (
              <button
                onClick={onOpenAuditTrail}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                Audit Log
              </button>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto pt-3 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 rounded-full font-bold ${
                    isActive ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 rounded-full font-bold ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 1: INCIDENT OVERVIEW ================= */}
      {activeSection === 'overview' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>1. Deviation Identification & Intake Overview</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
                  ICH Q7 Sec 2.5
                </span>
              </h2>
              <p className="text-xs text-slate-500">Record deviation particulars, immediate containment, and initial impact evaluation.</p>
            </div>
          </div>

          {/* Quick PDF Upload Dropzone Banner */}
          <input 
            type="file" 
            ref={sectionFileInputRef} 
            onChange={(e) => processPdfFile(e.target.files?.[0])} 
            accept=".pdf,application/pdf" 
            className="hidden" 
          />
          <div 
            onClick={() => sectionFileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              processPdfFile(e.dataTransfer.files?.[0]);
            }}
            className={`border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDragOver 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-teal-200 bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/40 hover:border-teal-400 hover:bg-teal-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md shadow-teal-600/20">
                {pdfUploadLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Upload Deviation Report (PDF)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold border border-teal-200">Auto-Extract & Populate</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {pdfUploadLoading 
                    ? "Extracting PDF text and executing LangGraph RCA workflow (5-Whys, 6M Fishbone, CAPAs)..." 
                    : "Drag & drop an investigation PDF here or click to browse. The AI extractor will populate the entire dossier."}
                </p>
              </div>
            </div>
            <button 
              type="button"
              disabled={pdfUploadLoading}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-300 rounded-lg shadow-sm whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {pdfUploadLoading ? "Extracting..." : "Browse PDF"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Deviation Number *</label>
              <input
                type="text"
                value={investigation.deviation_number}
                onChange={(e) => dispatch(updateField({ field: 'deviation_number', value: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">API Product Name *</label>
              <input
                type="text"
                value={investigation.product_name}
                onChange={(e) => dispatch(updateField({ field: 'product_name', value: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Commercial Batch / Lot No. *</label>
              <input
                type="text"
                value={investigation.batch_number}
                onChange={(e) => dispatch(updateField({ field: 'batch_number', value: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Manufacturing Unit / Stage</label>
              <input
                type="text"
                value={investigation.manufacturing_stage}
                onChange={(e) => dispatch(updateField({ field: 'manufacturing_stage', value: e.target.value }))}
                placeholder="e.g., Crystallization, Synthesis, Micronization"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Date of Occurrence</label>
              <input
                type="date"
                value={investigation.incident_date}
                onChange={(e) => dispatch(updateField({ field: 'incident_date', value: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Severity Classification</label>
              <select
                value={investigation.severity}
                onChange={(e) => dispatch(updateField({ field: 'severity', value: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 font-semibold"
              >
                <option value="Critical">Critical (Immediate Quarantine & Product Impact)</option>
                <option value="Major">Major (Process Parameter Excursion)</option>
                <option value="Minor">Minor (Documentation / Non-critical)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Investigation Title *</label>
            <input
              type="text"
              value={investigation.title}
              onChange={(e) => dispatch(updateField({ field: 'title', value: e.target.value }))}
              placeholder="Clear, descriptive title summarizing the deviation event"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 block text-xs">Problem Statement (Focal Event)</label>
              <span className="text-[10px] text-teal-700 font-medium">Objective description of What, Where, When, and Extent</span>
            </div>
            <textarea
              rows={3}
              value={investigation.problem_statement}
              onChange={(e) => dispatch(updateField({ field: 'problem_statement', value: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 font-sans leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-xs">Immediate Containment Action Taken</label>
              <textarea
                rows={3}
                value={investigation.immediate_containment}
                onChange={(e) => dispatch(updateField({ field: 'immediate_containment', value: e.target.value }))}
                placeholder="e.g. Batch placed on QA hold, isolation valves closed, equipment tagged out of service"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-xs">Initial Product & Batch Impact Assessment</label>
              <textarea
                rows={3}
                value={investigation.impact_assessment}
                onChange={(e) => dispatch(updateField({ field: 'impact_assessment', value: e.target.value }))}
                placeholder="e.g. Impact on finished API release, adjacent commercial batches, raw material lots"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: 5 WHYS CAUSAL TREE ================= */}
      {activeSection === 'five_whys' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>2. 5-Whys Root Cause Causal Chain</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
                  Iterative Causal Drilling
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Drill down from physical deviation symptom to underlying systemic management root cause. Each answer must be substantiated by GxP records.
              </p>
            </div>

            <button
              onClick={() => dispatch(addFiveWhyStep())}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Why Step</span>
            </button>
          </div>

          <div className="space-y-4">
            {investigation.five_whys?.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <GitBranch className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No 5-Whys Causal Chain Populated</p>
                <p className="mt-1">Use the <strong>AI Copilot Panel</strong> on the right to auto-generate the 5 Whys, or click <strong>Add Why Step</strong> above.</p>
              </div>
            ) : (
              investigation.five_whys.map((step, idx) => (
                <div 
                  key={idx}
                  className={`rounded-xl border p-4 transition-all ${
                    idx === investigation.five_whys.length - 1
                      ? 'border-teal-500 bg-teal-50/20 ring-1 ring-teal-500/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                        idx === investigation.five_whys.length - 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {step.step}
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        {idx === investigation.five_whys.length - 1 ? 'Step 5: Systemic Root Cause' : `Why Level ${step.step}`}
                      </span>
                      {step.ai_suggested && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 text-teal-600" />
                          <span>AI Suggested</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => dispatch(verifyFiveWhyStep({ index: idx }))}
                        className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                          step.verified 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        <span>{step.verified ? 'Verified by QP' : 'Verify Step'}</span>
                      </button>

                      <button
                        onClick={() => dispatch(removeFiveWhyStep(idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete step"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-slate-500 font-medium block mb-0.5">Interrogative Question:</label>
                      <input
                        type="text"
                        value={step.question}
                        onChange={(e) => dispatch(updateFiveWhyStep({ index: idx, field: 'question', value: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 font-medium block mb-0.5">Investigative Answer / Causal Mechanism:</label>
                      <textarea
                        rows={2}
                        value={step.answer}
                        onChange={(e) => dispatch(updateFiveWhyStep({ index: idx, field: 'answer', value: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 font-medium block mb-0.5">Supporting GxP Evidence Reference:</label>
                      <input
                        type="text"
                        value={step.evidence_reference || ''}
                        placeholder="e.g. BMR pp. 14, SCADA Tag TI-CR302-01, HPLC Report QC-2024-1189"
                        onChange={(e) => dispatch(updateFiveWhyStep({ index: idx, field: 'evidence_reference', value: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= SECTION 3: ISHIKAWA (FISHBONE) 6M ================= */}
      {activeSection === 'fishbone' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>3. Ishikawa (Fishbone 6M) Analysis</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
                  ICH Q9 Quality Risk Management
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Systematically evaluate all 6M categories: Man, Machine, Material, Method, Measurement, and Milieu.
              </p>
            </div>

            <button
              onClick={() => setShowAddFactorModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add 6M Factor</span>
            </button>
          </div>

          {/* Interactive Fishbone Visualizer Component */}
          <FishboneVisualizer 
            fishboneData={investigation.fishbone_data} 
            problemStatement={investigation.problem_statement} 
          />

          {/* Detailed 6M Editable Factor Tables */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Editable Factors by Category</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['man', 'machine', 'material', 'method', 'measurement', 'milieu'].map((cat) => {
                const factors = investigation.fishbone_data?.[cat] || [];
                return (
                  <div key={cat} className="border border-slate-200 rounded-xl p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase text-slate-800 tracking-wide">{cat}</span>
                      <span className="text-[11px] font-mono text-slate-500">{factors.length} factors</span>
                    </div>

                    <div className="space-y-2">
                      {factors.map((item, idx) => (
                        <div key={item.id || idx} className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <input
                              type="text"
                              value={item.factor}
                              onChange={(e) => dispatch(updateFishboneFactor({ category: cat, index: idx, field: 'factor', value: e.target.value }))}
                              className="w-full border border-slate-200 rounded p-1 font-semibold text-slate-900 bg-white"
                            />
                            <button
                              onClick={() => dispatch(removeFishboneFactor({ category: cat, index: idx }))}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete factor"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={item.status}
                              onChange={(e) => dispatch(updateFishboneFactor({ category: cat, index: idx, field: 'status', value: e.target.value }))}
                              className="border border-slate-200 rounded p-1 text-[11px] font-semibold bg-white"
                            >
                              <option value="Potential Root Cause">Potential Root Cause</option>
                              <option value="Contributing Factor">Contributing Factor</option>
                              <option value="Ruled Out">Ruled Out</option>
                              <option value="Under Investigation">Under Investigation</option>
                            </select>

                            <input
                              type="text"
                              value={item.justification || ''}
                              placeholder="Justification note..."
                              onChange={(e) => dispatch(updateFishboneFactor({ category: cat, index: idx, field: 'justification', value: e.target.value }))}
                              className="flex-1 border border-slate-200 rounded p-1 text-[11px] text-slate-600 bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 4: EVIDENCE & GAPS ================= */}
      {activeSection === 'evidence' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>4. Evidence Analyzed & Investigation Data Gaps</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-300">
                  Critical Evidence Gaps
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Identify verified records and highlight missing evidence needed to confirm root cause prior to regulatory audit.
              </p>
            </div>

            <button
              onClick={() => setShowAddGapModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Request Evidence</span>
            </button>
          </div>

          {/* Missing Evidence / Investigation Gaps Callout */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Missing Evidence Checklist ({investigation.missing_evidence?.length || 0} Outstanding)</span>
            </h3>

            <div className="space-y-2">
              {investigation.missing_evidence?.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">
                  No missing evidence items flagged. All required documents verified.
                </div>
              ) : (
                investigation.missing_evidence.map((gap, idx) => (
                  <div key={gap.id || idx} className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{gap.requested_item}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          gap.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {gap.priority} Priority
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Dept: {gap.department}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{gap.reason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dispatch(toggleMissingEvidenceStatus(idx))}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                          gap.status === 'Received'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : (gap.status === 'Requested' ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-amber-100 text-amber-800 border border-amber-300')
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        <span>Status: {gap.status}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Supporting Evidence Analyzed Table */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Supporting Evidence Reviewed</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Evidence Title</th>
                    <th className="p-2.5">Source / System</th>
                    <th className="p-2.5">Findings Summary</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {investigation.evidence_analyzed?.map((ev, i) => (
                    <tr key={ev.id || i} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-slate-900">{ev.title}</td>
                      <td className="p-2.5 text-slate-600 font-mono text-[11px]">{ev.source}</td>
                      <td className="p-2.5 text-slate-700">{ev.findings}</td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <Check className="h-3 w-3" />
                          <span>Verified</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= SECTION 5: ROOT CAUSE ================= */}
      {activeSection === 'root_cause' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>5. Root Cause Determination & Classification</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
                  Primary Synthesis
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Formulate direct cause, contributing factors, and fundamental systemic root cause.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono block">AI Confidence Score</span>
              <span className="text-sm font-extrabold font-mono text-teal-600">
                {Math.round((investigation.ai_confidence_score || 0.94) * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Direct Cause */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Direct Cause (Immediate Physical Trigger):</label>
              <textarea
                rows={2}
                value={investigation.direct_cause}
                onChange={(e) => dispatch(updateField({ field: 'direct_cause', value: e.target.value }))}
                placeholder="The immediate physical or chemical failure mode that created the deviation"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 leading-relaxed font-semibold text-slate-900"
              />
            </div>

            {/* Contributing Factors */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contributing Factors:</label>
              <div className="space-y-1.5">
                {investigation.contributing_factors?.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <input
                      type="text"
                      value={factor}
                      onChange={(e) => {
                        const copy = [...investigation.contributing_factors];
                        copy[idx] = e.target.value;
                        dispatch(updateField({ field: 'contributing_factors', value: copy }));
                      }}
                      className="w-full bg-transparent font-medium text-slate-800 border-none focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const copy = investigation.contributing_factors.filter((_, i) => i !== idx);
                        dispatch(updateField({ field: 'contributing_factors', value: copy }));
                      }}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const copy = [...(investigation.contributing_factors || []), 'New contributing factor'];
                    dispatch(updateField({ field: 'contributing_factors', value: copy }));
                  }}
                  className="text-[11px] text-teal-600 font-semibold hover:underline flex items-center gap-1 mt-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Contributing Factor</span>
                </button>
              </div>
            </div>

            {/* Primary Systemic Root Cause */}
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-teal-950 block uppercase tracking-wider text-[11px]">
                  Primary Systemic Root Cause *
                </label>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  Fundamental Breakdown
                </span>
              </div>
              <textarea
                rows={3}
                value={investigation.root_cause}
                onChange={(e) => dispatch(updateField({ field: 'root_cause', value: e.target.value }))}
                placeholder="The fundamental systemic, procedural, or engineering breakdown that if corrected will prevent recurrence"
                className="w-full border border-teal-300 rounded-lg p-2.5 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 leading-relaxed"
              />
            </div>

            {/* Root Cause Category */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Root Cause Category (GAMP / ICH Q9):</label>
              <select
                value={investigation.root_cause_category}
                onChange={(e) => dispatch(updateField({ field: 'root_cause_category', value: e.target.value }))}
                className="w-full md:w-1/2 border border-slate-300 rounded-lg p-2.5 font-semibold focus:ring-2 focus:ring-teal-500"
              >
                <option value="Equipment / Maintenance">Equipment / Maintenance Failure</option>
                <option value="Process Design / Procedure">Process Design / Procedure (SOP) Inadequacy</option>
                <option value="Personnel / Training">Personnel / Training / Human Factors</option>
                <option value="Material / Vendor Variability">Material / Vendor Quality Variability</option>
                <option value="Measurement / Laboratory">Measurement / Analytical Error</option>
                <option value="Facility / Utility Control">Facility / Utility Environmental Control</option>
              </select>
            </div>

          </div>
        </div>
      )}

      {/* ================= SECTION 6: CAPA MATRIX ================= */}
      {activeSection === 'capa' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>6. Corrective and Preventive Actions (CAPA) Matrix</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  ICH Q10 Pharmaceutical Quality System
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Action items defined to eliminate causes and prevent recurrence across API facilities.
              </p>
            </div>

            <button
              onClick={() => dispatch(addCapaItem({}))}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add CAPA Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {investigation.capa_items?.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">CAPA-{idx + 1}</span>
                    <select
                      value={item.type}
                      onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'type', value: e.target.value }))}
                      className={`text-xs font-bold rounded px-2 py-0.5 border ${
                        item.type === 'Preventive Action'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : (item.type === 'Corrective Action' ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-rose-100 text-rose-800 border-rose-200')
                      }`}
                    >
                      <option value="Immediate Containment / Correction">Immediate Containment / Correction</option>
                      <option value="Corrective Action">Corrective Action (CA)</option>
                      <option value="Preventive Action">Preventive Action (PA)</option>
                    </select>

                    {item.ai_suggested && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        AI Suggested
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'status', value: e.target.value }))}
                      className="text-xs font-semibold border border-slate-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="Open">Status: Open</option>
                      <option value="In Progress">Status: In Progress</option>
                      <option value="Completed">Status: Completed</option>
                    </select>

                    <button
                      onClick={() => dispatch(removeCapaItem(idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-500 font-medium block mb-0.5">CAPA Title:</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'title', value: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 font-medium block mb-0.5">Owner / Department:</label>
                      <input
                        type="text"
                        value={item.owner}
                        onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'owner', value: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium block mb-0.5">Target Due Date:</label>
                      <input
                        type="text"
                        value={item.due_date}
                        onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'due_date', value: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-500 font-medium block mb-0.5">Action Description:</label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'description', value: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 font-medium block mb-0.5">Short Rationale / Explanation:</label>
                    <textarea
                      rows={2}
                      value={item.rationale}
                      onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'rationale', value: e.target.value }))}
                      placeholder="Why this action eliminates the root cause and prevents recurrence..."
                      className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>

                <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <label className="text-slate-700 font-semibold block mb-0.5">Effectiveness Check Verification Plan:</label>
                  <input
                    type="text"
                    value={item.effectiveness_check || ''}
                    placeholder="e.g. Audit next 5 consecutive commercial batches for zero OOS occurrences"
                    onChange={(e) => dispatch(updateCapaItem({ index: idx, field: 'effectiveness_check', value: e.target.value }))}
                    className="w-full border border-slate-200 rounded p-1.5 font-sans text-slate-800 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 7: QP SIGN-OFF ================= */}
      {activeSection === 'signoff' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>7. Qualified Person (QP) Formal Review & Sign-Off</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                  21 CFR Part 11 / EU Annex 16
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Formal Qualified Person (QP) review for API batch disposition and regulatory sign-off.
              </p>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              investigation.qp_approval_status === 'Approved'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {investigation.qp_approval_status}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lead Quality Investigator</label>
                <input
                  type="text"
                  value={investigation.investigator_name}
                  onChange={(e) => dispatch(updateField({ field: 'investigator_name', value: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Qualified Person (QP) Name</label>
                <input
                  type="text"
                  value={investigation.qp_name || ''}
                  onChange={(e) => dispatch(updateField({ field: 'qp_name', value: e.target.value }))}
                  placeholder="e.g. Dr. Arthur Vance, Qualified Person"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Qualified Person Review Notes & Disposition Statement</label>
              <textarea
                rows={4}
                value={investigation.qp_notes || ''}
                onChange={(e) => dispatch(updateField({ field: 'qp_notes', value: e.target.value }))}
                placeholder="Document formal QP evaluation of batch disposition, reprocessing feasibility, and CAPA adequacy..."
                className="w-full border border-slate-300 rounded-lg p-2.5 leading-relaxed font-sans"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => handleQpSignoff('Rejected')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-bold text-xs"
              >
                Request Investigation Rework
              </button>

              <button
                onClick={() => handleQpSignoff('Approved')}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Formal QP Approval & Disposition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add 6M Factor */}
      {showAddFactorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Add Ishikawa 6M Factor</h3>
            <form onSubmit={handleAddFactorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={newFishboneCategory}
                  onChange={(e) => setNewFishboneCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                >
                  <option value="man">Man (Personnel / Training)</option>
                  <option value="machine">Machine (Equipment / Seals / Sensors)</option>
                  <option value="material">Material (Solvents / Raw Materials)</option>
                  <option value="method">Method (SOPs / Recipes / Holds)</option>
                  <option value="measurement">Measurement (Testing / HPLC / QC)</option>
                  <option value="milieu">Milieu (Environment / HVAC / Cleanroom)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Factor Description *</label>
                <input
                  type="text"
                  required
                  value={newFactorText}
                  onChange={(e) => setNewFactorText(e.target.value)}
                  placeholder="e.g. Seal buffer regulator orifice clogged"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status</label>
                <select
                  value={newFactorStatus}
                  onChange={(e) => setNewFactorStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                >
                  <option value="Potential Root Cause">Potential Root Cause</option>
                  <option value="Contributing Factor">Contributing Factor</option>
                  <option value="Ruled Out">Ruled Out</option>
                  <option value="Under Investigation">Under Investigation</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Justification Note</label>
                <input
                  type="text"
                  value={newFactorJustification}
                  onChange={(e) => setNewFactorJustification(e.target.value)}
                  placeholder="Reference calibration report, test data, or observation"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFactorModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold"
                >
                  Add Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Missing Evidence */}
      {showAddGapModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Request Missing Investigation Evidence</h3>
            <form onSubmit={handleAddGapSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Requested Record / Data *</label>
                <input
                  type="text"
                  required
                  value={newGapItem}
                  onChange={(e) => setNewGapItem(e.target.value)}
                  placeholder="e.g. SCADA audit trail for bypassed alarms"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Request</label>
                <input
                  type="text"
                  value={newGapReason}
                  onChange={(e) => setNewGapReason(e.target.value)}
                  placeholder="Why this record is needed to confirm or rule out causes"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Responsible Dept</label>
                  <input
                    type="text"
                    value={newGapDept}
                    onChange={(e) => setNewGapDept(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newGapPriority}
                    onChange={(e) => setNewGapPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGapModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

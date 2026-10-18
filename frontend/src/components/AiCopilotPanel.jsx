import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Mail, 
  Send, 
  Check, 
  CheckCheck, 
  ChevronRight, 
  X, 
  Loader2, 
  Cpu, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  Search, 
  HelpCircle,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { 
  setActiveTab, 
  setSourceType, 
  setRawInput, 
  setFileName, 
  startAnalysis, 
  analysisSuccess, 
  analysisFailure,
  addChatMessage,
  setChatLoading,
  clearExtractedResult,
  setCopilotOpen
} from '../store/slices/copilotSlice';
import { applyAiExtractedData, confirmAllSuggestions } from '../store/slices/investigationSlice';

export default function AiCopilotPanel() {
  const dispatch = useDispatch();
  const copilot = useSelector((state) => state.copilot);
  const investigation = useSelector((state) => state.investigation);
  
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Load sample deviations from API on mount
  useEffect(() => {
    fetch('/api/v1/samples')
      .then(res => res.json())
      .then(data => {
        setSamples(data);
        if (data.length > 0 && !copilot.rawInput) {
          // Pre-select first sample for instant delight
          setSelectedSampleId(data[0].id);
          dispatch(setRawInput(data[0].text));
          dispatch(setSourceType('Investigation Report'));
        }
      })
      .catch(err => console.error('Failed to load samples:', err));
  }, [dispatch]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [copilot.chatMessages]);

  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    dispatch(setRawInput(sample.text));
    dispatch(setSourceType(sample.source_type));
    dispatch(setFileName(`${sample.product.split(' ')[0]}_Incident.txt`));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
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
    formData.append('groq_model', copilot.groqModel);

    try {
      const res = await fetch('/api/v1/ai/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'PDF analysis failed');
      }

      const result = await res.json();
      dispatch(analysisSuccess(result));
      if (result.extracted_text) {
        dispatch(setRawInput(result.extracted_text));
      }
    } catch (err) {
      dispatch(analysisFailure(err.message));
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!copilot.rawInput || copilot.rawInput.trim().length < 20) {
      alert('Please enter or select deviation incident details before running AI extraction.');
      return;
    }

    dispatch(startAnalysis());

    try {
      const res = await fetch('/api/v1/ai/extract-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: copilot.rawInput,
          source_type: copilot.sourceType,
          file_name: copilot.fileName,
          groq_api_key: copilot.groqApiKey || undefined,
          groq_model: copilot.groqModel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'AI RCA Extraction failed');
      }

      const result = await res.json();
      dispatch(analysisSuccess(result));
    } catch (err) {
      dispatch(analysisFailure(err.message));
      alert(`AI Extraction Error: ${err.message}`);
    }
  };

  const handleApplyToForm = () => {
    if (!copilot.extractedResult) return;
    dispatch(applyAiExtractedData(copilot.extractedResult));
  };

  const handleSendChat = async (promptText) => {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim()) return;

    dispatch(addChatMessage({ role: 'user', content: textToSend }));
    if (!promptText) setChatInput('');
    dispatch(setChatLoading(true));

    try {
      const res = await fetch('/api/v1/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          current_investigation: investigation,
          conversation_history: copilot.chatMessages,
          groq_api_key: copilot.groqApiKey || undefined,
          groq_model: copilot.groqModel,
        }),
      });

      if (!res.ok) throw new Error('Copilot response error');
      const data = await res.json();
      dispatch(addChatMessage({ role: 'assistant', content: data.reply }));
    } catch (err) {
      dispatch(addChatMessage({
        role: 'assistant',
        content: `I encountered an issue connecting to the inference engine: ${err.message}. Please check your Groq API key in Settings or verify your connection.`
      }));
    } finally {
      dispatch(setChatLoading(false));
    }
  };

  if (!copilot.isOpen) return null;

  return (
    <aside className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-16 shadow-xl z-30">
      
      {/* Panel Top Bar */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>AIVOA Quality Copilot</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-teal-900/80 text-teal-300 border border-teal-700/60">
                LangGraph
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">
              {copilot.groqApiKey ? `Groq (${copilot.groqModel})` : 'Quality Domain Engine (Offline Mode)'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => dispatch(setCopilotOpen(false))}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Collapse Copilot Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2">
        <button
          onClick={() => dispatch(setActiveTab('intake'))}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center justify-center gap-1.5 border-b-2 ${
            copilot.activeTab === 'intake'
              ? 'bg-white text-teal-700 border-teal-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 border-transparent'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>1. Incident Intake</span>
        </button>

        <button
          onClick={() => dispatch(setActiveTab('review'))}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center justify-center gap-1.5 border-b-2 ${
            copilot.activeTab === 'review'
              ? 'bg-white text-teal-700 border-teal-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 border-transparent'
          }`}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          <span>2. AI Staging</span>
          {copilot.extractedResult && (
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => dispatch(setActiveTab('chat'))}
          className={`flex-1 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center justify-center gap-1.5 border-b-2 ${
            copilot.activeTab === 'chat'
              ? 'bg-white text-teal-700 border-teal-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 border-transparent'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>3. QA Copilot</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* ================= TAB 1: INTAKE & SOURCE ================= */}
        {copilot.activeTab === 'intake' && (
          <div className="space-y-4">
            
            {/* Quick Sample Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Pre-loaded API Deviations</span>
                  <span className="text-[10px] text-teal-600 font-normal">(Instant Test)</span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedSampleId === s.id
                        ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate pr-2">{s.title}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        s.badge === 'Critical Deviation' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {s.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Batch: <strong className="font-mono text-slate-700">{s.batch}</strong></span>
                      <span>•</span>
                      <span>{s.source_type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Source Type Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Or Input Your Own Incident Data
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                {[
                  { id: 'Text', label: 'Pasted Text', icon: FileText },
                  { id: 'PDF', label: 'Upload PDF', icon: Upload },
                  { id: 'Email', label: 'Email Text', icon: Mail },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => dispatch(setSourceType(id))}
                    className={`py-1.5 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${
                      copilot.sourceType === id
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PDF Upload Area */}
            {copilot.sourceType === 'PDF' && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl p-6 text-center cursor-pointer bg-teal-50/30 hover:bg-teal-50/60 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".pdf" 
                  className="hidden" 
                />
                <div className="mx-auto w-10 h-10 rounded-full bg-teal-100 group-hover:bg-teal-200 text-teal-700 flex items-center justify-center mb-2 transition-colors">
                  {uploadLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  {copilot.fileName ? copilot.fileName : 'Click to upload Investigation Document (PDF)'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports GxP Deviation Reports, OOS investigation summaries, or BMR logs
                </p>
              </div>
            )}

            {/* Incident Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">Incident Narrative / Observation Text:</span>
                <span className="text-[10px] text-slate-400 font-mono">{copilot.rawInput.length} chars</span>
              </div>
              <textarea
                value={copilot.rawInput}
                onChange={(e) => dispatch(setRawInput(e.target.value))}
                rows={8}
                placeholder="Paste deviation description, manufacturing record observation, temperature chart note, or customer/regulatory notice..."
                className="w-full text-xs font-mono text-slate-800 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 leading-relaxed resize-y bg-slate-50/50"
              />
            </div>

            {/* Run Analysis Action Button */}
            <div className="pt-2">
              <button
                onClick={handleRunAnalysis}
                disabled={copilot.isAnalyzing || !copilot.rawInput.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {copilot.isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing LangGraph Multi-Agent Workflow...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze & Populate RCA Form</span>
                  </>
                )}
              </button>
            </div>

            {/* Live LangGraph Progress Animation */}
            {copilot.isAnalyzing && (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 space-y-2.5 border border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-teal-400 font-bold border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>LangGraph Agent Execution</span>
                  </span>
                  <span>Stage {copilot.analysisStage}/5</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {[
                    "1. Intake & Containment Extraction",
                    "2. 5-Whys Causal Chain Analysis",
                    "3. Ishikawa 6M Categorization",
                    "4. GMP Evidence & Data Gap Identification",
                    "5. Root Cause & CAPA Synthesis"
                  ].map((step, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-2 ${
                        copilot.analysisStage > idx 
                          ? 'text-emerald-400' 
                          : (copilot.analysisStage === idx + 1 ? 'text-teal-300 font-bold animate-pulse' : 'text-slate-500')
                      }`}
                    >
                      {copilot.analysisStage > idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${copilot.analysisStage === idx + 1 ? 'bg-teal-400 animate-ping' : 'bg-slate-700'}`} />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 2: AI STAGED REVIEW ================= */}
        {copilot.activeTab === 'review' && (
          <div className="space-y-4">
            
            {copilot.extractedResult ? (
              <>
                {/* Confidence & Overview Banner */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      <span>AI Extraction Complete</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-300">
                      {Math.round((copilot.confidenceScore || 0.94) * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-900/80 leading-relaxed">
                    The LangGraph multi-agent pipeline analyzed the incident narrative and generated structured findings.
                    Click <strong>Apply All to RCA Form</strong> to populate the investigation dossier.
                  </p>
                </div>

                {/* Primary Action: Apply to Form */}
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyToForm}
                    className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>Apply All to RCA Form</span>
                  </button>
                  <button
                    onClick={() => dispatch(clearExtractedResult())}
                    className="p-2.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-100"
                    title="Clear Staged Result"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Extracted Sections Preview Cards */}
                <div className="space-y-3">
                  
                  {/* 1. Deviation Details */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>1. Deviation Identification</span>
                      <span className="text-[10px] text-teal-600 font-mono font-semibold">
                        {copilot.extractedResult.deviation_data?.deviation_number || 'DEV-AUTO'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 mb-1">
                      {copilot.extractedResult.deviation_data?.title}
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 font-medium">
                      <div>Product: <span className="font-semibold text-slate-800">{copilot.extractedResult.deviation_data?.product_name}</span></div>
                      <div>Batch: <span className="font-mono text-slate-800">{copilot.extractedResult.deviation_data?.batch_number}</span></div>
                      <div>Stage: <span className="text-slate-800">{copilot.extractedResult.deviation_data?.manufacturing_stage}</span></div>
                      <div>Severity: <span className="font-bold text-rose-600">{copilot.extractedResult.deviation_data?.severity}</span></div>
                    </div>
                  </div>

                  {/* 2. 5 Whys Preview */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>2. 5-Whys Causal Chain</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {copilot.extractedResult.five_whys?.length || 0} Steps
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      {copilot.extractedResult.five_whys?.slice(0, 3).map((w, i) => (
                        <div key={i} className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="font-bold text-teal-700">Why {w.step}: </span>
                          <span className="text-slate-700">{w.answer}</span>
                        </div>
                      ))}
                      {(copilot.extractedResult.five_whys?.length || 0) > 3 && (
                        <div className="text-[10px] text-teal-600 font-medium text-center">
                          + {copilot.extractedResult.five_whys.length - 3} more whys down to systemic cause
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Fishbone 6M Counts */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>3. Ishikawa 6M Factors</span>
                      <span className="text-[10px] font-mono text-slate-500">6 Categories</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
                      {['man', 'machine', 'material', 'method', 'measurement', 'milieu'].map((cat) => {
                        const count = copilot.extractedResult.fishbone_data?.[cat]?.length || 0;
                        return (
                          <div key={cat} className="bg-slate-50 p-1.5 rounded border border-slate-100">
                            <div className="font-semibold text-slate-600 capitalize">{cat}</div>
                            <div className="text-slate-900 font-bold font-mono">{count} factors</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Missing Evidence Gaps */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>4. Investigation Gaps / Missing Evidence</span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold">
                        {copilot.extractedResult.missing_evidence?.length || 0} Gaps
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {copilot.extractedResult.missing_evidence?.map((gap, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-700">
                          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{gap.requested_item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Root Cause & CAPA */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>5. Root Cause & CAPA Matrix</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">
                        {copilot.extractedResult.capa_recommendations?.length || 0} Actions
                      </span>
                    </div>
                    <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-100 mb-2">
                      <span className="font-bold text-slate-800">Root Cause: </span>
                      <span className="text-slate-700">{copilot.extractedResult.root_cause_analysis?.root_cause}</span>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No Staged AI Analysis Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Go to the <strong>Incident Intake</strong> tab to provide deviation text or a PDF, then click <strong>Analyze & Populate</strong>.
                </p>
                <button
                  onClick={() => dispatch(setActiveTab('intake'))}
                  className="mt-4 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
                >
                  Go to Intake
                </button>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 3: QUALITY COPILOT CHAT ================= */}
        {copilot.activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            
            {/* Quick Prompt Suggestions */}
            <div className="mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Suggested Quality Questions:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  "Explain Why 5 in terms of FDA 21 CFR 211",
                  "Suggest an additional Preventive Action",
                  "Is batch re-crystallization allowed per ICH Q7?",
                  "What additional QC tests should we request?",
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(prompt)}
                    className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-md transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Log */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[320px] max-h-[420px]"
            >
              {copilot.chatMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 mb-1">
                        <Sparkles className="h-3 w-3" />
                        <span>AIVOA Quality Copilot</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {copilot.isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl rounded-bl-none p-3 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                    <span>Analyzing GMP regulations & RCA context...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="pt-2 border-t border-slate-200 mt-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask Quality Copilot (e.g. regulatory advice, CAPA recommendations)..."
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={copilot.isChatLoading || !chatInput.trim()}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header';
import RcaForm from './components/RcaForm';
import AiCopilotPanel from './components/AiCopilotPanel';
import SavedInvestigationsModal from './components/SavedInvestigationsModal';
import AuditTrailModal from './components/AuditTrailModal';
import SettingsModal from './components/SettingsModal';
import { fetchSavedInvestigations } from './store/slices/investigationsListSlice';
import { generateRcaPdf } from './utils/pdfGenerator';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { toggleCopilot } from './store/slices/copilotSlice';

export default function App() {
  const dispatch = useDispatch();
  const investigation = useSelector((state) => state.investigation);
  const copilot = useSelector((state) => state.copilot);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSavedInvestigations());
  }, [dispatch]);

  const handleExportPdf = () => {
    if (!investigation.title && !investigation.deviation_number) {
      alert('Please populate the investigation before exporting PDF.');
      return;
    }
    generateRcaPdf(investigation);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Global Application Header */}
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuditTrail={() => setIsAuditTrailOpen(true)}
        onExportPdf={handleExportPdf}
      />

      {/* Main Workspace: Split Pane (Dossier Form + AI Quality Copilot Panel) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left / Center: RCA Dossier Form */}
        <RcaForm onOpenAuditTrail={() => setIsAuditTrailOpen(true)} />

        {/* Floating Copilot Toggle Button (when panel is collapsed) */}
        {!copilot.isOpen && (
          <button
            onClick={() => dispatch(toggleCopilot())}
            className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white p-3.5 rounded-2xl shadow-xl shadow-teal-600/30 flex items-center gap-2 font-bold text-xs transition-all active:scale-95 group"
          >
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span>Open AI Copilot</span>
          </button>
        )}

        {/* Right Pane: AI Copilot Assistant */}
        <AiCopilotPanel />
      </main>

      {/* Application Modals */}
      <SavedInvestigationsModal />
      <AuditTrailModal 
        isOpen={isAuditTrailOpen} 
        onClose={() => setIsAuditTrailOpen(false)} 
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

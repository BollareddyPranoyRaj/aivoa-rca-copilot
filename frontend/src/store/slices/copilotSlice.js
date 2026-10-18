import { createSlice } from '@reduxjs/toolkit';

const initialCopilotState = {
  isOpen: true,
  activeTab: 'intake', // 'intake' | 'review' | 'chat'
  sourceType: 'Text',  // 'Text' | 'PDF' | 'Email'
  rawInput: '',
  fileName: null,
  isAnalyzing: false,
  analysisStage: 0, // 0 to 5
  executionTrace: [],
  confidenceScore: 0,
  extractedResult: null,
  error: null,
  
  // Interactive Chat
  chatMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AIVOA Quality Copilot. I assist with ICH Q7/Q9/Q10 compliant Root Cause Analyses. Paste deviation text, select a pharma sample incident, or upload an investigation PDF to extract and populate your RCA dossier.',
      timestamp: new Date().toISOString(),
    }
  ],
  isChatLoading: false,
  
  // Groq LLM Configuration
  groqApiKey: localStorage.getItem('AIVOA_GROQ_API_KEY') || '',
  groqModel: localStorage.getItem('AIVOA_GROQ_MODEL') || 'llama-3.3-70b-versatile',
};

export const copilotSlice = createSlice({
  name: 'copilot',
  initialState: initialCopilotState,
  reducers: {
    toggleCopilot: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCopilotOpen: (state, action) => {
      state.isOpen = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSourceType: (state, action) => {
      state.sourceType = action.payload;
    },
    setRawInput: (state, action) => {
      state.rawInput = action.payload;
    },
    setFileName: (state, action) => {
      state.fileName = action.payload;
    },
    startAnalysis: (state) => {
      state.isAnalyzing = true;
      state.analysisStage = 1;
      state.executionTrace = ['Initiating LangGraph Quality RCA Agent Workflow...'];
      state.error = null;
    },
    updateAnalysisProgress: (state, action) => {
      const { stage, traceItem } = action.payload;
      if (stage) state.analysisStage = stage;
      if (traceItem) state.executionTrace.push(traceItem);
    },
    analysisSuccess: (state, action) => {
      state.isAnalyzing = false;
      state.analysisStage = 5;
      state.extractedResult = action.payload;
      state.executionTrace = action.payload.execution_trace || state.executionTrace;
      state.confidenceScore = action.payload.confidence_score || 0.94;
      state.activeTab = 'review'; // Move to review staging tab
    },
    analysisFailure: (state, action) => {
      state.isAnalyzing = false;
      state.error = action.payload;
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push({
        id: `msg_${Date.now()}`,
        role: action.payload.role,
        content: action.payload.content,
        timestamp: new Date().toISOString(),
      });
    },
    setChatLoading: (state, action) => {
      state.isChatLoading = action.payload;
    },
    setGroqApiKey: (state, action) => {
      state.groqApiKey = action.payload;
      localStorage.setItem('AIVOA_GROQ_API_KEY', action.payload);
    },
    setGroqModel: (state, action) => {
      state.groqModel = action.payload;
      localStorage.setItem('AIVOA_GROQ_MODEL', action.payload);
    },
    clearExtractedResult: (state) => {
      state.extractedResult = null;
      state.analysisStage = 0;
      state.executionTrace = [];
    },
  },
});

export const {
  toggleCopilot,
  setCopilotOpen,
  setActiveTab,
  setSourceType,
  setRawInput,
  setFileName,
  startAnalysis,
  updateAnalysisProgress,
  analysisSuccess,
  analysisFailure,
  addChatMessage,
  setChatLoading,
  setGroqApiKey,
  setGroqModel,
  clearExtractedResult,
} = copilotSlice.actions;

export default copilotSlice.reducer;

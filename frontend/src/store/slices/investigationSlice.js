import { createSlice } from '@reduxjs/toolkit';

const initialInvestigationState = {
  id: null,
  deviation_number: '',
  title: '',
  product_name: '',
  product_code: '',
  batch_number: '',
  manufacturing_stage: '',
  incident_date: '',
  severity: 'Major', // Critical, Major, Minor
  status: 'Draft',   // Draft, In Investigation, Pending QA Review, Approved
  source_type: 'Text',
  source_content: '',
  immediate_containment: '',
  impact_assessment: '',
  problem_statement: '',
  
  // 5 Whys
  five_whys: [],
  
  // Fishbone 6M
  fishbone_data: {
    man: [],
    machine: [],
    material: [],
    method: [],
    measurement: [],
    milieu: [],
  },
  
  // Evidence & Gaps
  evidence_analyzed: [],
  missing_evidence: [],
  
  // Root Cause
  direct_cause: '',
  contributing_factors: [],
  root_cause: '',
  root_cause_category: 'Equipment / Maintenance',
  ai_confidence_score: 0.0,
  
  // CAPA
  capa_items: [],
  
  // Signoff & Governance
  investigator_name: 'Lead Quality Investigator',
  qp_name: '',
  qp_approval_status: 'Pending Review',
  qp_notes: '',
  
  // Form meta
  isDirty: false,
  isSaving: false,
  saveSuccessMessage: null,
  lastSavedAt: null,
};

export const investigationSlice = createSlice({
  name: 'investigation',
  initialState: initialInvestigationState,
  reducers: {
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
      state.isDirty = true;
    },
    
    // Apply AI extracted data from Copilot into form
    applyAiExtractedData: (state, action) => {
      const data = action.payload;
      if (data.deviation_data) {
        state.deviation_number = data.deviation_data.deviation_number || state.deviation_number;
        state.title = data.deviation_data.title || state.title;
        state.product_name = data.deviation_data.product_name || state.product_name;
        state.product_code = data.deviation_data.product_code || state.product_code;
        state.batch_number = data.deviation_data.batch_number || state.batch_number;
        state.manufacturing_stage = data.deviation_data.manufacturing_stage || state.manufacturing_stage;
        state.incident_date = data.deviation_data.incident_date || state.incident_date;
        state.severity = data.deviation_data.severity || state.severity;
        state.immediate_containment = data.deviation_data.immediate_containment || state.immediate_containment;
        state.impact_assessment = data.deviation_data.impact_assessment || state.impact_assessment;
        state.problem_statement = data.deviation_data.problem_statement || state.problem_statement;
      }
      
      if (data.five_whys && data.five_whys.length > 0) {
        state.five_whys = data.five_whys;
      }
      
      if (data.fishbone_data) {
        state.fishbone_data = {
          man: data.fishbone_data.man || [],
          machine: data.fishbone_data.machine || [],
          material: data.fishbone_data.material || [],
          method: data.fishbone_data.method || [],
          measurement: data.fishbone_data.measurement || [],
          milieu: data.fishbone_data.milieu || [],
        };
      }
      
      if (data.evidence_analyzed) {
        state.evidence_analyzed = data.evidence_analyzed;
      }
      
      if (data.missing_evidence) {
        state.missing_evidence = data.missing_evidence;
      }
      
      if (data.root_cause_analysis) {
        state.direct_cause = data.root_cause_analysis.direct_cause || state.direct_cause;
        state.contributing_factors = data.root_cause_analysis.contributing_factors || state.contributing_factors;
        state.root_cause = data.root_cause_analysis.root_cause || state.root_cause;
        state.root_cause_category = data.root_cause_analysis.root_cause_category || state.root_cause_category;
        state.ai_confidence_score = data.confidence_score || data.root_cause_analysis.confidence_score || 0.94;
      }
      
      if (data.capa_recommendations) {
        state.capa_items = data.capa_recommendations;
      }
      
      state.status = 'In Investigation';
      state.isDirty = true;
    },
    
    // 5 Whys actions
    updateFiveWhyStep: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.five_whys[index]) {
        state.five_whys[index][field] = value;
        state.isDirty = true;
      }
    },
    verifyFiveWhyStep: (state, action) => {
      const { index } = action.payload;
      if (state.five_whys[index]) {
        state.five_whys[index].verified = !state.five_whys[index].verified;
        state.isDirty = true;
      }
    },
    addFiveWhyStep: (state) => {
      const nextStep = state.five_whys.length + 1;
      state.five_whys.push({
        step: nextStep,
        question: `Why did step ${nextStep - 1} occur?`,
        answer: '',
        evidence_reference: '',
        verified: false,
        ai_suggested: false,
      });
      state.isDirty = true;
    },
    removeFiveWhyStep: (state, action) => {
      const index = action.payload;
      state.five_whys.splice(index, 1);
      // Re-index remaining steps
      state.five_whys.forEach((item, idx) => {
        item.step = idx + 1;
      });
      state.isDirty = true;
    },
    
    // Fishbone 6M actions
    updateFishboneFactor: (state, action) => {
      const { category, index, field, value } = action.payload;
      if (state.fishbone_data[category] && state.fishbone_data[category][index]) {
        state.fishbone_data[category][index][field] = value;
        state.isDirty = true;
      }
    },
    addFishboneFactor: (state, action) => {
      const { category, factor, status, justification } = action.payload;
      if (!state.fishbone_data[category]) {
        state.fishbone_data[category] = [];
      }
      state.fishbone_data[category].push({
        id: `${category.slice(0, 3)}_${Date.now()}`,
        factor: factor || 'New potential factor',
        status: status || 'Under Investigation',
        justification: justification || '',
        ai_suggested: false,
      });
      state.isDirty = true;
    },
    removeFishboneFactor: (state, action) => {
      const { category, index } = action.payload;
      if (state.fishbone_data[category]) {
        state.fishbone_data[category].splice(index, 1);
        state.isDirty = true;
      }
    },
    
    // Missing Evidence actions
    updateMissingEvidence: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.missing_evidence[index]) {
        state.missing_evidence[index][field] = value;
        state.isDirty = true;
      }
    },
    addMissingEvidenceItem: (state, action) => {
      state.missing_evidence.push({
        id: `gap_${Date.now()}`,
        requested_item: action.payload.requested_item || 'New evidence request',
        reason: action.payload.reason || '',
        priority: action.payload.priority || 'High',
        department: action.payload.department || 'Quality Assurance',
        status: 'Pending',
      });
      state.isDirty = true;
    },
    toggleMissingEvidenceStatus: (state, action) => {
      const index = action.payload;
      if (state.missing_evidence[index]) {
        const curr = state.missing_evidence[index].status;
        state.missing_evidence[index].status = curr === 'Received' ? 'Pending' : (curr === 'Pending' ? 'Requested' : 'Received');
        state.isDirty = true;
      }
    },
    
    // CAPA actions
    updateCapaItem: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.capa_items[index]) {
        state.capa_items[index][field] = value;
        state.isDirty = true;
      }
    },
    addCapaItem: (state, action) => {
      state.capa_items.push({
        id: `capa_${Date.now()}`,
        type: action.payload.type || 'Corrective Action',
        title: action.payload.title || 'New CAPA item',
        description: action.payload.description || '',
        rationale: action.payload.rationale || '',
        owner: action.payload.owner || 'QA Department',
        due_date: action.payload.due_date || 'Within 30 Days',
        status: 'Open',
        effectiveness_check: action.payload.effectiveness_check || '',
        ai_suggested: false,
      });
      state.isDirty = true;
    },
    removeCapaItem: (state, action) => {
      const index = action.payload;
      state.capa_items.splice(index, 1);
      state.isDirty = true;
    },
    
    // Verify all AI suggestions
    confirmAllSuggestions: (state) => {
      state.five_whys.forEach(w => { w.verified = true; });
      state.qp_approval_status = 'Pending Review';
      state.isDirty = true;
    },
    
    // Load full investigation record
    loadInvestigation: (state, action) => {
      return {
        ...state,
        ...action.payload,
        isDirty: false,
        saveSuccessMessage: null,
      };
    },
    
    // Reset form for blank new investigation
    resetInvestigation: () => {
      return {
        ...initialInvestigationState,
        deviation_number: `DEV-2024-${Math.floor(1000 + Math.random() * 9000)}`,
        incident_date: new Date().toISOString().split('T')[0],
      };
    },
    
    setSaveStatus: (state, action) => {
      state.isSaving = action.payload.isSaving;
      state.saveSuccessMessage = action.payload.message || null;
      if (action.payload.lastSavedAt) {
        state.lastSavedAt = action.payload.lastSavedAt;
        state.isDirty = false;
      }
    },
  },
});

export const {
  updateField,
  applyAiExtractedData,
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
  loadInvestigation,
  resetInvestigation,
  setSaveStatus,
} = investigationSlice.actions;

export default investigationSlice.reducer;

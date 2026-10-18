from typing import TypedDict, List, Dict, Any, Optional

class RCAInvestigationState(TypedDict):
    raw_input: str
    source_type: str
    file_name: Optional[str]
    groq_api_key: Optional[str]
    groq_model: Optional[str]
    
    # Extracted deviation metadata & initial containment
    deviation_data: Dict[str, Any]
    
    # 5 Whys causal chain
    five_whys: List[Dict[str, Any]]
    
    # 6M Fishbone categorization
    fishbone_data: Dict[str, Any]
    
    # Supporting evidence & Missing information gaps
    evidence_analyzed: List[Dict[str, Any]]
    missing_evidence: List[Dict[str, Any]]
    
    # Root cause determination
    root_cause_analysis: Dict[str, Any]
    
    # CAPA recommendations
    capa_recommendations: List[Dict[str, Any]]
    
    # Execution trace / reasoning steps
    execution_trace: List[str]
    confidence_score: float
    error: Optional[str]

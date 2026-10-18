from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FiveWhyItem(BaseModel):
    step: int
    question: str
    answer: str
    evidence_reference: Optional[str] = ""
    verified: bool = False
    ai_suggested: bool = True

class FishboneFactor(BaseModel):
    id: str
    factor: str
    status: str = "Under Investigation"  # Ruled Out, Contributing Factor, Potential Root Cause, Under Investigation
    justification: Optional[str] = ""
    ai_suggested: bool = True

class FishboneData(BaseModel):
    man: List[FishboneFactor] = []
    machine: List[FishboneFactor] = []
    material: List[FishboneFactor] = []
    method: List[FishboneFactor] = []
    measurement: List[FishboneFactor] = []
    milieu: List[FishboneFactor] = []

class EvidenceItem(BaseModel):
    id: str
    title: str
    source: str
    verified: bool = True
    findings: str

class MissingEvidenceItem(BaseModel):
    id: str
    requested_item: str
    reason: str
    priority: str = "High"  # High, Medium, Low
    department: str = "Quality Engineering"
    status: str = "Pending"  # Pending, Requested, Received

class CapaItem(BaseModel):
    id: str
    type: str = "Corrective Action"  # Immediate Containment / Correction, Corrective Action, Preventive Action
    title: str
    description: str
    rationale: str
    owner: str = "QA / Production"
    due_date: str = ""
    status: str = "Open"  # Open, In Progress, Completed
    effectiveness_check: Optional[str] = ""
    ai_suggested: bool = True

class InvestigationBase(BaseModel):
    deviation_number: str
    title: str
    product_name: str
    product_code: Optional[str] = ""
    batch_number: str
    manufacturing_stage: Optional[str] = ""
    incident_date: Optional[str] = ""
    severity: str = "Major"
    status: str = "Draft"
    source_type: str = "Text"
    source_content: Optional[str] = ""
    immediate_containment: Optional[str] = ""
    impact_assessment: Optional[str] = ""
    problem_statement: Optional[str] = ""
    direct_cause: Optional[str] = ""
    contributing_factors: List[str] = []
    root_cause: Optional[str] = ""
    root_cause_category: Optional[str] = "Equipment / Maintenance"
    five_whys: List[Dict[str, Any]] = []
    fishbone_data: Dict[str, Any] = {}
    evidence_analyzed: List[Dict[str, Any]] = []
    missing_evidence: List[Dict[str, Any]] = []
    capa_items: List[Dict[str, Any]] = []
    investigator_name: str = "Lead Quality Investigator"
    qp_name: Optional[str] = ""
    qp_approval_status: str = "Pending Review"
    qp_notes: Optional[str] = ""
    ai_confidence_score: float = 0.0

class InvestigationCreate(InvestigationBase):
    pass

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_stage: Optional[str] = None
    incident_date: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    source_type: Optional[str] = None
    source_content: Optional[str] = None
    immediate_containment: Optional[str] = None
    impact_assessment: Optional[str] = None
    problem_statement: Optional[str] = None
    direct_cause: Optional[str] = None
    contributing_factors: Optional[List[str]] = None
    root_cause: Optional[str] = None
    root_cause_category: Optional[str] = None
    five_whys: Optional[List[Dict[str, Any]]] = None
    fishbone_data: Optional[Dict[str, Any]] = None
    evidence_analyzed: Optional[List[Dict[str, Any]]] = None
    missing_evidence: Optional[List[Dict[str, Any]]] = None
    capa_items: Optional[List[Dict[str, Any]]] = None
    investigator_name: Optional[str] = None
    qp_name: Optional[str] = None
    qp_approval_status: Optional[str] = None
    qp_notes: Optional[str] = None
    ai_confidence_score: Optional[float] = None

class InvestigationResponse(InvestigationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    investigation_id: int
    action: str
    performed_by: str
    timestamp: datetime
    details: Optional[str] = None

    class Config:
        from_attributes = True

class AnalysisIntakeRequest(BaseModel):
    content: str
    source_type: str = "Text"  # Text, PDF, Email
    file_name: Optional[str] = None
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = "llama-3.3-70b-versatile"

class AICopilotChatRequest(BaseModel):
    message: str
    current_investigation: Dict[str, Any]
    conversation_history: Optional[List[Dict[str, str]]] = []
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = "llama-3.3-70b-versatile"

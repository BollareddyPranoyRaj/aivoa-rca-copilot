import os
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import Investigation, AuditLog
from app.schemas import (
    InvestigationCreate,
    InvestigationUpdate,
    InvestigationResponse,
    AuditLogResponse,
    AnalysisIntakeRequest,
    AICopilotChatRequest,
)
from app.agents.graph import rca_graph
from app.agents.state import RCAInvestigationState
from app.services.pdf_parser import extract_text_from_pdf, get_pdf_metadata
from app.services.copilot_service import run_copilot_chat
from app.sample_data.deviations import SAMPLE_INCIDENTS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aivoa-rca")

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Root Cause Analysis (RCA) and CAPA Engine for Pharmaceutical API Quality Systems",
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Operational",
        "docs": "/docs",
    }

@app.get("/api/v1/health")
def health(db: Session = Depends(get_db)):
    db_type = "PostgreSQL" if "postgresql" in str(engine.url) else "SQLite"
    groq_configured = bool(settings.GROQ_API_KEY)
    return {
        "status": "healthy",
        "database": db_type,
        "database_url": str(engine.url).split("@")[-1] if "@" in str(engine.url) else str(engine.url),
        "groq_configured": groq_configured,
        "groq_model": settings.GROQ_MODEL,
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/api/v1/samples")
def get_sample_incidents():
    """Returns curated pharmaceutical API manufacturing deviation samples."""
    return SAMPLE_INCIDENTS

@app.post("/api/v1/ai/extract-and-analyze")
def extract_and_analyze(request: AnalysisIntakeRequest):
    """
    Executes the multi-agent LangGraph workflow:
    Deviation Intake -> 5 Whys -> 6M Fishbone -> Evidence Gap Audit -> Root Cause & CAPA Synthesis.
    """
    if not request.content or len(request.content.strip()) < 10:
        raise HTTPException(status_code=400, detail="Incident text or document content is too short for analysis.")
    
    initial_state: RCAInvestigationState = {
        "raw_input": request.content,
        "source_type": request.source_type,
        "file_name": request.file_name,
        "groq_api_key": request.groq_api_key or settings.GROQ_API_KEY,
        "groq_model": request.groq_model or settings.GROQ_MODEL,
        "deviation_data": {},
        "five_whys": [],
        "fishbone_data": {},
        "evidence_analyzed": [],
        "missing_evidence": [],
        "root_cause_analysis": {},
        "capa_recommendations": [],
        "execution_trace": [],
        "confidence_score": 0.0,
        "error": None,
    }
    
    try:
        final_state = rca_graph.invoke(initial_state)
        return {
            "deviation_data": final_state.get("deviation_data", {}),
            "five_whys": final_state.get("five_whys", []),
            "fishbone_data": final_state.get("fishbone_data", {}),
            "evidence_analyzed": final_state.get("evidence_analyzed", []),
            "missing_evidence": final_state.get("missing_evidence", []),
            "root_cause_analysis": final_state.get("root_cause_analysis", {}),
            "capa_recommendations": final_state.get("capa_recommendations", []),
            "execution_trace": final_state.get("execution_trace", []),
            "confidence_score": final_state.get("confidence_score", 0.92),
            "used_groq": bool(initial_state["groq_api_key"]),
        }
    except Exception as e:
        logger.exception("Error executing LangGraph RCA workflow")
        raise HTTPException(status_code=500, detail=f"AI RCA processing error: {str(e)}")

@app.post("/api/v1/ai/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    groq_api_key: Optional[str] = Form(None),
    groq_model: Optional[str] = Form("llama-3.3-70b-versatile")
):
    """
    Extracts text from uploaded PDF investigation file and runs the LangGraph RCA workflow.
    """
    try:
        contents = await file.read()
        extracted_text = extract_text_from_pdf(contents)
        if not extracted_text or len(extracted_text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Could not extract readable text from PDF. Ensure file is not scanned image-only.")
        
        pdf_meta = get_pdf_metadata(contents)
        
        # Now trigger analysis
        intake_req = AnalysisIntakeRequest(
            content=extracted_text,
            source_type="PDF Document",
            file_name=file.filename,
            groq_api_key=groq_api_key,
            groq_model=groq_model
        )
        result = extract_and_analyze(intake_req)
        result["extracted_text"] = extracted_text
        result["file_name"] = file.filename
        result["pdf_metadata"] = pdf_meta
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error reading PDF file")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.post("/api/v1/ai/copilot-chat")
def copilot_chat(request: AICopilotChatRequest):
    """
    Interactive Q&A and investigation guidance with the AIVOA Quality Copilot.
    """
    reply = run_copilot_chat(
        message=request.message,
        investigation=request.current_investigation,
        history=request.conversation_history,
        groq_api_key=request.groq_api_key,
        groq_model=request.groq_model
    )
    return {"reply": reply}

# CRUD Endpoints for Investigations
@app.get("/api/v1/investigations", response_model=List[InvestigationResponse])
def list_investigations(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Investigation).order_by(Investigation.updated_at.desc()).offset(skip).limit(limit).all()

@app.get("/api/v1/investigations/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(investigation_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv

@app.post("/api/v1/investigations", response_model=InvestigationResponse)
def create_investigation(payload: InvestigationCreate, db: Session = Depends(get_db)):
    # Check if deviation_number already exists
    existing = db.query(Investigation).filter(Investigation.deviation_number == payload.deviation_number).first()
    if existing:
        # Auto-append timestamp to make unique or update
        payload.deviation_number = f"{payload.deviation_number}-{int(datetime.utcnow().timestamp())}"
    
    inv = Investigation(**payload.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    
    # Create initial audit log
    audit = AuditLog(
        investigation_id=inv.id,
        action="Investigation Created",
        performed_by=inv.investigator_name or "Quality Investigator",
        details=f"Investigation created for deviation {inv.deviation_number} (Product: {inv.product_name}, Batch: {inv.batch_number})."
    )
    db.add(audit)
    db.commit()
    
    return inv

@app.put("/api/v1/investigations/{investigation_id}", response_model=InvestigationResponse)
def update_investigation(investigation_id: int, payload: InvestigationUpdate, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(inv, field, val)
    
    inv.updated_at = datetime.utcnow()
    
    audit = AuditLog(
        investigation_id=inv.id,
        action="Investigation Updated",
        performed_by=inv.investigator_name or "Quality Investigator",
        details=f"Updated investigation fields: {', '.join(update_data.keys())}."
    )
    db.add(audit)
    db.commit()
    db.refresh(inv)
    return inv

@app.delete("/api/v1/investigations/{investigation_id}")
def delete_investigation(investigation_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    db.delete(inv)
    db.commit()
    return {"message": "Investigation deleted successfully"}

@app.post("/api/v1/investigations/{investigation_id}/signoff", response_model=InvestigationResponse)
def signoff_investigation(
    investigation_id: int,
    qp_name: str = Query(..., description="Qualified Person (QP) Name"),
    approval_status: str = Query("Approved", description="Approved or Rejected"),
    notes: Optional[str] = Query("", description="Review notes"),
    db: Session = Depends(get_db)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    inv.qp_name = qp_name
    inv.qp_approval_status = approval_status
    inv.qp_notes = notes
    inv.status = "Approved" if approval_status == "Approved" else "Pending QA Review"
    inv.updated_at = datetime.utcnow()
    
    audit = AuditLog(
        investigation_id=inv.id,
        action=f"QP Formal Sign-off: {approval_status}",
        performed_by=qp_name,
        details=f"Qualified Person {qp_name} marked status as {approval_status}. Notes: {notes}"
    )
    db.add(audit)
    db.commit()
    db.refresh(inv)
    return inv

@app.get("/api/v1/investigations/{investigation_id}/audit-trail", response_model=List[AuditLogResponse])
def get_audit_trail(investigation_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return db.query(AuditLog).filter(AuditLog.investigation_id == investigation_id).order_by(AuditLog.timestamp.desc()).all()

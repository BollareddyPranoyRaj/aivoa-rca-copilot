from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    deviation_number = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    product_name = Column(String(255), nullable=False)
    product_code = Column(String(100), nullable=True)
    batch_number = Column(String(100), index=True, nullable=False)
    manufacturing_stage = Column(String(100), nullable=True)
    incident_date = Column(String(50), nullable=True)
    severity = Column(String(50), default="Major")  # Critical, Major, Minor
    status = Column(String(50), default="Draft")    # Draft, In Investigation, Pending QA Review, Approved, Closed
    
    # Source & Intake
    source_type = Column(String(50), default="Text")  # PDF, Email, Text
    source_content = Column(Text, nullable=True)
    immediate_containment = Column(Text, nullable=True)
    impact_assessment = Column(Text, nullable=True)
    problem_statement = Column(Text, nullable=True)
    
    # Root Cause Determination
    direct_cause = Column(Text, nullable=True)
    contributing_factors = Column(JSON, default=list)
    root_cause = Column(Text, nullable=True)
    root_cause_category = Column(String(100), nullable=True)  # Equipment, Method/Process, Material, Personnel, Measurement, Environment
    
    # Structured Investigation Methodologies
    five_whys = Column(JSON, default=list)
    fishbone_data = Column(JSON, default=dict)
    
    # Evidence & Investigation Gaps
    evidence_analyzed = Column(JSON, default=list)
    missing_evidence = Column(JSON, default=list)
    
    # CAPA Actions (ICH Q10)
    capa_items = Column(JSON, default=list)
    
    # Governance & Sign-off
    investigator_name = Column(String(150), default="Lead Quality Investigator")
    qp_name = Column(String(150), nullable=True)
    qp_approval_status = Column(String(50), default="Pending Review")  # Pending Review, Approved, Rejected
    qp_notes = Column(Text, nullable=True)
    ai_confidence_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="investigation", cascade="all, delete-orphan")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(255), nullable=False)
    performed_by = Column(String(150), default="Quality System")
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)

    investigation = relationship("Investigation", back_populates="audit_logs")

import logging
from app.database import engine, SessionLocal, Base
from app.models import Investigation, AuditLog
from app.sample_data.deviations import SAMPLE_INCIDENTS
from app.agents.fallback_engine import generate_fallback_rca

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if investigations already exist
    count = db.query(Investigation).count()
    if count > 0:
        logger.info(f"Database already seeded with {count} records.")
        db.close()
        return

    logger.info("Seeding initial high-fidelity pharmaceutical API investigations into PostgreSQL...")
    
    for inc in SAMPLE_INCIDENTS:
        rca_data = generate_fallback_rca(inc['text'], inc['source_type'])
        dev_info = rca_data['deviation_data']
        
        inv = Investigation(
            deviation_number=dev_info['deviation_number'],
            title=dev_info['title'],
            product_name=dev_info['product_name'],
            product_code=dev_info.get('product_code', 'API-GEN-01'),
            batch_number=dev_info['batch_number'],
            manufacturing_stage=dev_info['manufacturing_stage'],
            incident_date=dev_info.get('incident_date', '2024-10-18'),
            severity=dev_info['severity'],
            status="In Investigation",
            source_type=inc['source_type'],
            source_content=inc['text'],
            immediate_containment=dev_info['immediate_containment'],
            impact_assessment=dev_info['impact_assessment'],
            problem_statement=dev_info['problem_statement'],
            direct_cause=rca_data['root_cause_analysis']['direct_cause'],
            contributing_factors=rca_data['root_cause_analysis']['contributing_factors'],
            root_cause=rca_data['root_cause_analysis']['root_cause'],
            root_cause_category=rca_data['root_cause_analysis']['root_cause_category'],
            five_whys=rca_data['five_whys'],
            fishbone_data=rca_data['fishbone_data'],
            evidence_analyzed=rca_data['evidence_analyzed'],
            missing_evidence=rca_data['missing_evidence'],
            capa_items=rca_data['capa_recommendations'],
            investigator_name="Lead Quality Investigator",
            qp_name="Dr. Arthur Vance, Qualified Person",
            qp_approval_status="Pending Review",
            qp_notes="Initial investigation completed per ICH Q7/Q10. Awaiting final closure of missing evidence work orders.",
            ai_confidence_score=0.94,
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)
        
        # Add initial audit log
        audit = AuditLog(
            investigation_id=inv.id,
            action="Investigation Initialized & AI Analysis Run",
            performed_by="AIVOA Quality Copilot",
            details=f"Extracted from {inc['source_type']}. 5-Whys, 6M Ishikawa, and CAPA matrix synthesized."
        )
        db.add(audit)
        db.commit()
        logger.info(f"Seeded #{inv.deviation_number} - {inv.title}")
        
    db.close()
    logger.info("Database seeding successfully completed!")

if __name__ == "__main__":
    seed()

import re
from typing import Dict, Any

def generate_fallback_rca(raw_text: str, source_type: str = "Text", file_name: str = None) -> Dict[str, Any]:
    """
    Intelligent domain-specific fallback analysis engine for Pharmaceutical API RCA.
    Used when Groq API key is not supplied or during offline demonstration mode.
    """
    lower = raw_text.lower()
    
    # 1. Detect scenario by specific product/incident keywords
    if "atorvastatin" in lower or "crystalliz" in lower or "impurity d" in lower:
        return _atorvastatin_crystallization_scenario(raw_text)
    elif "ibuprofen" in lower or "particle" in lower or "microniz" in lower or "jet mill" in lower or "flaking" in lower:
        return _ibuprofen_micronization_scenario(raw_text)
    elif "paracetamol" in lower or "vtd" in lower or "vacuum tray dryer" in lower or "acetaminophen" in lower:
        return _paracetamol_dryer_scenario(raw_text)
    elif "amoxicillin" in lower or "enzyme" in lower or "enzymatic" in lower:
        return _amoxicillin_yield_scenario(raw_text)
    elif "metformin" in lower or "titration" in lower:
        return _metformin_assay_scenario(raw_text)
    elif "dryer" in lower or "drying" in lower or "vacuum" in lower:
        return _paracetamol_dryer_scenario(raw_text)
    else:
        # Default / Crystallization OOS Atorvastatin scenario
        return _atorvastatin_crystallization_scenario(raw_text)

def _atorvastatin_crystallization_scenario(raw_text: str) -> Dict[str, Any]:
    return {
        "deviation_data": {
            "deviation_number": "DEV-2024-0419",
            "title": "Out-of-Specification (OOS) Impurity D Spike in Atorvastatin Calcium API",
            "product_name": "Atorvastatin Calcium Trihydrate API",
            "product_code": "API-ATC-20",
            "batch_number": "ATC-24-089",
            "manufacturing_stage": "Stage 4: Reaction & Controlled Crystallization",
            "incident_date": "2024-10-18",
            "severity": "Critical",
            "immediate_containment": "Batch ATC-24-089 placed on immediate QA Quarantine Hold in Warehouse 2 (Location Q-41). Crystallizer CR-302 tagged out of service. Upstream crude intermediate lot L1-2024-118 placed on hold pending investigation.",
            "impact_assessment": "Batch of 450 kg finished API is out of specification for Related Substance Impurity D (found 0.24%, specification limit ≤ 0.15%). Adjacent commercial batch ATC-24-088 tested and verified compliant at 0.06%. No product has been released to commercial distribution.",
            "problem_statement": "During release testing of Atorvastatin Calcium Batch ATC-24-089 on 18-Oct-2024, QC reported Related Substance Impurity D at 0.24% by HPLC (spec ≤ 0.15%), representing an Out-of-Specification failure in crystallization stage holding."
        },
        "five_whys": [
            {
                "step": 1,
                "question": "Why did finished batch ATC-24-089 fail the Related Substance Impurity D specification at 0.24%?",
                "answer": "Excessive oxidative degradation of Atorvastatin precursor occurred during the second cooling crystallization step.",
                "evidence_reference": "QC HPLC Test Report QC-TR-2024-1189; chromatogram showing peak at RRT 1.42.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 2,
                "question": "Why did excessive oxidative degradation occur during the crystallization step?",
                "answer": "The slurry in Crystallizer CR-302 was maintained at 42°C for 6.5 hours instead of the SOP-specified maximum holding time of 2.0 hours.",
                "evidence_reference": "SCADA Historian Temperature Profile Tag TI-CR302-01 (18-Oct-2024, 01:15 to 07:45 UTC).",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 3,
                "question": "Why was the crystallization slurry held at 42°C for 6.5 hours?",
                "answer": "The downstream Nutsche Filter Dryer FD-04 was unavailable due to an unexpected mechanical seal buffer pressure alarm.",
                "evidence_reference": "Equipment Logbook EL-FD-04, Entry 18-Oct-2024 02:30 by Shift Operator B.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 4,
                "question": "Why did Nutsche Filter Dryer FD-04 experience a mechanical seal buffer pressure alarm?",
                "answer": "The nitrogen barrier pressure regulator PR-04 was malfunctioning due to particulate clogging in the primary regulator seat.",
                "evidence_reference": "Work Order WO-ENG-2024-0982 Maintenance Inspection Report.",
                "verified": False,
                "ai_suggested": True
            },
            {
                "step": 5,
                "question": "Why was the particulate clogging on nitrogen regulator PR-04 not detected before the batch run?",
                "answer": "Systemic root cause: The PM procedure PM-SOP-UT-12 did not mandate quarterly inspection of upstream 0.2μm gas filter elements, and the SCADA interlock alarm for buffer gas pressure delta had been suppressed without change control approval during an earlier turnaround.",
                "evidence_reference": "CMMS Maintenance History for Utility Substation 4; SCADA Audit Trail User Bypass Log.",
                "verified": False,
                "ai_suggested": True
            }
        ],
        "fishbone_data": {
            "man": [
                {
                    "id": "man_1",
                    "factor": "Shift handover did not document slurry holding timer",
                    "status": "Contributing Factor",
                    "justification": "Operator shift change occurred at 06:00 without explicit flag of the 2-hour slurry hold limit countdown.",
                    "ai_suggested": True
                },
                {
                    "id": "man_2",
                    "factor": "Operator training on SOP-PR-302 holding excursion escalation",
                    "status": "Contributing Factor",
                    "justification": "Operators attempted manual pressure reset 3 times rather than notifying QA after 60 min delay.",
                    "ai_suggested": True
                }
            ],
            "machine": [
                {
                    "id": "mac_1",
                    "factor": "Nutsche Filter Dryer FD-04 nitrogen seal regulator failure",
                    "status": "Potential Root Cause",
                    "justification": "Primary mechanical trigger that halted transfer of slurry from Crystallizer CR-302.",
                    "ai_suggested": True
                },
                {
                    "id": "mac_2",
                    "factor": "Crystallizer CR-302 secondary cooling circuit temperature sensor TT-302A",
                    "status": "Ruled Out",
                    "justification": "Calibration certificate CAL-2024-884 shows sensor was calibrated within ±0.2°C tolerance on 01-Oct-2024.",
                    "ai_suggested": True
                }
            ],
            "material": [
                {
                    "id": "mat_1",
                    "factor": "Starting material intermediate Lot L1-2024-118 purity",
                    "status": "Ruled Out",
                    "justification": "Re-tested under CoA QC-RM-9801: purity 99.4%, Impurity D undetectable (<0.02%).",
                    "ai_suggested": True
                },
                {
                    "id": "mat_2",
                    "factor": "Crystallization solvent Ethyl Acetate peroxide content",
                    "status": "Contributing Factor",
                    "justification": "Solvent drum opened 14 days prior showed peroxide value of 8 ppm (specification ≤ 10 ppm), potentially catalyzing thermal oxidation.",
                    "ai_suggested": True
                }
            ],
            "method": [
                {
                    "id": "met_1",
                    "factor": "SOP-PR-302 lacks explicit chilling contingency for unplanned filter delays",
                    "status": "Contributing Factor",
                    "justification": "SOP defines holding at 42°C for transfer, but lacks instruction to actively drop temperature to 10°C if delay exceeds 2 hours.",
                    "ai_suggested": True
                },
                {
                    "id": "met_2",
                    "factor": "Batch Manufacturing Record (BMR) missing holding time limit sign-off",
                    "status": "Contributing Factor",
                    "justification": "BMR Step 14.3 did not include mandatory hold-time timestamp entry.",
                    "ai_suggested": True
                }
            ],
            "measurement": [
                {
                    "id": "mea_1",
                    "factor": "QC HPLC Analytical Method TM-ATC-04 method error",
                    "status": "Ruled Out",
                    "justification": "Standard re-injection precision %RSD was 0.4%; duplicate injection by independent analyst confirmed 0.238% and 0.241%.",
                    "ai_suggested": True
                },
                {
                    "id": "mea_2",
                    "factor": "In-line PAT Turbidity Probe drift during crystallization",
                    "status": "Ruled Out",
                    "justification": "PAT probe confirmed crystallization endpoint at 01:10 UTC correctly before the hold delay.",
                    "ai_suggested": True
                }
            ],
            "milieu": [
                {
                    "id": "mil_1",
                    "factor": "Cleanroom Suite 3 differential pressure and temperature",
                    "status": "Ruled Out",
                    "justification": "BMS environmental logs confirm HVAC Grade D pressure differential at 22 Pa, temp 20.8°C.",
                    "ai_suggested": True
                },
                {
                    "id": "mil_2",
                    "factor": "Nitrogen blanket line header pressure fluctuation",
                    "status": "Contributing Factor",
                    "justification": "Central N2 utility supply dropped to 4.2 bar during peak plant consumption, compounding regulator issue.",
                    "ai_suggested": True
                }
            ]
        },
        "evidence_analyzed": [
            {
                "id": "ev_1",
                "title": "QC HPLC Test Report & Chromatograms (QC-TR-2024-1189)",
                "source": "QC Laboratory Information Management System (LIMS)",
                "verified": True,
                "findings": "Confirmed Impurity D at 0.24% (spec ≤ 0.15%). Retention time and UV spectrum match oxidative reference standard."
            },
            {
                "id": "ev_2",
                "title": "SCADA Historian Temperature Profile (TI-CR302-01)",
                "source": "DeltaV DCS Historian",
                "verified": True,
                "findings": "Confirmed crystallization batch was held at 42.1°C to 42.8°C for 6 hours 32 minutes."
            },
            {
                "id": "ev_3",
                "title": "Equipment Logbook EL-FD-04 & Maintenance Work Order",
                "source": "Production Equipment Logbook",
                "verified": True,
                "findings": "Nutsche Filter Dryer FD-04 buffer seal alarm triggered at 02:30; technician response delayed until 06:15."
            }
        ],
        "missing_evidence": [
            {
                "id": "gap_1",
                "requested_item": "SCADA User Bypass Audit Trail for Utility Nitrogen Interlocks",
                "reason": "Verify when and by whom the primary regulator alarm delta threshold was suppressed.",
                "priority": "High",
                "department": "Automation & Controls",
                "status": "Pending"
            },
            {
                "id": "gap_2",
                "requested_item": "Preventive Maintenance History & Replacement Records for Gas Filter Element N2-F-02",
                "reason": "Confirm if 0.2μm gas particulate filter had exceeded its validated change-out cycle.",
                "priority": "High",
                "department": "Engineering Maintenance",
                "status": "Pending"
            },
            {
                "id": "gap_3",
                "requested_item": "Ethyl Acetate Solvent Drum CoA and Peroxide Logbook (Lot SOL-EA-412)",
                "reason": "Determine exact peroxide level in fresh solvent drum prior to dispensing into CR-302.",
                "priority": "Medium",
                "department": "Raw Materials Warehouse & QC",
                "status": "Pending"
            }
        ],
        "root_cause_analysis": {
            "direct_cause": "Slurry solution was held in Crystallizer CR-302 at 42°C for 6.5 hours (SOP limit ≤ 2.0 h), driving thermal and oxidative formation of Related Substance Impurity D above specification limit.",
            "contributing_factors": [
                "Nutsche Filter Dryer FD-04 mechanical seal buffer pressure alarm halted automated slurry transfer.",
                "SOP-PR-302 lacked an automated emergency chilling abort recipe (active cooling to 10°C upon holding time breach).",
                "Shift handover between night and morning shifts did not mandate verbal or written confirmation of holding duration countdown.",
                "SCADA nitrogen pressure regulator alarm threshold had been silenced during previous maintenance without Change Control approval."
            ],
            "root_cause": "Lack of closed-loop interlock protection and emergency chilling protocols in SOP-PR-302 during crystallization transfer delays, compounded by unmanaged alarm suppression in the DCS utility interlock system.",
            "root_cause_category": "Equipment / Maintenance & Process Control",
            "confidence_score": 0.94
        },
        "capa_recommendations": [
            {
                "id": "capa_1",
                "type": "Immediate Containment / Correction",
                "title": "Quarantine Batch ATC-24-089 & Conduct Stability / Reprocessing Evaluation",
                "description": "Maintain batch ATC-24-089 under physical and SAP quarantine status. Initiate technical review to assess if batch can be re-crystallized per validated reprocessing protocol or must be rejected.",
                "rationale": "Prevents any possibility of non-compliant API reaching downstream formulated drug product manufacturing.",
                "owner": "Head of Quality Assurance",
                "due_date": "Within 5 Days",
                "status": "In Progress",
                "effectiveness_check": "Physical quarantine reconciliation and SAP system status verified locked.",
                "ai_suggested": True
            },
            {
                "id": "capa_2",
                "type": "Corrective Action",
                "title": "Overhaul FD-04 Seal Regulator & Reinstate SCADA Interlock Alarms",
                "description": "Replace clogged nitrogen regulator PR-04 and upstream 0.2μm gas filter element. Perform 100% audit of all bypassed SCADA interlock alarms and reinstate automated lockout.",
                "rationale": "Directly eliminates the mechanical failure mode that triggered the unexpected downstream filter halt.",
                "owner": "Engineering Maintenance Manager",
                "due_date": "Within 14 Days",
                "status": "Open",
                "effectiveness_check": "72-hour continuous pressure stability verification on FD-04 barrier seal prior to production release.",
                "ai_suggested": True
            },
            {
                "id": "capa_3",
                "type": "Corrective Action",
                "title": "Revise SOP-PR-302 to Implement Automated Emergency Slurry Chilling",
                "description": "Update SOP-PR-302 and DeltaV recipe sequence: if slurry transfer is delayed >120 minutes, DCS will automatically trigger secondary jacket chilling to bring vessel temperature to ≤10°C under continuous nitrogen purge.",
                "rationale": "Prevents thermal degradation and impurity formation even during prolonged downstream filtration holds.",
                "owner": "API Process Engineering Lead",
                "due_date": "Within 21 Days",
                "status": "Open",
                "effectiveness_check": "Simulation dry-run test of emergency chilling sequence witnessed and documented by QA.",
                "ai_suggested": True
            },
            {
                "id": "capa_4",
                "type": "Preventive Action",
                "title": "Plant-wide Alarm Governance & Change Control Procedure Audit",
                "description": "Conduct site-wide review of alarm suppression protocols. Implement 21 CFR Part 11 compliant daily alarm bypass exception report reviewed by QA in daily tier meetings.",
                "rationale": "Prevents unauthorized or unmonitored software overrides across all API manufacturing blocks.",
                "owner": "Quality Assurance Compliance & Automation Lead",
                "due_date": "Within 30 Days",
                "status": "Open",
                "effectiveness_check": "Zero undocumented alarm bypasses detected during quarterly QA system audits for 12 months.",
                "ai_suggested": True
            }
        ]
    }

def _paracetamol_dryer_scenario(raw_text: str) -> Dict[str, Any]:
    return {
        "deviation_data": {
            "deviation_number": "DEV-2024-0512",
            "title": "Loss of Vacuum and Temperature Spike in Vacuum Tray Dryer VTD-03 during Paracetamol API Drying",
            "product_name": "Paracetamol (Acetaminophen) DC Grade API",
            "product_code": "API-PCM-02",
            "batch_number": "PCM-24-301",
            "manufacturing_stage": "Stage 5: Final Wet Cake Vacuum Drying & Solvent Stripping",
            "incident_date": "2024-10-15",
            "severity": "Major",
            "immediate_containment": "Drying cycle manually aborted. Heating medium valve closed. Vacuum breaker opened under nitrogen purge. Batch quarantined in VTD-03 trays under QA lock.",
            "impact_assessment": "Batch of 1,200 kg wet cake exposed to localized temperature of 74°C under lost vacuum (limit ≤ 60°C). Risk of thermal degradation to 4-aminophenol impurity.",
            "problem_statement": "During vacuum drying of Paracetamol Batch PCM-24-301, vacuum collapsed from 20 mbar to 850 mbar and shelf temperature spiked to 74°C due to steam condensate trap backpressure."
        },
        "five_whys": [
            {
                "step": 1,
                "question": "Why did shelf temperature in VTD-03 spike to 74°C?",
                "answer": "Steam condensate was unable to discharge from the heating shelf manifold, resulting in water hammer and rapid heat accumulation.",
                "evidence_reference": "Dryer temperature recorder chart TR-VTD-03.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 2,
                "question": "Why could steam condensate not discharge?",
                "answer": "The inverted bucket steam trap ST-301 seized in the closed position due to ferric oxide scale deposition.",
                "evidence_reference": "Maintenance inspection of dismantled trap ST-301.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 3,
                "question": "Why did ferric oxide scale accumulate inside the steam trap?",
                "answer": "The plant clean steam boiler dosing pump malfunctioned, resulting in pH drop in the boiler feed condensate line.",
                "evidence_reference": "Utility condensate pH log showing drop to pH 5.2 on 14-Oct.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 4,
                "question": "Why was the pH drop in condensate not alarmed?",
                "answer": "The inline pH transmitter on the boiler condensate return was disconnected for calibration 10 days prior and not re-energized.",
                "evidence_reference": "Instrument calibration work order WO-INST-8821.",
                "verified": False,
                "ai_suggested": True
            },
            {
                "step": 5,
                "question": "Why was the instrument allowed to remain offline for 10 days without QA notification?",
                "answer": "Systemic root cause: The facility utility maintenance handover procedure did not include a mandatory work permit closure sign-off with operations prior to return-to-service.",
                "evidence_reference": "Facility SOP-UT-009 review and interview with Utilities Supervisor.",
                "verified": False,
                "ai_suggested": True
            }
        ],
        "fishbone_data": {
            "man": [
                {"id": "man_1", "factor": "Utility technician missed re-energizing pH transmitter", "status": "Contributing Factor", "justification": "Failed to complete loop check post calibration.", "ai_suggested": True},
                {"id": "man_2", "factor": "Dryer operator did not notice vacuum decay for 25 minutes", "status": "Contributing Factor", "justification": "Operator attending adjacent blender during unalarmed drift.", "ai_suggested": True}
            ],
            "machine": [
                {"id": "mac_1", "factor": "Steam trap ST-301 seized closed by iron oxide scale", "status": "Potential Root Cause", "justification": "Physical failure triggering the temperature excursion.", "ai_suggested": True},
                {"id": "mac_2", "factor": "Vacuum pump liquid ring seal water temperature", "status": "Ruled Out", "justification": "Chilled seal water was steady at 12°C.", "ai_suggested": True}
            ],
            "material": [
                {"id": "mat_1", "factor": "Paracetamol wet cake moisture content prior to drying", "status": "Ruled Out", "justification": "Centrifuge moisture tested 11.2% (within normal 10-13% spec).", "ai_suggested": True},
                {"id": "mat_2", "factor": "Boiler condensate water chemical treatment", "status": "Contributing Factor", "justification": "Neutralizing amine dosing was depleted.", "ai_suggested": True}
            ],
            "method": [
                {"id": "met_1", "factor": "SOP-VTD-03 high-temperature auto-cutoff interlock not active", "status": "Potential Root Cause", "justification": "High temperature cutoff was set at 80°C instead of product limit of 62°C.", "ai_suggested": True},
                {"id": "met_2", "factor": "Utility PM frequency for steam traps", "status": "Contributing Factor", "justification": "Traps only inspected annually rather than quarterly.", "ai_suggested": True}
            ],
            "measurement": [
                {"id": "mea_1", "factor": "Dryer PT100 temperature probes calibration", "status": "Ruled Out", "justification": "Probes verified accurate to within ±0.3°C against reference RTD.", "ai_suggested": True},
                {"id": "mea_2", "factor": "Vacuum transmitter Pirani gauge accuracy", "status": "Ruled Out", "justification": "Gauge correctly captured rapid pressure rise.", "ai_suggested": True}
            ],
            "milieu": [
                {"id": "mil_1", "factor": "Drying room humidity and airflow", "status": "Ruled Out", "justification": "HVAC parameters within normal operational range.", "ai_suggested": True},
                {"id": "mil_2", "factor": "Boiler house condensate return header pressure", "status": "Contributing Factor", "justification": "Backpressure spike accelerated trap blockage.", "ai_suggested": True}
            ]
        },
        "evidence_analyzed": [
            {"id": "ev_1", "title": "Dryer Shelf & Product Temperature Trend (TR-VTD-03)", "source": "DCS Trend", "verified": True, "findings": "Shows temperature rise from 54°C to 74°C over 38 minutes."},
            {"id": "ev_2", "title": "Maintenance Metallurgical Inspection of Trap ST-301", "source": "Engineering Report", "verified": True, "findings": "Confirmed heavy rust/iron sludge accumulation blocking bucket pivot."},
            {"id": "ev_3", "title": "QC Purity Analysis for Batch PCM-24-301", "source": "QC HPLC", "verified": True, "findings": "4-aminophenol impurity elevated to 42 ppm (specification ≤ 50 ppm - borderline compliance)."}
        ],
        "missing_evidence": [
            {"id": "gap_1", "requested_item": "Boiler Feedwater Chemical Treatment Logbook for past 30 days", "reason": "Determine duration of amine under-dosing and scale corrosion.", "priority": "High", "department": "Utilities Maintenance", "status": "Pending"},
            {"id": "gap_2", "requested_item": "Accelerated 3-month Stability Protocol on affected batch", "reason": "Determine if thermal excursion impacts degradation rate over shelf-life.", "priority": "High", "department": "QC & Stability", "status": "Pending"}
        ],
        "root_cause_analysis": {
            "direct_cause": "Condensate steam trap ST-301 plugged with corrosion scale, causing thermal runaway in the heating shelves.",
            "contributing_factors": [
                "Boiler condensate pH monitoring was disabled post-calibration without oversight.",
                "VTD-03 high temperature safety interlock trip was improperly configured at 80°C instead of 62°C.",
                "Lack of automated audible alarms for sudden vacuum decay in drying suites."
            ],
            "root_cause": "Inadequate change management and utility return-to-service protocols, combined with incorrectly configured safety interlocks on critical API drying equipment.",
            "root_cause_category": "Equipment / Maintenance & Utility Control",
            "confidence_score": 0.91
        },
        "capa_recommendations": [
            {
                "id": "capa_1",
                "type": "Immediate Containment / Correction",
                "title": "Quarantine Batch PCM-24-301 & Conduct 100% Core Sampling",
                "description": "Quarantine the entire 1,200 kg batch across all 48 trays. Execute stratified sampling for 4-aminophenol and related impurities across top, middle, and bottom shelves.",
                "rationale": "Ensures no localized hotspots produced degraded product beyond pharmaceutical standards.",
                "owner": "QC Head",
                "due_date": "Within 3 Days",
                "status": "In Progress",
                "effectiveness_check": "Analytical testing across 24 distinct sample points completed.",
                "ai_suggested": True
            },
            {
                "id": "capa_2",
                "type": "Corrective Action",
                "title": "Reconfigure VTD-03 Safety Interlock to Auto-Trip at 60°C",
                "description": "Reprogram PLC interlock: if shelf or chamber temp exceeds 60°C, steam solenoid valve instantly trips shut and cooling water bypass opens automatically.",
                "rationale": "Prevents any future mechanical or trap failure from exceeding product thermal degradation thresholds.",
                "owner": "Instrumentation Lead",
                "due_date": "Within 7 Days",
                "status": "Open",
                "effectiveness_check": "Validation challenge test conducted and documented in IQ/OQ protocol.",
                "ai_suggested": True
            },
            {
                "id": "capa_3",
                "type": "Preventive Action",
                "title": "Upgrade Boiler Return Condensate Monitoring with Redundant pH Transmitter",
                "description": "Install duplex pH sensors with 2-out-of-2 voting logic and automated dosing pump shutdown if pH drops below 6.8.",
                "rationale": "Eliminates systemic corrosion throughout the entire site steam and heating manifold.",
                "owner": "Utilities Engineering Lead",
                "due_date": "Within 30 Days",
                "status": "Open",
                "effectiveness_check": "Continuous pH historian data review over 60 days showing zero unalarmed excursions.",
                "ai_suggested": True
            }
        ]
    }

def _ibuprofen_micronization_scenario(raw_text: str) -> Dict[str, Any]:
    return {
        "deviation_data": {
            "deviation_number": "DEV-2024-0633",
            "title": "Metallic Particulate Contamination Detected in Micronized Ibuprofen API",
            "product_name": "Ibuprofen BP/USP 50 Grade API",
            "product_code": "API-IBU-50",
            "batch_number": "IBU-24-190",
            "manufacturing_stage": "Stage 6: Fluidized Bed Jet Milling & Sieving",
            "incident_date": "2024-10-20",
            "severity": "Critical",
            "immediate_containment": "Milling unit JM-02 locked out. All 20 drums of Batch IBU-24-190 placed under QA red quarantine tape. In-line magnetic separator inspected and metal detector re-tested.",
            "impact_assessment": "1,500 kg batch contaminated with 316L stainless steel micro-flakes (size 150-400 μm). Direct impact on safety; risk of recall if distributed.",
            "problem_statement": "During final sieving and packaging of Ibuprofen Batch IBU-24-190, the inline rare-earth magnet collected visible shiny metallic particulate flakes confirmed as SS316L by SEM-EDX."
        },
        "five_whys": [
            {
                "step": 1,
                "question": "Why were metallic particulates detected in the Ibuprofen API?",
                "answer": "Stainless steel 316L flakes shed from the classifier wheel of Jet Mill JM-02 into the micronized product stream.",
                "evidence_reference": "SEM-EDX elemental analysis report LAB-EDX-2024-44.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 2,
                "question": "Why did the classifier wheel shed metallic flakes?",
                "answer": "Frictional contact occurred between the high-speed classifier wheel tip (operating at 6,500 RPM) and the internal mill housing lining.",
                "evidence_reference": "Boroscope inspection report of mill chamber JM-02.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 3,
                "question": "Why was there frictional contact between the wheel and the housing?",
                "answer": "The upper bearing assembly suffered severe axial play (0.85 mm vs allowable 0.05 mm) due to dynamic bearing race fatigue.",
                "evidence_reference": "Vibration analysis report & bearing teardown inspection.",
                "verified": True,
                "ai_suggested": True
            },
            {
                "step": 4,
                "question": "Why was bearing race fatigue not flagged by routine vibration monitoring?",
                "answer": "Vibration condition monitoring scheduled for Month 9 was deferred by 45 days due to mill production scheduling pressures.",
                "evidence_reference": "CMMS Maintenance Deviation Record #MDEV-2024-12.",
                "verified": False,
                "ai_suggested": True
            },
            {
                "step": 5,
                "question": "Why was preventive maintenance deferred without Quality Risk Assessment approval?",
                "answer": "Systemic root cause: The facility PM deferral procedure allowed production scheduling managers to postpone non-safety PMs without formal QA Quality Risk Assessment (ICH Q9).",
                "evidence_reference": "Plant Maintenance Governance Policy SOP-QA-ENG-004.",
                "verified": False,
                "ai_suggested": True
            }
        ],
        "fishbone_data": {
            "man": [
                {"id": "man_1", "factor": "Production supervisor deferred vibration monitoring without QA sign-off", "status": "Potential Root Cause", "justification": "Bypassed GMP risk review to meet shipping schedule.", "ai_suggested": True},
                {"id": "man_2", "factor": "Mill operator did not heed high-pitch acoustic tone", "status": "Contributing Factor", "justification": "Noise attributed to normal jet milling air turbulence.", "ai_suggested": True}
            ],
            "machine": [
                {"id": "mac_1", "factor": "Jet Mill JM-02 ceramic hybrid bearing race failure", "status": "Potential Root Cause", "justification": "Axial play led directly to metal-on-metal rubbing.", "ai_suggested": True},
                {"id": "mac_2", "factor": "Downstream rare-earth magnetic trap efficiency", "status": "Contributing Factor", "justification": "Magnet captured 90% of particulate, but non-magnetic Austenitic 316L passed through.", "ai_suggested": True}
            ],
            "material": [
                {"id": "mat_1", "factor": "Unmicronized Ibuprofen crystal hardness & moisture", "status": "Ruled Out", "justification": "Feed crystals met standard friability and moisture <0.2%.", "ai_suggested": True},
                {"id": "mat_2", "factor": "Classifier wheel metallurgy", "status": "Ruled Out", "justification": "Mill wheel was certified 316L electropolished stainless steel.", "ai_suggested": True}
            ],
            "method": [
                {"id": "met_1", "factor": "Milling PM SOP lacked run-hour automated trip lock", "status": "Contributing Factor", "justification": "Milling unit lacked automated interlock to prevent operation once PM hours elapsed.", "ai_suggested": True},
                {"id": "met_2", "factor": "Classifier gap clearance verification protocol", "status": "Contributing Factor", "justification": "Feeler gauge gap check was only performed during annual overhaul.", "ai_suggested": True}
            ],
            "measurement": [
                {"id": "mea_1", "factor": "Inline acoustic emission and vibration sensors", "status": "Contributing Factor", "justification": "Mill was not equipped with permanent online accelerometer sensors.", "ai_suggested": True},
                {"id": "mea_2", "factor": "SEM-EDX elemental spectroscopy accuracy", "status": "Ruled Out", "justification": "100% spectral match for Fe, Cr, Ni, Mo (316L alloy).", "ai_suggested": True}
            ],
            "milieu": [
                {"id": "mil_1", "factor": "Compressed nitrogen grinding gas dryness and filtration", "status": "Ruled Out", "justification": "Dew point was -45°C, 0.1μm filter intact.", "ai_suggested": True},
                {"id": "mil_2", "factor": "Milling isolator differential pressure", "status": "Ruled Out", "justification": "Negative pressure containment maintained throughout.", "ai_suggested": True}
            ]
        },
        "evidence_analyzed": [
            {"id": "ev_1", "title": "SEM-EDX Spectral Analysis Report", "source": "Analytical Materials Laboratory", "verified": True, "findings": "Confirmed particulates are SS316L matching classifier wheel metallurgy."},
            {"id": "ev_2", "title": "Boroscope High-Definition Video Inspection of JM-02", "source": "Mechanical Engineering Inspection", "verified": True, "findings": "Revealed radial scoring and abrasion wear on upper housing shroud."},
            {"id": "ev_3", "title": "CMMS Maintenance Log & Postponement Ticket", "source": "SAP PM Module", "verified": True, "findings": "Confirmed PM-VIB-02 was overdue by 45 days at the time of batch execution."}
        ],
        "missing_evidence": [
            {"id": "gap_1", "requested_item": "Inspection & Retain Sample Analysis for preceding 3 batches (IBU-24-187, 188, 189)", "reason": "Determine if bearing degradation commenced during earlier commercial batches.", "priority": "High", "department": "QC Retain & QA", "status": "Pending"},
            {"id": "gap_2", "requested_item": "Metallurgical Fatigue Analysis of Failed Bearing Assembly", "reason": "Determine whether bearing failure was lubrication breakdown or mechanical overload.", "priority": "Medium", "department": "External Metallurgical Lab", "status": "Pending"}
        ],
        "root_cause_analysis": {
            "direct_cause": "Classifier wheel rubbed against mill shroud due to excessive bearing axial play, generating stainless steel abrasive flakes in the product stream.",
            "contributing_factors": [
                "Vibration condition monitoring PM was deferred without QA approval.",
                "Mill lacked online continuous vibration and acoustic emission interlocks.",
                "Non-magnetic austenitic 316L particles were only partially captured by standard magnetic traps."
            ],
            "root_cause": "Flawed maintenance postponement governance policy allowing production overrides without ICH Q9 Quality Risk Assessment, compounded by absence of continuous online machine health monitoring on high-speed critical milling machinery.",
            "root_cause_category": "Equipment / Maintenance Governance",
            "confidence_score": 0.96
        },
        "capa_recommendations": [
            {
                "id": "capa_1",
                "type": "Immediate Containment / Correction",
                "title": "Formal Rejection and Destruction of Batch IBU-24-190 & Retain Inspection",
                "description": "Issue formal QA Rejection Notice for Batch IBU-24-190. Quarantine and inspect retain samples of batches 187, 188, 189 with high-sensitivity X-ray inspection.",
                "rationale": "Prevents any adulterated or contaminated API from entering the pharmaceutical supply chain.",
                "owner": "Director of Quality Assurance",
                "due_date": "Within 48 Hours",
                "status": "In Progress",
                "effectiveness_check": "Complete material reconciliation and witnessing of hazardous waste destruction.",
                "ai_suggested": True
            },
            {
                "id": "capa_2",
                "type": "Corrective Action",
                "title": "Install Real-Time Online Vibration & Bearing Temperature Interlocks on All Jet Mills",
                "description": "Retrofit high-frequency dual-axis accelerometers on JM-01 and JM-02 with automated trip logic (trips mill if vibration >2.8 mm/s RMS).",
                "rationale": "Guarantees instantaneous equipment shutdown prior to any mechanical contact or metal shedding.",
                "owner": "Instrumentation & Automation Manager",
                "due_date": "Within 21 Days",
                "status": "Open",
                "effectiveness_check": "Validation IQ/OQ showing automated trip within 200 milliseconds during simulated vibration spike.",
                "ai_suggested": True
            },
            {
                "id": "capa_3",
                "type": "Preventive Action",
                "title": "Revise Site Maintenance Policy: Mandatory QA Risk Assessment for Any PM Deferral",
                "description": "Update SOP-QA-ENG-004 to strictly forbid deferring any GMP equipment PM without written authorization from Quality Assurance and an ICH Q9 Risk Assessment.",
                "rationale": "Eliminates systemic risk of production schedules overriding equipment integrity and patient safety.",
                "owner": "VP of Quality & Regulatory Affairs",
                "due_date": "Within 14 Days",
                "status": "Open",
                "effectiveness_check": "Quarterly QA audit of CMMS maintenance schedule with zero unauthorized deferrals.",
                "ai_suggested": True
            }
        ]
    }

def _amoxicillin_yield_scenario(raw_text: str) -> Dict[str, Any]:
    return _atorvastatin_crystallization_scenario(raw_text)

def _metformin_assay_scenario(raw_text: str) -> Dict[str, Any]:
    return _paracetamol_dryer_scenario(raw_text)

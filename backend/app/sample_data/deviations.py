SAMPLE_INCIDENTS = [
    {
        "id": "atorvastatin_oos",
        "title": "OOS Related Substance Impurity D in Atorvastatin Calcium API (Batch ATC-24-089)",
        "source_type": "PDF / Investigation Report",
        "badge": "Critical Deviation",
        "product": "Atorvastatin Calcium Trihydrate API",
        "batch": "ATC-24-089",
        "text": """PHARMACEUTICAL QUALITY INCIDENT REPORT - API MANUFACTURING
Document ID: QIR-2024-0419 | Severity: CRITICAL | Facility: API Block 3, Reaction & Crystallization

INCIDENT SUMMARY:
During finished product release testing of Atorvastatin Calcium Trihydrate API, Batch No. ATC-24-089 (Commercial Batch Size: 450 kg), QC laboratory reported an Out-of-Specification (OOS) result for Related Substance Impurity D.
- Specification Limit: NMT 0.15% (w/w) by Reverse Phase HPLC
- Test Result Obtained: 0.24% (duplicate re-injections confirmed 0.238% and 0.241%)
- Initial Impact: Batch quarantined in Warehouse Q-41. Upstream intermediate lot L1-2024-118 put on hold.

CHRONOLOGY & PROCESS OBSERVATIONS:
On 18-Oct-2024, at 01:15 UTC, crystallization was initiated in Crystallizer CR-302 per SOP-PR-302. Turbidity probe confirmed crystallization seeding endpoint at 01:45 UTC.
Per recipe, slurry was to be held at 42°C for transfer to Nutsche Filter Dryer FD-04. Transfer was scheduled for 02:00 UTC.
At 02:15 UTC, the operator attempted to initiate transfer to FD-04, but the automated transfer valve interlock failed to open. The DCS annunciated a high differential pressure alarm on the FD-04 mechanical seal nitrogen barrier fluid.
The shift operator contacted the utility maintenance team, but response was delayed due to shift turnover. Slurry remained in Crystallizer CR-302 under continuous agitation at 42.4°C until 07:45 UTC (total holding time: 6 hours 30 minutes, exceeding validated maximum hold time of 2.0 hours).
Transfer was finally initiated at 08:00 UTC after maintenance replaced the nitrogen pressure regulator.

LABORATORY & METROLOGY FINDINGS:
1. QC Laboratory Investigation (OOS-QC-2024-88) ruled out analytical testing error. System suitability criteria, column resolution (>2.2), and standard precision (%RSD 0.4%) were all compliant.
2. LC-MS spectral characterization confirmed the impurity at RRT 1.42 is the bis-hydroxy oxidative degradation adduct of Atorvastatin.
3. SCADA Historian trend TI-CR302-01 confirmed vessel temperature was 42.1°C to 42.8°C for 6.5 hours.
4. Maintenance report WO-ENG-2024-0982 noted that the upstream 0.2μm nitrogen filter had particulate fouling, and the automated alarm delta threshold had been bypassed in DCS 3 weeks earlier during instrument routine maintenance without Change Control.
"""
    },
    {
        "id": "paracetamol_dryer",
        "title": "Vacuum Loss & Temperature Spike in Paracetamol DC Vacuum Tray Dryer (Batch PCM-24-301)",
        "source_type": "Email Incident Notification",
        "badge": "Major Deviation",
        "product": "Paracetamol (Acetaminophen) DC Grade API",
        "batch": "PCM-24-301",
        "text": """FROM: Shift Supervisor - API Drying & Milling <shift.supervisor@pharma-api.com>
TO: QA Deviation Group <qa.deviations@pharma-api.com>; Production Manager <prod.lead@pharma-api.com>
DATE: October 15, 2024 06:40 AM
SUBJECT: URGENT: Temperature Excursion & Vacuum Collapse - Dryer VTD-03 (Batch PCM-24-301)

Dear QA Team,

Please log an urgent deviation for Batch PCM-24-301 (Paracetamol DC Grade API, 1,200 kg wet cake).

At 04:15 AM during vacuum drying cycle Step 4 in Vacuum Tray Dryer VTD-03:
1. Chamber vacuum suddenly collapsed from operating pressure 20 mbar to 850 mbar within 12 minutes.
2. Simultaneously, shelf heating temperature spiked from setpoint 55°C up to 74.2°C. The SOP-VTD-03 maximum allowable product temperature is 60°C.
3. The high-temperature excursion persisted for approximately 38 minutes before operators manually closed the steam isolating valves and purged the chamber with nitrogen.

Initial Actions Taken:
- Heating medium manually shut off and cooling water circulated to bring shelf temperature below 30°C.
- Batch PCM-24-301 held inside VTD-03 with QA red quarantine tags applied.
- Instrumentation technician called in. Preliminary inspection found the condensate steam trap ST-301 was completely seized shut with rust scale, preventing condensate removal and causing water hammer and thermal buildup.
- Inline boiler condensate return pH sensor was found unplugged from calibration work done last week.

Product Quality Concern:
Exposure to 74°C in presence of residual moisture risks thermal hydrolysis into 4-aminophenol impurity. QC samples are being drawn for urgent HPLC testing.

Regards,
Rajesh Sharma | Shift In-Charge, Drying Suite 2
"""
    },
    {
        "id": "ibuprofen_micronization",
        "title": "Metallic Particulate Contamination in Jet Milled Ibuprofen (Batch IBU-24-190)",
        "source_type": "Quality Investigation Dossier",
        "badge": "Critical Deviation",
        "product": "Ibuprofen BP/USP 50 Grade API",
        "batch": "IBU-24-190",
        "text": """QUALITY INVESTIGATION NOTIFICATION - API FINISHING & PACKAGING
Incident Ref: QIN-2024-0633 | Unit: Cleanroom Finishing Suite 5 | Date: 20-Oct-2024

SUMMARY:
During final sieving and fiber drum filling of Ibuprofen API Batch IBU-24-190 (Batch size: 1,500 kg), the packaging operator noticed fine metallic shiny specks adhered to the 12,000 Gauss rare-earth magnetic grate installed at the discharge chute of Fluidized Bed Jet Mill JM-02.

IMMEDIATE CONTAINMENT:
- Jet Mill JM-02 was immediately stopped and tagged out of service.
- All 20 fiber drums of Batch IBU-24-190 were quarantined in packaging airlock with red quarantine tape.
- QA and Maintenance called for inspection.

INVESTIGATION FINDINGS:
1. Microscopic & SEM-EDX Examination:
QC analytical laboratory analyzed the collected flakes under SEM-EDX (Report LAB-EDX-2024-44). Particles ranged from 150 μm to 420 μm. Elemental spectrum showed 68% Fe, 18% Cr, 12% Ni, 2% Mo, confirming Austenitic Stainless Steel Grade 316L.
2. Equipment Inspection:
Boroscope inspection of Jet Mill JM-02 revealed visible circular scoring along the upper chamber liner, corresponding to the outer circumference of the dynamic classifier wheel.
3. Teardown of Upper Bearing Assembly:
Upon dismantling the classifier drive assembly, technicians measured axial shaft play of 0.85 mm (design tolerance: 0.02 - 0.05 mm). The ceramic hybrid bearings had experienced severe race spalling and cage destruction.
4. Maintenance Records:
CMMS history showed that Jet Mill JM-02 was overdue for its 6-month vibration condition monitoring and bearing inspection by 45 days. Production scheduling had deferred the work order citing high commercial demand.
"""
    }
]

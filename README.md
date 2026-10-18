# AIVOA.AI — AI-Powered Root Cause Analysis (RCA) & CAPA Module
### Pharmaceutical Active Pharmaceutical Ingredient (API) Quality Engineering

> **Goal:** An enterprise-grade, GxP-compliant AI Copilot that empowers pharmaceutical quality investigators, process engineers, and Qualified Persons (QPs) to investigate API manufacturing deviations, conduct 5-Whys and Ishikawa (Fishbone 6M) root cause analyses, highlight missing evidence gaps, and formulate ICH Q10-compliant CAPAs.

---

## 1. Executive Summary & GxP Quality Workflow

In Active Pharmaceutical Ingredient (API) chemical and biological synthesis (governed by **ICH Q7**, **ICH Q9**, **ICH Q10**, and **21 CFR Part 211**), quality incidents—such as Out-of-Specification (OOS) impurity spikes, drying temperature excursions, yield losses, or particle shedding—require thorough, evidence-based investigation before batch release or rejection.

The application implements the complete **End-to-End Quality Workflow**:

```
┌─────────────────────────────────┐      ┌─────────────────────────────┐      ┌────────────────────────────────┐      ┌─────────────────────────────┐
│ 1. Deviation Identification     │      │ 2. Root Cause Analysis      │      │ 3. CAPA Formulation            │      │ 4. QP Review & Sign-Off     │
│ • Incident Intake (PDF/Text)    │ ───► │ • 5-Whys Causal Chain       │ ───► │ • Immediate Containment        │ ───► │ • 21 CFR Part 11 Audit Trail│
│ • Process Stage & Batch Details │      │ • Ishikawa 6M Categorization│      │ • Corrective Actions (CA)      │      │ • Electronic Signatures     │
│ • Containment & Initial Impact  │      │ • Missing Evidence Gaps     │      │ • Preventive Actions (PA)      │      │ • GxP PDF Dossier Export    │
└─────────────────────────────────┘      └─────────────────────────────┘      └────────────────────────────────┘      └─────────────────────────────┘
```

### Key AI Interaction Pattern (Aligning with Reference Architecture)
- **Primary AI-Driven Form Population:** As demonstrated in the AIVOA workflow, users do **not** manually fill out 50+ form fields. Instead, users provide raw input (an investigation report PDF, an email notification, or pasted text) into the **AI Quality Copilot** side-panel.
- **Staging & Verification:** The AI processes the incident through a **5-node LangGraph pipeline**, stages the extracted metadata, 5-Whys causal chain, 6M Fishbone factors, missing evidence checklist, and CAPA matrix, allowing the user to review, edit, and apply them with one click.
- **Qualified Person Oversight:** AI-generated causes are explicitly treated as *provisional suggestions* until verified against documented GxP evidence and electronically confirmed by a Qualified Person (QP).

---

## 2. Mandatory Tech Stack Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React 18 + Redux Toolkit** | Modular Redux store (`investigationSlice`, `copilotSlice`, `investigationsListSlice`), Tailwind CSS design system, Lucide icons, Canvas Confetti. |
| **Backend** | **Python + FastAPI** | Asynchronous REST API, Pydantic v2 schemas, SQLAlchemy ORM, 21 CFR Part 11 audit logging. |
| **AI Orchestration** | **LangGraph + Groq** | Cyclic multi-node state graph running on Groq (`llama-3.3-70b-versatile` / `gemma2-9b-it`) with high-fidelity offline fallback engine. |
| **Database** | **PostgreSQL** | Primary local PostgreSQL engine (`aivoa_rca`), storing investigations, audit trail logs, and historical revisions (with SQLite fallback). |
| **Reporting** | **jsPDF + AutoTable** | Client-side generation of regulatory GxP Investigation Dossier PDFs. |

---

## 3. LangGraph Multi-Agent Architecture

The root cause analysis workflow is implemented as a compiled `StateGraph` in `backend/app/agents/graph.py`:

```
   [START]
      │
      ▼
┌───────────────────────────────┐
│ 1. intake_and_extract_node    │  Extracts Deviation ID, Product, Batch, Process Stage, Severity, Containment
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ 2. five_whys_analysis_node    │  Conducts iterative 5-Whys causal chain drilling down to systemic failure
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ 3. fishbone_categorization_node│ Categorizes factors across 6Ms (Man, Machine, Material, Method, Measurement, Milieu)
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ 4. evidence_gap_analyzer_node │ Audits verified records and highlights missing critical evidence gaps
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ 5. root_cause_capa_synthesizer │ Formulates direct cause, systemic root cause, and ICH Q10 CAPA actions
└──────────────┬────────────────┘
               │
               ▼
            [END]
```

### Groq LLM Models Supported
- **`llama-3.3-70b-versatile`** *(Default & Recommended)*: Exceptional domain knowledge of chemical engineering, GxP regulations, and analytical chemistry.
- **`gemma2-9b-it`**: Google Gemma 2 model on Groq for rapid turnaround.
- **`llama-3.1-8b-instant`**: Ultra-low latency option.

---

## 4. Quick Start Guide (One-Click Launch)

### Prerequisites
- Node.js v18+ and npm
- Python 3.9+
- PostgreSQL (already installed and initialized on port 5432)

### Starting the Full Application
Simply run the root startup script:
```bash
./start.sh
```

This script will:
1. Ensure the PostgreSQL database `aivoa_rca` is ready.
2. Launch the FastAPI Backend on `http://127.0.0.1:8000`.
3. Launch the Vite React Frontend on `http://127.0.0.1:3000`.

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---

## 5. Sample API Deviation Incidents Pre-Loaded

The application comes pre-loaded with authentic pharmaceutical API deviation scenarios in `sample_documents/`:

1. **`DEV-2024-0419` — Out-of-Specification (OOS) Impurity D Spike in Atorvastatin Calcium API**
   - *Stage:* Reaction & Controlled Crystallization
   - *Failure Mode:* Downstream filter dryer nitrogen seal regulator failure caused an unplanned 6.5-hour slurry hold at 42°C, inducing thermal and oxidative degradation beyond specification limit (0.24% vs limit ≤ 0.15%).
2. **`DEV-2024-0512` — Loss of Vacuum & Temperature Spike in Paracetamol Vacuum Tray Dryer**
   - *Stage:* Wet Cake Vacuum Drying & Solvent Stripping
   - *Failure Mode:* Steam condensate trap plugged with ferric oxide scale, causing thermal runaway to 74°C under lost vacuum, risking 4-aminophenol hydrolysis.
3. **`DEV-2024-0633` — Metallic Particulate Contamination in Jet Milled Ibuprofen API**
   - *Stage:* Fluidized Bed Jet Milling & Sieving
   - *Failure Mode:* Bearing race fatigue led to dynamic classifier wheel shroud contact, shedding SS316L flakes into the product stream.

---

## 6. Video Presentation Walkthrough Scripts

### 🎥 Video 1: Product Demonstration (5–8 minutes)

- **Minute 0:00 – 1:00: Problem Context & Overview**
  - Introduce the domain: Active Pharmaceutical Ingredient (API) quality investigation under ICH Q7/Q9/Q10.
  - Explain the core interaction pattern: Rather than tedious manual form filling, the quality professional uses the **AIVOA Quality Copilot** to ingest incident documents, analyze evidence, and populate the dossier.
- **Minute 1:00 – 2:30: Document Intake & AI Extraction**
  - Demonstrate the AI panel on the right.
  - Show the three input modes: Select a pre-loaded sample deviation (e.g. *Atorvastatin OOS Impurity D*), paste an email notification, or drag & drop a PDF investigation report from `sample_documents/atorvastatin_oos.pdf`.
  - Click **Analyze & Populate RCA Form**.
  - Highlight the live LangGraph multi-agent execution pipeline (5 stages: Metadata Intake → 5-Whys → Ishikawa 6M → Evidence Gaps → Root Cause & CAPA).
- **Minute 2:30 – 4:00: Form Population, 5-Whys & Ishikawa 6M Inspection**
  - Click **Apply All to RCA Form**. Show all form fields automatically populating.
  - Inspect Section 2: Walk through the **5-Whys causal chain**, showing how it connects the physical symptom (Impurity D peak) to intermediate holding time, filter delay, and ultimately the systemic maintenance gap.
  - Inspect Section 3: Show the interactive **Ishikawa (Fishbone 6M)** diagram visualizer and factor cards with statuses (*Potential Root Cause*, *Contributing Factor*, *Ruled Out*).
- **Minute 4:00 – 5:30: Evidence Gaps, CAPA Matrix & User Editing**
  - Inspect Section 4: Show the **Missing Evidence Checklist** (e.g., requesting SCADA bypass audit trails). Demonstrate clicking "Status: Pending" to transition to "Requested" / "Received".
  - Inspect Section 5 & 6: Review the synthesized Root Cause and **ICH Q10 CAPA Matrix** (distinguishing Immediate Containment, Corrective Actions, and Preventive Actions with owners, timelines, and effectiveness checks).
  - Demonstrate **User Review & Editability**: Click "Accept AI Suggestions" to convert provisional AI badges into verified state. Add or edit a step.
- **Minute 5:30 – 7:00: QP Sign-off, Audit Trail & GxP PDF Export**
  - Navigate to Section 7: Demonstrate **Qualified Person (QP) Electronic Sign-off** with electronic name stamp.
  - Click **Save Record** to persist to PostgreSQL with celebratory confirmation.
  - Open the **Audit Trail Modal** to show the 21 CFR Part 11 compliant chronological log.
  - Click **Export GxP PDF** to download the professional multi-page investigation dossier.

---

### 🎥 Video 2: Code Architecture & Implementation Walkthrough (5–10 minutes)

- **Minute 0:00 – 2:00: System Architecture & Tech Stack**
  - Walk through the directory layout: `backend/` (FastAPI + LangGraph + SQLAlchemy) and `frontend/` (React + Redux Toolkit + Tailwind).
  - Highlight PostgreSQL database configuration in `backend/app/database.py` and `models.py` (`Investigation` and `AuditLog` tables).
- **Minute 2:00 – 4:30: LangGraph Workflow & Groq Integration**
  - Open `backend/app/agents/graph.py` and `state.py`.
  - Walk through `RCAInvestigationState` and how data flows through the 5 graph nodes (`intake_and_extract_node`, `five_whys_analysis_node`, `fishbone_categorization_node`, `evidence_gap_analyzer_node`, `root_cause_capa_synthesizer_node`).
  - Explain the Groq integration (`ChatGroq`) with temperature=0.1 for high precision, and show the domain fallback engine in `fallback_engine.py` ensuring robustness.
- **Minute 4:30 – 6:30: API Endpoints & PDF Extraction**
  - Open `backend/app/main.py`.
  - Walk through `/api/v1/ai/extract-and-analyze`, `/api/v1/ai/upload-pdf` (using `pypdf`), and `/api/v1/ai/copilot-chat`.
  - Show the CRUD operations and the Qualified Person `/signoff` endpoint with automated audit logging.
- **Minute 6:30 – 8:30: Frontend Redux State Management & Components**
  - Open `frontend/src/store/index.js` and `investigationSlice.js`.
  - Explain how the Redux state mirrors the GxP dossier structure, supporting granular field updates, step additions, verification toggles, and bulk AI application.
  - Show `AiCopilotPanel.jsx` and how it manages the staging and review lifecycle matching the reference video.
  - Show `FishboneVisualizer.jsx` for interactive SVG/card Ishikawa rendering.
- **Minute 8:30 – 10:00: GxP Compliance & Regulatory Rigor**
  - Highlight how the design satisfies ICH Q7 (API Good Manufacturing Practice), ICH Q9 (Risk Management), ICH Q10 (Quality Systems), and 21 CFR Part 11 (Audit trails & e-signatures).
  - Summarize key product engineering decisions and readiness for deployment.

---

## 7. Submission Checklist

- [x] End-to-end working application for API pharmaceutical manufacturer root cause analysis.
- [x] Tech stack: React + Redux, Python + FastAPI, LangGraph + Groq, PostgreSQL.
- [x] Document / Text / Email intake with PDF file extraction.
- [x] 5-Whys iterative causal analysis & Ishikawa (Fishbone 6M) analysis.
- [x] Critical missing evidence identification & checklist.
- [x] Categorized ICH Q10 CAPA recommendations (Containment, CA, PA) with effectiveness check verification.
- [x] Review, inline editing, and Qualified Person (QP) confirmation workflow.
- [x] 21 CFR Part 11 compliant audit trail and GxP PDF export.
- [x] Pre-loaded sample deviations and sample PDF files for instant testing.

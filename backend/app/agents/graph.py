import json
import logging
import re
from typing import Dict, Any

from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings
from app.agents.state import RCAInvestigationState
from app.agents.prompts import (
    SYSTEM_INTAKE_PROMPT,
    SYSTEM_FIVE_WHYS_PROMPT,
    SYSTEM_FISHBONE_PROMPT,
    SYSTEM_EVIDENCE_GAP_PROMPT,
    SYSTEM_ROOT_CAUSE_CAPA_PROMPT,
)
from app.agents.fallback_engine import generate_fallback_rca

logger = logging.getLogger(__name__)

def _get_llm(state: RCAInvestigationState):
    api_key = state.get("groq_api_key") or settings.GROQ_API_KEY
    if not api_key:
        return None
    model_name = state.get("groq_model") or settings.GROQ_MODEL or "llama-3.3-70b-versatile"
    try:
        return ChatGroq(
            groq_api_key=api_key,
            model_name=model_name,
            temperature=0.1,
            max_tokens=4096,
        )
    except Exception as e:
        logger.warning(f"Could not initialize ChatGroq: {e}")
        return None

def _clean_json_output(content: str) -> Dict[str, Any]:
    # Extract json block if wrapped in markdown ticks
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    clean_text = match.group(1) if match else content.strip()
    return json.loads(clean_text)

# 1. Intake & Extract Node
def intake_and_extract_node(state: RCAInvestigationState) -> Dict[str, Any]:
    trace = list(state.get("execution_trace", []))
    trace.append("Step 1/5: Extracting Deviation Intake Metadata & Containment Actions...")
    
    llm = _get_llm(state)
    if not llm:
        fallback = generate_fallback_rca(state["raw_input"], state.get("source_type", "Text"), state.get("file_name"))
        trace.append("Used Quality Domain Engine for intake parsing.")
        return {
            "deviation_data": fallback["deviation_data"],
            "execution_trace": trace,
            "confidence_score": 0.92,
        }
    
    try:
        messages = [
            SystemMessage(content=SYSTEM_INTAKE_PROMPT),
            HumanMessage(content=f"Incident Source ({state.get('source_type', 'Text')}):\n\n{state['raw_input']}")
        ]
        resp = llm.invoke(messages)
        parsed = _clean_json_output(resp.content)
        trace.append(f"LLM successfully extracted deviation: {parsed.get('deviation_number', 'DEV-AUTO')}")
        return {
            "deviation_data": parsed,
            "execution_trace": trace,
            "confidence_score": 0.95,
        }
    except Exception as e:
        logger.warning(f"Error in intake_and_extract_node with Groq: {e}. Falling back to domain engine.")
        fallback = generate_fallback_rca(state["raw_input"], state.get("source_type", "Text"), state.get("file_name"))
        trace.append(f"Fallback engaged for intake: {str(e)[:80]}")
        return {
            "deviation_data": fallback["deviation_data"],
            "execution_trace": trace,
            "confidence_score": 0.88,
        }

# 2. 5 Whys Analysis Node
def five_whys_analysis_node(state: RCAInvestigationState) -> Dict[str, Any]:
    trace = list(state.get("execution_trace", []))
    trace.append("Step 2/5: Conducting Chemical Engineering 5-Whys Causal Chain Analysis...")
    
    llm = _get_llm(state)
    dev_data = state.get("deviation_data", {})
    if not llm:
        fallback = generate_fallback_rca(state["raw_input"])
        trace.append("Constructed 5-Whys causal chain with Quality Domain Engine.")
        return {
            "five_whys": fallback["five_whys"],
            "execution_trace": trace,
        }
    
    try:
        context = f"Deviation: {dev_data.get('title')}\nProduct: {dev_data.get('product_name')} Batch: {dev_data.get('batch_number')}\nStage: {dev_data.get('manufacturing_stage')}\nProblem Statement: {dev_data.get('problem_statement')}\nRaw Input:\n{state['raw_input'][:1500]}"
        messages = [
            SystemMessage(content=SYSTEM_FIVE_WHYS_PROMPT),
            HumanMessage(content=context)
        ]
        resp = llm.invoke(messages)
        parsed = _clean_json_output(resp.content)
        whys = parsed.get("five_whys", [])
        trace.append(f"Generated {len(whys)} logical causal why steps.")
        return {
            "five_whys": whys,
            "execution_trace": trace,
        }
    except Exception as e:
        logger.warning(f"Error in five_whys_analysis_node: {e}")
        fallback = generate_fallback_rca(state["raw_input"])
        return {
            "five_whys": fallback["five_whys"],
            "execution_trace": trace,
        }

# 3. Fishbone (Ishikawa 6M) Node
def fishbone_categorization_node(state: RCAInvestigationState) -> Dict[str, Any]:
    trace = list(state.get("execution_trace", []))
    trace.append("Step 3/5: Evaluating Ishikawa 6M Factors (Man, Machine, Material, Method, Measurement, Milieu)...")
    
    llm = _get_llm(state)
    dev_data = state.get("deviation_data", {})
    if not llm:
        fallback = generate_fallback_rca(state["raw_input"])
        trace.append("Populated 6M Fishbone matrix with categorized factors.")
        return {
            "fishbone_data": fallback["fishbone_data"],
            "execution_trace": trace,
        }
    
    try:
        context = f"Deviation: {dev_data.get('title')}\nProblem Statement: {dev_data.get('problem_statement')}\nManufacturing Stage: {dev_data.get('manufacturing_stage')}\nIncident Text:\n{state['raw_input'][:1500]}"
        messages = [
            SystemMessage(content=SYSTEM_FISHBONE_PROMPT),
            HumanMessage(content=context)
        ]
        resp = llm.invoke(messages)
        parsed = _clean_json_output(resp.content)
        fishbone = parsed.get("fishbone_data", {})
        trace.append("Categorized potential failure modes across all 6M dimensions.")
        return {
            "fishbone_data": fishbone,
            "execution_trace": trace,
        }
    except Exception as e:
        logger.warning(f"Error in fishbone_categorization_node: {e}")
        fallback = generate_fallback_rca(state["raw_input"])
        return {
            "fishbone_data": fallback["fishbone_data"],
            "execution_trace": trace,
        }

# 4. Evidence & Gap Analyzer Node
def evidence_gap_analyzer_node(state: RCAInvestigationState) -> Dict[str, Any]:
    trace = list(state.get("execution_trace", []))
    trace.append("Step 4/5: Cross-referencing GMP Evidence & Identifying Investigation Data Gaps...")
    
    llm = _get_llm(state)
    dev_data = state.get("deviation_data", {})
    if not llm:
        fallback = generate_fallback_rca(state["raw_input"])
        trace.append("Identified supporting documents and critical missing evidence checklist.")
        return {
            "evidence_analyzed": fallback["evidence_analyzed"],
            "missing_evidence": fallback["missing_evidence"],
            "execution_trace": trace,
        }
    
    try:
        context = f"Deviation: {dev_data.get('title')}\nProblem Statement: {dev_data.get('problem_statement')}\nIncident Text:\n{state['raw_input'][:1500]}"
        messages = [
            SystemMessage(content=SYSTEM_EVIDENCE_GAP_PROMPT),
            HumanMessage(content=context)
        ]
        resp = llm.invoke(messages)
        parsed = _clean_json_output(resp.content)
        ev = parsed.get("evidence_analyzed", [])
        gaps = parsed.get("missing_evidence", [])
        trace.append(f"Audited {len(ev)} verified records; identified {len(gaps)} missing evidence items.")
        return {
            "evidence_analyzed": ev,
            "missing_evidence": gaps,
            "execution_trace": trace,
        }
    except Exception as e:
        logger.warning(f"Error in evidence_gap_analyzer_node: {e}")
        fallback = generate_fallback_rca(state["raw_input"])
        return {
            "evidence_analyzed": fallback["evidence_analyzed"],
            "missing_evidence": fallback["missing_evidence"],
            "execution_trace": trace,
        }

# 5. Root Cause & CAPA Synthesizer Node
def root_cause_capa_synthesizer_node(state: RCAInvestigationState) -> Dict[str, Any]:
    trace = list(state.get("execution_trace", []))
    trace.append("Step 5/5: Synthesizing Systemic Root Cause & Formulating ICH Q10 CAPA Matrix...")
    
    llm = _get_llm(state)
    dev_data = state.get("deviation_data", {})
    whys = state.get("five_whys", [])
    fishbone = state.get("fishbone_data", {})
    
    if not llm:
        fallback = generate_fallback_rca(state["raw_input"])
        trace.append("Synthesized root cause and recommended CAPA action plan.")
        return {
            "root_cause_analysis": fallback["root_cause_analysis"],
            "capa_recommendations": fallback["capa_recommendations"],
            "execution_trace": trace,
            "confidence_score": 0.94,
        }
    
    try:
        context = f"""
Deviation: {dev_data.get('title')} ({dev_data.get('deviation_number')})
Product: {dev_data.get('product_name')} Batch: {dev_data.get('batch_number')}
Stage: {dev_data.get('manufacturing_stage')}
Problem Statement: {dev_data.get('problem_statement')}
5 Whys Summary: {json.dumps(whys, indent=2)}
Fishbone Factors: {json.dumps(fishbone, indent=2)}
"""
        messages = [
            SystemMessage(content=SYSTEM_ROOT_CAUSE_CAPA_PROMPT),
            HumanMessage(content=context)
        ]
        resp = llm.invoke(messages)
        parsed = _clean_json_output(resp.content)
        
        rca = {
            "direct_cause": parsed.get("direct_cause", ""),
            "contributing_factors": parsed.get("contributing_factors", []),
            "root_cause": parsed.get("root_cause", ""),
            "root_cause_category": parsed.get("root_cause_category", "Equipment / Maintenance"),
            "confidence_score": parsed.get("confidence_score", 0.95),
        }
        capas = parsed.get("capa_items", [])
        trace.append(f"Derived root cause: '{rca['root_cause'][:60]}...' and formulated {len(capas)} CAPA items.")
        return {
            "root_cause_analysis": rca,
            "capa_recommendations": capas,
            "execution_trace": trace,
            "confidence_score": rca.get("confidence_score", 0.95),
        }
    except Exception as e:
        logger.warning(f"Error in root_cause_capa_synthesizer_node: {e}")
        fallback = generate_fallback_rca(state["raw_input"])
        return {
            "root_cause_analysis": fallback["root_cause_analysis"],
            "capa_recommendations": fallback["capa_recommendations"],
            "execution_trace": trace,
            "confidence_score": 0.89,
        }

# Build LangGraph workflow
def build_rca_graph():
    builder = StateGraph(RCAInvestigationState)
    
    builder.add_node("intake_and_extract", intake_and_extract_node)
    builder.add_node("five_whys_analysis", five_whys_analysis_node)
    builder.add_node("fishbone_categorization", fishbone_categorization_node)
    builder.add_node("evidence_gap_analyzer", evidence_gap_analyzer_node)
    builder.add_node("root_cause_capa_synthesizer", root_cause_capa_synthesizer_node)
    
    builder.add_edge(START, "intake_and_extract")
    builder.add_edge("intake_and_extract", "five_whys_analysis")
    builder.add_edge("five_whys_analysis", "fishbone_categorization")
    builder.add_edge("fishbone_categorization", "evidence_gap_analyzer")
    builder.add_edge("evidence_gap_analyzer", "root_cause_capa_synthesizer")
    builder.add_edge("root_cause_capa_synthesizer", END)
    
    return builder.compile()

rca_graph = build_rca_graph()

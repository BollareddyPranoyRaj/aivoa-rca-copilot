import io
import logging
from typing import Dict, Any, Tuple
from pypdf import PdfReader

logger = logging.getLogger("pdf_parser")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text content from uploaded PDF bytes with page headers and clean formatting.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        extracted = []
        
        # Check if encrypted
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as e:
                logger.warning(f"Could not decrypt PDF with empty password: {e}")
                raise ValueError("PDF is password protected and cannot be extracted.")

        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                # Clean up repeated trailing whitespace
                cleaned_page = "\n".join(line.rstrip() for line in page_text.splitlines() if line.strip())
                extracted.append(f"--- Page {idx + 1} ---\n{cleaned_page}")
        
        full_text = "\n\n".join(extracted).strip()
        if not full_text:
            logger.warning("No readable text found across any pages of the PDF.")
        return full_text
    except Exception as e:
        logger.exception(f"Failed to parse PDF document: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def get_pdf_metadata(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts metadata and page count from the uploaded PDF.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        meta = reader.metadata or {}
        return {
            "page_count": len(reader.pages),
            "title": meta.get("/Title", "") or "",
            "author": meta.get("/Author", "") or "",
            "creator": meta.get("/Creator", "") or "",
            "producer": meta.get("/Producer", "") or "",
        }
    except Exception:
        return {"page_count": 0, "title": "", "author": "", "creator": "", "producer": ""}

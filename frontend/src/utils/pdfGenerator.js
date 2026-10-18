import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateRcaPdf(investigation) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [13, 148, 136]; // Teal #0d9488
  const darkColor = [15, 23, 42];     // Slate 900
  let y = 18;

  // Header Bar
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('AIVOA.AI | PHARMACEUTICAL QUALITY SYSTEM', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(204, 251, 241);
  doc.text('ROOT CAUSE ANALYSIS (RCA) & CAPA INVESTIGATION DOSSIER — ICH Q7 / Q9 / Q10', 14, 18);

  y = 32;

  // Deviation Metadata Card
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(`Deviation Record: ${investigation.deviation_number || 'DEV-AUTO'}`, 14, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 130, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Details', 'Field', 'Details']],
    body: [
      ['Investigation Title', investigation.title || 'N/A', 'Classification', investigation.severity || 'Major'],
      ['API Product Name', investigation.product_name || 'N/A', 'Commercial Batch', investigation.batch_number || 'N/A'],
      ['Manufacturing Stage', investigation.manufacturing_stage || 'N/A', 'Date of Occurrence', investigation.incident_date || 'N/A'],
      ['Investigation Status', investigation.status || 'Draft', 'QP Disposition', investigation.qp_approval_status || 'Pending Review'],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: primaryColor, textColor: 255 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Section 1: Problem Statement & Containment
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('1. PROBLEM STATEMENT & IMMEDIATE CONTAINMENT', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Section', 'Description']],
    body: [
      ['Problem Statement', investigation.problem_statement || 'N/A'],
      ['Immediate Containment', investigation.immediate_containment || 'N/A'],
      ['Initial Impact Assessment', investigation.impact_assessment || 'N/A'],
    ],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85] },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Section 2: 5-Whys Causal Chain
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('2. 5-WHYS ROOT CAUSE CAUSAL CHAIN', 14, y);
  y += 5;

  const whysBody = (investigation.five_whys || []).map((w) => [
    `Why ${w.step}`,
    w.question,
    w.answer,
    w.evidence_reference || 'Reviewed in Dossier',
    w.verified ? 'Verified' : 'AI Suggested'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Level', 'Interrogative Question', 'Investigative Finding / Mechanism', 'Evidence Reference', 'Status']],
    body: whysBody.length > 0 ? whysBody : [['-', 'No 5 Whys generated', '-', '-', '-']],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: primaryColor },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Section 3: Ishikawa 6M Fishbone Analysis
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('3. ISHIKAWA (FISHBONE 6M) CAUSAL FACTOR ANALYSIS', 14, y);
  y += 5;

  const fishboneBody = [];
  const categories = [
    { key: 'man', label: 'Man (Personnel / Training)' },
    { key: 'machine', label: 'Machine (Equipment / Seals)' },
    { key: 'material', label: 'Material (Solvents / Reagents)' },
    { key: 'method', label: 'Method (SOP / Recipe / Hold Time)' },
    { key: 'measurement', label: 'Measurement (Lab / Calibration)' },
    { key: 'milieu', label: 'Milieu (Cleanroom / Environment)' },
  ];

  categories.forEach(cat => {
    const factors = investigation.fishbone_data?.[cat.key] || [];
    if (factors.length > 0) {
      factors.forEach(f => {
        fishboneBody.push([
          cat.label,
          f.factor || 'N/A',
          f.status || 'Under Investigation',
          f.justification || 'Reviewed in investigation'
        ]);
      });
    }
  });

  autoTable(doc, {
    startY: y,
    head: [['6M Category', 'Evaluated Factor', 'Regulatory Status', 'Justification / Evidence']],
    body: fishboneBody.length > 0 ? fishboneBody : [['-', 'No Fishbone factors documented', '-', '-']],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [51, 65, 85] },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Section 4: Supporting Evidence & Missing Evidence Gaps
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('4. SUPPORTING EVIDENCE & INVESTIGATION DATA GAPS AUDIT', 14, y);
  y += 5;

  const gapsBody = (investigation.missing_evidence || []).map(g => [
    g.requested_item || 'Requested Item',
    g.reason || 'Verification requirement',
    g.priority || 'High',
    g.department || 'QA',
    g.status || 'Pending'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Requested Item / Evidence Gap', 'Investigation Rationale', 'Priority', 'Department', 'Status']],
    body: gapsBody.length > 0 ? gapsBody : [['No outstanding evidence gaps flagged', 'All required GxP evidence verified', '-', '-', 'Complete']],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: primaryColor },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Section 5: Root Cause Determination
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('5. ROOT CAUSE DETERMINATION & CLASSIFICATION', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Classification', 'Details']],
    body: [
      ['Direct Cause (Immediate)', investigation.direct_cause || 'N/A'],
      ['Primary Systemic Root Cause', investigation.root_cause || 'N/A'],
      ['Root Cause Category', investigation.root_cause_category || 'Equipment / Maintenance'],
      ['Contributing Factors', (investigation.contributing_factors || []).join('; ') || 'N/A'],
    ],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85] },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Section 6: CAPA Action Plan
  if (y > 210) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('6. CORRECTIVE AND PREVENTIVE ACTIONS (CAPA) — ICH Q10', 14, y);
  y += 5;

  const capaBody = (investigation.capa_items || []).map((c, i) => [
    `CAPA-${i+1}`,
    c.type,
    c.title,
    c.description,
    c.owner,
    c.due_date,
    c.effectiveness_check || 'N/A'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Type', 'Action Title', 'Description', 'Owner', 'Due Date', 'Effectiveness Check']],
    body: capaBody.length > 0 ? capaBody : [['-', '-', 'No CAPA items defined', '-', '-', '-', '-']],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: primaryColor },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Section 7: QP Sign-off Block
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('7. GOVERNANCE & QUALIFIED PERSON (QP) DISPOSITION', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Role', 'Name / Signatory', 'Status', 'Review Notes']],
    body: [
      ['Lead Quality Investigator', investigation.investigator_name || 'QA Lead', 'Completed', 'Investigation dossier finalized per ICH Q7/Q9.'],
      ['Qualified Person (QP)', investigation.qp_name || 'Pending Review', investigation.qp_approval_status || 'Pending Review', investigation.qp_notes || 'Pending formal disposition review.'],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [51, 65, 85] },
  });

  // Footer / Page numbers across all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`AIVOA.AI Pharma Quality Suite — Confidential & GxP Regulated Document — Page ${i} of ${pageCount}`, 14, 290);
  }

  doc.save(`${investigation.deviation_number || 'Investigation'}_RCA_Dossier.pdf`);
}

import os
from fpdf import FPDF
from app.sample_data.deviations import SAMPLE_INCIDENTS

os.makedirs("../sample_documents", exist_ok=True)

class PDF(FPDF):
    def header(self):
        self.set_fill_color(15, 23, 42)
        self.rect(0, 0, 210, 16, 'F')
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 10)
        self.set_xy(10, 4)
        self.cell(190, 8, 'AIVOA.AI | PHARMACEUTICAL QUALITY INVESTIGATION REPORT', 0, 0, 'L')
        self.ln(14)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(190, 10, f'Confidential & GxP Regulated Document - Page {self.page_no()}', 0, 0, 'C')

for inc in SAMPLE_INCIDENTS:
    pdf = PDF()
    pdf.set_margins(12, 12, 12)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Document title
    pdf.set_font('Helvetica', 'B', 13)
    pdf.set_text_color(13, 148, 136)
    pdf.multi_cell(186, 7, inc['title'])
    pdf.ln(2)
    
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(186, 6, f"Product: {inc['product']}  |  Batch: {inc['batch']}  |  Severity: {inc['badge']}")
    pdf.ln(6)
    
    # Body text
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(51, 65, 85)
    for line in inc['text'].split('\n'):
        line_str = line.strip().replace('μ', 'u').replace('°', ' deg ')
        if not line_str:
            pdf.ln(2)
            continue
        if line_str.startswith('INCIDENT SUMMARY:') or line_str.startswith('CHRONOLOGY') or line_str.startswith('LABORATORY') or line_str.startswith('IMMEDIATE CONTAINMENT:'):
            pdf.ln(2)
            pdf.set_font('Helvetica', 'B', 9.5)
            pdf.set_text_color(15, 23, 42)
            pdf.multi_cell(186, 5.5, line_str)
            pdf.set_font('Helvetica', '', 8.5)
            pdf.set_text_color(51, 65, 85)
        else:
            pdf.multi_cell(186, 4.8, line_str)
            
    pdf_path = f"../sample_documents/{inc['id']}.pdf"
    txt_path = f"../sample_documents/{inc['id']}.txt"
    pdf.output(pdf_path)
    with open(txt_path, "w") as f:
        f.write(inc['text'])
        
    print(f"Generated {pdf_path} and {txt_path}")

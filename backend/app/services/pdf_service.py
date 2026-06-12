import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import qrcode
from io import BytesIO
from typing import Dict, Any

def generate_challan_pdf(violation_details: Dict[str, Any], output_dir: str = "app/data/challans") -> str:
    """
    Generates a professional E-Challan PDF.
    Returns the absolute path of the generated PDF.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    challan_id = violation_details.get("challan_id", "UNKNOWN")
    filename = f"challan_{challan_id}.pdf"
    file_path = os.path.join(output_dir, filename)
    
    # 1. Generate QR Code
    payment_url = violation_details.get("payment_url", "https://roadpay.ai/pay")
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(payment_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = BytesIO()
    try:
        qr_img.save(qr_buffer, format="PNG")
    except TypeError:
        qr_img.save(qr_buffer)
    qr_buffer.seek(0)
    
    # 2. Setup document
    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#ef4444'),
        alignment=1, # Center
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        alignment=1,
        spaceAfter=20
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )
    
    bold_body_style = ParagraphStyle(
        'BoldBodyStyle',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    warning_style = ParagraphStyle(
        'WarningStyle',
        parent=body_style,
        textColor=colors.HexColor('#dc2626'),
        fontName='Helvetica-Bold'
    )

    story = []
    
    # Header
    story.append(Paragraph("ROADPAY AI - DIGITAL CHALLAN", title_style))
    story.append(Paragraph("Ministry of Road Safety & Traffic Management", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Details Grid
    data = [
        [Paragraph("Challan ID:", bold_body_style), Paragraph(challan_id, body_style),
         Paragraph("Date Issued:", bold_body_style), Paragraph(violation_details.get("date", ""), body_style)],
        [Paragraph("Vehicle Number:", bold_body_style), Paragraph(violation_details.get("vehicle_number", ""), body_style),
         Paragraph("Due Date:", bold_body_style), Paragraph(violation_details.get("due_date", ""), body_style)],
        [Paragraph("Owner Name:", bold_body_style), Paragraph(violation_details.get("owner_name", ""), body_style),
         Paragraph("Fine Amount:", bold_body_style), Paragraph(f"INR {violation_details.get('amount', '500')}", warning_style)],
        [Paragraph("Violation Type:", bold_body_style), Paragraph(violation_details.get("violation_type", "").replace("_", " "), warning_style),
         Paragraph("Status:", bold_body_style), Paragraph(violation_details.get("status", "PENDING"), bold_body_style)]
    ]
    
    t = Table(data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    t.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f8fafc')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Violation Explanation
    story.append(Paragraph("AI Hazard Explanation", header_style))
    story.append(Paragraph(violation_details.get("explanation", "Please comply with traffic laws to ensure safety on the road."), body_style))
    story.append(Spacer(1, 20))
    
    # Violation Image (if exists)
    image_path = violation_details.get("violation_image_path", "")
    if image_path and os.path.exists(image_path):
        try:
            # Scale image dynamically
            story.append(Paragraph("Violation Capture Evidence", header_style))
            img = Image(image_path, width=4.5*inch, height=2.5*inch)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 20))
        except Exception as e:
            print(f"Error drawing violation image in PDF: {e}")
            
    # QR Section table
    qr_flow_img = Image(qr_buffer, width=1.5*inch, height=1.5*inch)
    qr_instructions = [
        Paragraph("Scan QR to Pay Instantly", bold_body_style),
        Paragraph("1. Open any UPI payment application (GPay, PhonePe, Paytm).", body_style),
        Paragraph("2. Scan this QR code to initiate secure payment portal.", body_style),
        Paragraph("3. Alternatively, visit the link below to take the learning module and earn a discount:", body_style),
        Paragraph(violation_details.get("learning_link", "https://roadpay.ai/dashboard/learning"), ParagraphStyle('Link', parent=body_style, textColor=colors.HexColor('#2563eb')))
    ]
    
    # Nested table for instructions
    inst_table = Table([[Paragraph(x.text, x.style)] for x in qr_instructions], colWidths=[4*inch])
    inst_table.setStyle(TableStyle([
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))
    
    qr_section_data = [
        [inst_table, qr_flow_img]
    ]
    
    qr_table = Table(qr_section_data, colWidths=[4.5*inch, 2*inch])
    qr_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(qr_table)
    story.append(Spacer(1, 20))
    
    # Legal Warning footer
    footer_text = (
        "IMPORTANT LEGAL NOTICE: Under Section 177 of the Motor Vehicles Act, failing to pay the challan within "
        "the stipulated due date will result in late fees and potential referral to the Virtual Traffic Court. "
        "RoadPay AI offers an education program allowing fine mitigation. Complete the safety course to earn discount benefits."
    )
    story.append(Paragraph(footer_text, ParagraphStyle('FooterStyle', parent=body_style, fontSize=8, textColor=colors.HexColor('#94a3b8'), leading=10)))
    
    doc.build(story)
    
    return file_path

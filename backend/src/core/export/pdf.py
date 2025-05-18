from typing import List, Optional
import logging
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

from src.models.schemas import Message

logger = logging.getLogger(__name__)

def generate_chat_pdf(messages: List[Message], include_media: bool = True) -> bytes:
    """
    Generate a PDF file from the chat messages.
    
    Args:
        messages: List of messages to include in the PDF
        include_media: Whether to include media in the PDF
    
    Returns:
        bytes: PDF file content
    """
    logger.info(f"Generating PDF with {len(messages)} messages")
    
    # Create PDF buffer
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    normal_style = styles["Normal"]
    
    # Create custom styles
    message_style = ParagraphStyle(
        "MessageStyle",
        parent=normal_style,
        fontSize=10,
        leading=14,
        spaceAfter=6
    )
    
    sender_style = ParagraphStyle(
        "SenderStyle",
        parent=normal_style,
        fontSize=9,
        textColor=colors.blue,
        leading=12
    )
    
    time_style = ParagraphStyle(
        "TimeStyle",
        parent=normal_style,
        fontSize=8,
        textColor=colors.gray,
        alignment=2  # Right aligned
    )
    
    # Create document elements
    elements = []
    
    # Add title
    elements.append(Paragraph("WhatsApp Chat Export", title_style))
    elements.append(Spacer(1, 12))
    
    # Add export date
    export_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elements.append(Paragraph(f"Exported on: {export_date}", normal_style))
    elements.append(Spacer(1, 24))
    
    # Add chat summary
    if messages:
        chat_start = min(m.timestamp for m in messages).strftime("%Y-%m-%d")
        chat_end = max(m.timestamp for m in messages).strftime("%Y-%m-%d")
        unique_senders = len(set(m.sender for m in messages))
        
        elements.append(Paragraph("Chat Summary", heading_style))
        elements.append(Spacer(1, 6))
        
        summary_data = [
            ["Date Range", f"{chat_start} to {chat_end}"],
            ["Total Messages", str(len(messages))],
            ["Participants", str(unique_senders)]
        ]
        
        summary_table = Table(summary_data, colWidths=[100, 300])
        summary_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 24))
    
    # Add messages
    elements.append(Paragraph("Messages", heading_style))
    elements.append(Spacer(1, 12))
    
    current_date = None
    
    for message in sorted(messages, key=lambda m: m.timestamp):
        # Add date separator if date changes
        message_date = message.timestamp.strftime("%Y-%m-%d")
        if message_date != current_date:
            current_date = message_date
            elements.append(Spacer(1, 12))
            elements.append(
                Paragraph(
                    f"--- {message.timestamp.strftime('%A, %B %d, %Y')} ---",
                    ParagraphStyle("DateStyle", parent=normal_style, alignment=1)  # Center aligned
                )
            )
            elements.append(Spacer(1, 6))
        
        # Format message
        timestamp = message.timestamp.strftime("%H:%M:%S")
        
        # Add sender
        elements.append(Paragraph(f"{message.sender}", sender_style))
        
        # Add message content based on type
        if message.type == "text":
            elements.append(Paragraph(message.content, message_style))
        elif message.type == "image" and include_media:
            elements.append(Paragraph("[Image]", message_style))
            # In a real app, you would add the actual image here
            # elements.append(Image(image_path, width=200, height=150))
        elif message.type == "video" and include_media:
            elements.append(Paragraph("[Video]", message_style))
        elif message.type == "audio" and include_media:
            elements.append(Paragraph("[Audio]", message_style))
        elif message.type == "file" and include_media:
            elements.append(Paragraph(f"[File: {message.content}]", message_style))
        else:
            elements.append(Paragraph(f"[{message.type}]", message_style))
        
        # Add timestamp
        elements.append(Paragraph(timestamp, time_style))
        elements.append(Spacer(1, 6))
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF data
    pdf_data = buffer.getvalue()
    buffer.close()
    
    logger.info("PDF generation complete")
    return pdf_data
import { ChatMessage } from '../types';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface PDFExportOptions {
    messages: ChatMessage[];
    currentUser: string;
    includeAudioQR?: boolean;
    redactedMessages?: string[];
    pageSize?: 'A4' | 'LETTER';
    orientation?: 'portrait' | 'landscape';
}

export class PDFExporter {
    private static async renderMessageToCanvas(
        message: ChatMessage,
        isCurrentUser: boolean,
        options: PDFExportOptions
    ): Promise<HTMLCanvasElement> {
        const container = document.createElement('div');
        container.className = 'pdf-message-container';
        container.style.width = '100%';
        container.style.padding = '10px';
        container.style.marginBottom = '10px';

        const messageDiv = document.createElement('div');
        messageDiv.className = `pdf-message ${isCurrentUser ? 'current-user' : 'other-user'}`;
        messageDiv.style.maxWidth = '70%';
        messageDiv.style.padding = '10px';
        messageDiv.style.borderRadius = '10px';
        messageDiv.style.backgroundColor = isCurrentUser ? '#dcf8c6' : '#ffffff';
        messageDiv.style.marginLeft = isCurrentUser ? 'auto' : '0';
        messageDiv.style.marginRight = isCurrentUser ? '0' : 'auto';
        messageDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';

        // Add sender name for non-current user
        if (!isCurrentUser) {
            const senderDiv = document.createElement('div');
            senderDiv.className = 'pdf-sender';
            senderDiv.style.fontWeight = 'bold';
            senderDiv.style.marginBottom = '5px';
            senderDiv.style.color = '#128C7E';
            senderDiv.textContent = message.sender;
            messageDiv.appendChild(senderDiv);
        }

        // Add message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'pdf-content';
        contentDiv.style.color = '#303030';
        contentDiv.textContent = message.content;
        messageDiv.appendChild(contentDiv);

        // Add timestamp
        const timeDiv = document.createElement('div');
        timeDiv.className = 'pdf-timestamp';
        timeDiv.style.fontSize = '11px';
        timeDiv.style.color = '#667781';
        timeDiv.style.marginTop = '5px';
        timeDiv.style.textAlign = isCurrentUser ? 'right' : 'left';
        timeDiv.textContent = format(new Date(message.timestamp), 'HH:mm');
        messageDiv.appendChild(timeDiv);

        container.appendChild(messageDiv);
        document.body.appendChild(container);

        const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: '#f0f2f5',
            logging: false,
        });

        document.body.removeChild(container);
        return canvas;
    }

    private static async addQRCode(
        pdf: jsPDF,
        audioUrl: string,
        x: number,
        y: number
    ): Promise<void> {
        const qrDataUrl = await QRCode.toDataURL(audioUrl, { width: 64, margin: 1 });
        pdf.addImage(qrDataUrl, 'PNG', x, y, 24, 24);
    }

    public static async exportToPDF(options: PDFExportOptions): Promise<void> {
        const {
            messages,
            currentUser,
            includeAudioQR = false,
            redactedMessages = [],
            pageSize = 'A4',
            orientation = 'portrait',
        } = options;

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: pageSize,
        });

        let yOffset = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;

        for (const message of messages) {
            // Check if message should be redacted
            if (redactedMessages.includes(message.id)) {
                continue;
            }

            const isCurrentUser = message.sender === currentUser;
            const canvas = await this.renderMessageToCanvas(message, isCurrentUser, options);

            // Calculate dimensions
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Check if we need a new page
            if (yOffset + imgHeight > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                yOffset = margin;
            }

            // Add message to PDF
            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.8),
                'JPEG',
                margin,
                yOffset,
                imgWidth,
                imgHeight
            );

            yOffset += imgHeight + 10;

            // Add QR code for audio if enabled
            if (includeAudioQR && message.audioUrl) {
                await this.addQRCode(pdf, message.audioUrl, margin, yOffset);
                yOffset += 30;
            }
        }

        // Save the PDF
        pdf.save('whatsapp-chat.pdf');
    }
} 
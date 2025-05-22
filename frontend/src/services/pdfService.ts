import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { WhatsAppChat, ExportOptions, JournalEntry } from '../types';
import { formatDate, formatTime } from '../utils/dateUtils';
import { groupMessagesByDate } from '../utils/messageUtils';

// Set up custom types for jsPDF autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Generate a PDF export of a WhatsApp chat
 */
export async function generatePDF(
  chat: WhatsAppChat, 
  options: ExportOptions,
  journalEntries?: JournalEntry[]
): Promise<Blob> {
  // Create new document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set up document properties
  pdf.setProperties({
    title: `WhatsApp Chat - ${options.redactedMode ? 'Redacted Chat' : chat.name}`,
    subject: 'WhatsApp Chat Export',
    creator: 'WhatsApp Memory Vault',
    author: 'WhatsApp Memory Vault'
  });
  
  // Set PDF theme colors based on options
  const colors = options.theme === 'dark' 
    ? {
        bg: '#121212',
        text: '#E5E7EB',
        header: '#1F2937',
        highlight: '#25D366',
        messageOwnBg: '#056162',
        messageOtherBg: '#262D31',
        sectionBg: '#1F2937'
      }
    : {
        bg: '#FFFFFF',
        text: '#1F2937',
        header: '#075E54',
        highlight: '#25D366',
        messageOwnBg: '#DCF8C6',
        messageOtherBg: '#FFFFFF',
        sectionBg: '#E5E7EB'
      };
  
  // Apply dark theme if selected
  if (options.theme === 'dark') {
    pdf.setFillColor(colors.bg);
    pdf.rect(0, 0, 210, 297, 'F');
  }
  
  // Set text color
  pdf.setTextColor(options.theme === 'dark' ? 255 : 0);
  
  // Add title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WhatsApp Chat Export', 105, 15, { align: 'center' });
  
  // Add chat name and date
  pdf.setFontSize(14);
  pdf.text(options.redactedMode ? 'Redacted Chat' : chat.name, 105, 25, { align: 'center' });
  
  // Add export info
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const startDate = options.dateRange?.start ? formatDate(options.dateRange.start) : formatDate(chat.startDate);
  const endDate = options.dateRange?.end ? formatDate(options.dateRange.end) : formatDate(chat.endDate);
  
  pdf.text(`Date Range: ${startDate} to ${endDate}`, 105, 32, { align: 'center' });
  pdf.text(`Participants: ${options.redactedMode && options.redactedSenders
    ? chat.participants.map(p => options.redactedSenders?.includes(p) ? `Person ${options.redactedSenders.indexOf(p) + 1}` : p).join(', ')
    : chat.participants.join(', ')}`,
    105, 37, { align: 'center' });
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 42, { align: 'center' });
  
  // Add line separator
  pdf.setDrawColor(colors.highlight);
  pdf.setLineWidth(0.5);
  pdf.line(20, 48, 190, 48);
  
  // Filter messages by date range
  let messages = [...chat.messages];
  
  if (options.dateRange) {
    const startDate = new Date(options.dateRange.start);
    const endDate = new Date(options.dateRange.end);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    messages = messages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= startDate && msgDate <= endDate;
    });
  }
  
  // Build sender map for redaction
  const senderMap: Record<string, string> = {};
  
  if (options.redactedMode && options.redactedSenders && options.redactedSenders.length > 0) {
    options.redactedSenders.forEach((participant, index) => {
      senderMap[participant] = `Person ${index + 1}`;
    });
  }
  
  // Group messages by date
  const messagesByDate = groupMessagesByDate(messages);
  const sortedDates = Object.keys(messagesByDate).sort();
  
  // Current Y position for content
  let yPos = 55;
  
  // Loop through dates
  for (const date of sortedDates) {
    // Check if we need a new page
    if (yPos > 270) {
      pdf.addPage();
      yPos = 15;
    }
    
    // Add date header
    pdf.setFillColor(colors.sectionBg);
    pdf.roundedRect(20, yPos, 170, 7, 2, 2, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(options.theme === 'dark' ? 220 : 70);
    pdf.text(formatDate(date), 105, yPos + 5, { align: 'center' });
    
    yPos += 12;
    
    // Reset text color
    pdf.setTextColor(options.theme === 'dark' ? 255 : 0);
    
    // Messages for this date
    const messagesForDate = messagesByDate[date];
    
    for (const message of messagesForDate) {
      // Format sender
      const sender = options.redactedMode && options.redactedSenders
        ? senderMap[message.sender] || message.sender
        : message.sender;
      
      // Format time
      const time = formatTime(message.timestamp);
      
      // Format content
      let content = message.content;
      
      // Handle special message types
      if (message.isDeleted) {
        content = 'This message was deleted';
      } else if (message.isMedia) {
        content = 'Media';
      }
      
      // Measure text height
      const textLines = pdf.splitTextToSize(content, 155);
      const textHeight = textLines.length * 7;
      
      // Check if we need a new page
      if (yPos + textHeight + 12 > 280) {
        pdf.addPage();
        
        // Apply dark theme to new page if needed
        if (options.theme === 'dark') {
          pdf.setFillColor(colors.bg);
          pdf.rect(0, 0, 210, 297, 'F');
        }
        
        yPos = 15;
      }
      
      // Message bubble
      const isOwnMessage = sender === 'You';
      const bubbleX = isOwnMessage ? 45 : 20;
      const bubbleWidth = 145;
      
      // Draw bubble
      pdf.setFillColor(isOwnMessage ? colors.messageOwnBg : colors.messageOtherBg);
      pdf.roundedRect(bubbleX, yPos, bubbleWidth, textHeight + 12, 2, 2, 'F');
      
      // Draw sender and time
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(colors.highlight);
      pdf.text(sender, bubbleX + 3, yPos + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(options.theme === 'dark' ? 180 : 100);
      pdf.text(time, bubbleX + bubbleWidth - 3, yPos + 5, { align: 'right' });
      
      // Draw message content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(options.theme === 'dark' ? 220 : 60);
      
      // Add text with multiple lines support
      pdf.text(textLines, bubbleX + 3, yPos + 10);
      
      // Update Y position
      yPos += textHeight + 15;
    }
  }
  
  // Add journal entries if included
  if (options.includeJournalEntries && journalEntries && journalEntries.length > 0) {
    // Add a new page for journal entries
    pdf.addPage();
    
    // Apply dark theme to new page if needed
    if (options.theme === 'dark') {
      pdf.setFillColor(colors.bg);
      pdf.rect(0, 0, 210, 297, 'F');
    }
    
    // Add journal entries title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(options.theme === 'dark' ? 255 : 0);
    pdf.text('Journal Entries', 105, 15, { align: 'center' });
    
    // Add line separator
    pdf.setDrawColor(colors.highlight);
    pdf.setLineWidth(0.5);
    pdf.line(20, 20, 190, 20);
    
    // Current Y position for journal entries
    let entryYPos = 25;
    
    // Sort journal entries by date
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Loop through journal entries
    for (const entry of sortedEntries) {
      // Format date
      const entryDate = formatDate(entry.date);
      
      // Get emotion emoji
      let emotionEmoji = '';
      switch (entry.emotion.primary) {
        case 'happy': emotionEmoji = '😊'; break;
        case 'sad': emotionEmoji = '😔'; break;
        case 'angry': emotionEmoji = '😠'; break;
        case 'surprised': emotionEmoji = '😲'; break;
        case 'fearful': emotionEmoji = '😨'; break;
        case 'disgusted': emotionEmoji = '🤢'; break;
        case 'loving': emotionEmoji = '❤️'; break;
        case 'neutral': emotionEmoji = '😐'; break;
      }
      
      // Format intensity stars
      const intensity = '★'.repeat(entry.emotion.intensity) + '☆'.repeat(5 - entry.emotion.intensity);
      
      // Calculate text height
      const textLines = pdf.splitTextToSize(entry.text, 160);
      const textHeight = textLines.length * 7;
      
      // Check if we need a new page
      if (entryYPos + textHeight + 30 > 280) {
        pdf.addPage();
        
        // Apply dark theme to new page if needed
        if (options.theme === 'dark') {
          pdf.setFillColor(colors.bg);
          pdf.rect(0, 0, 210, 297, 'F');
        }
        
        entryYPos = 15;
      }
      
      // Draw entry header
      pdf.setFillColor(colors.sectionBg);
      pdf.roundedRect(20, entryYPos, 170, 10, 2, 2, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(options.theme === 'dark' ? 220 : 70);
      pdf.text(`${entryDate} - ${entry.emotion.primary.charAt(0).toUpperCase() + entry.emotion.primary.slice(1)} (${intensity})`, 25, entryYPos + 6);
      
      // Draw entry content
      pdf.setFillColor(options.theme === 'dark' ? '#262D31' : '#F9FAFB');
      pdf.roundedRect(20, entryYPos + 12, 170, textHeight + 8, 2, 2, 'F');
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(options.theme === 'dark' ? 220 : 60);
      
      // Add text with multiple lines support
      pdf.text(textLines, 25, entryYPos + 18);
      
      // Update Y position
      entryYPos += textHeight + 25;
    }
  }
  
  // Return as blob
  return pdf.output('blob');
}
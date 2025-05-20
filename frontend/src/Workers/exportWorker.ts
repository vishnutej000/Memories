import { WhatsAppChat, ExportOptions } from '../types';

self.addEventListener('message', (event) => {
  const { chat, options, id } = event.data;
  
  try {
    // Process based on export format
    let result;
    
    switch (options.format) {
      case 'txt':
        result = generateTxtExport(chat, options);
        break;
      case 'html':
        result = generateHtmlExport(chat, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    // Send result back to the main thread
    self.postMessage({
      success: true,
      result,
      id
    });
  } catch (error) {
    // Send error back to the main thread
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      id
    });
  }
});

// Generate plain text export
function generateTxtExport(chat: WhatsAppChat, options: ExportOptions): Blob {
  // Filter messages by date range if specified
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
    let counter = 1;
    chat.participants.forEach(participant => {
      if (options.redactedSenders?.includes(participant)) {
        senderMap[participant] = `Person ${counter++}`;
      } else {
        senderMap[participant] = participant;
      }
    });
  }
  
  // Generate export string
  let exportText = '';
  
  // Add header
  exportText += `WhatsApp Chat Export: ${options.redactedMode ? 'Redacted Chat' : chat.name}\r\n`;
  exportText += `Date: ${new Date().toLocaleString()}\r\n`;
  exportText += `Participants: ${options.redactedMode 
    ? Object.values(senderMap).join(', ')
    : chat.participants.join(', ')}\r\n`;
  exportText += `Total Messages: ${messages.length}\r\n`;
  exportText += `Date Range: ${options.dateRange?.start || chat.startDate} to ${options.dateRange?.end || chat.endDate}\r\n`;
  exportText += `\r\n`;
  exportText += `---------------\r\n\r\n`;
  
  // Add messages
  messages.forEach(msg => {
    // Format date
    const date = new Date(msg.timestamp);
    const formattedDate = date.toLocaleString();
    
    // Format sender
    const sender = options.redactedMode && options.redactedSenders
      ? senderMap[msg.sender] || msg.sender
      : msg.sender;
    
    // Format message
    let content = msg.content;
    
    // Handle special message types
    if (msg.isDeleted) {
      content = 'This message was deleted';
    } else if (msg.isMedia && content.includes('<Media omitted>')) {
      content = 'Media';
    }
    
    // Add to export
    exportText += `[${formattedDate}] ${sender}: ${content}\r\n`;
  });
  
  return new Blob([exportText], { type: 'text/plain' });
}

// Generate HTML export
function generateHtmlExport(chat: WhatsAppChat, options: ExportOptions): Blob {
  // Filter messages by date range if specified
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
    let counter = 1;
    chat.participants.forEach(participant => {
      if (options.redactedSenders?.includes(participant)) {
        senderMap[participant] = `Person ${counter++}`;
      } else {
        senderMap[participant] = participant;
      }
    });
  }
  
  // Generate HTML
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WhatsApp Chat: ${options.redactedMode ? 'Redacted Chat' : chat.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: ${options.theme === 'dark' ? '#121212' : '#f5f5f5'};
          color: ${options.theme === 'dark' ? '#e0e0e0' : '#333'};
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid ${options.theme === 'dark' ? '#444' : '#ddd'};
        }
        .chat-container {
          display: flex;
          flex-direction: column;
        }
        .message {
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 12px;
          margin-bottom: 12px;
          position: relative;
        }
        .message-own {
          align-self: flex-end;
          background-color: ${options.theme === 'dark' ? '#056162' : '#dcf8c6'};
          color: ${options.theme === 'dark' ? '#e9edef' : '#262626'};
        }
        .message-other {
          align-self: flex-start;
          background-color: ${options.theme === 'dark' ? '#262d31' : 'white'};
          color: ${options.theme === 'dark' ? '#e9edef' : '#262626'};
        }
        .sender {
          font-weight: bold;
          margin-bottom: 4px;
          color: ${options.theme === 'dark' ? '#7cb5ec' : '#128C7E'};
        }
        .content {
          margin-bottom: 4px;
        }
        .timestamp {
          font-size: 0.75rem;
          color: ${options.theme === 'dark' ? '#aaa' : '#777'};
          text-align: right;
        }
        .date-divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }
        .date-divider::before {
          content: "";
          display: block;
          height: 1px;
          width: 100%;
          background-color: ${options.theme === 'dark' ? '#444' : '#ddd'};
          position: absolute;
          top: 50%;
          left: 0;
        }
        .date-divider span {
          background-color: ${options.theme === 'dark' ? '#121212' : '#f5f5f5'};
          padding: 0 10px;
          position: relative;
          color: ${options.theme === 'dark' ? '#bbb' : '#888'};
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>WhatsApp Chat: ${options.redactedMode ? 'Redacted Chat' : chat.name}</h1>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>Participants: ${options.redactedMode 
          ? Object.values(senderMap).join(', ')
          : chat.participants.join(', ')}</p>
        <p>Total Messages: ${messages.length}</p>
        <p>Date Range: ${new Date(options.dateRange?.start || chat.startDate).toLocaleDateString()} 
          to ${new Date(options.dateRange?.end || chat.endDate).toLocaleDateString()}</p>
      </div>
      
      <div class="chat-container">
  `;
  
  // Group messages by date
  const messagesByDate: Record<string, typeof messages> = {};
  
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toLocaleDateString();
    
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    
    messagesByDate[date].push(msg);
  });
  
  // Sort dates
  const sortedDates = Object.keys(messagesByDate).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  // Add messages by date
  sortedDates.forEach(date => {
    // Add date divider
    html += `
      <div class="date-divider">
        <span>${date}</span>
      </div>
    `;
    
    // Add messages for this date
    messagesByDate[date].forEach(msg => {
      // Format sender
      const sender = options.redactedMode && options.redactedSenders
        ? senderMap[msg.sender] || msg.sender
        : msg.sender;
      
      // Format message
      let content = msg.content;
      
      // Handle special message types
      if (msg.isDeleted) {
        content = '<em>This message was deleted</em>';
      } else if (msg.isMedia && content.includes('<Media omitted>')) {
        content = '<em>Media</em>';
      }
      
      // Add message
      html += `
        <div class="message ${sender === 'You' ? 'message-own' : 'message-other'}">
          <div class="sender">${sender}</div>
          <div class="content">${content}</div>
          <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
      `;
    });
  });
  
  // Close HTML
  html += `
      </div>
    </body>
    </html>
  `;
  
  return new Blob([html], { type: 'text/html' });
}

export {};
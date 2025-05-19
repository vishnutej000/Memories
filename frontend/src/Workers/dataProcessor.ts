// Web Worker for processing large data sets
addEventListener('message', (event) => {
  const { id, action, data } = event.data;
  
  try {
    let result;
    
    switch (action) {
      case 'process':
        result = processData(data);
        break;
      case 'search':
        result = searchData(data.messages, data.query);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    postMessage({ id, result });
  } catch (error) {
    postMessage({ id, error: (error as Error).message });
  }
});

// Process data (could be messages, sentiment, etc.)
function processData(data: any) {
  // This is a simple passthrough for now
  // In a real app, you might do more processing here
  return data;
}

// Search through messages
function searchData(messages: any[], query: string) {
  if (!messages || !query) return [];
  
  const searchTerms = query.toLowerCase().split(' ');
  
  return messages.filter(message => {
    const content = message.content?.toLowerCase() || '';
    return searchTerms.every(term => content.includes(term));
  });
}
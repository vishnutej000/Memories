// Web Worker for sentiment analysis
addEventListener('message', (event) => {
  const { id, action, data } = event.data;
  
  try {
    let result;
    
    switch (action) {
      case 'analyze':
        result = analyzeSentiment(data);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    postMessage({ id, result });
  } catch (error) {
    postMessage({ id, error: (error as Error).message });
  }
});

// Simple sentiment analysis (in a real app, this would be more sophisticated)
function analyzeSentiment(messages: any[]) {
  // This is a placeholder for demonstration purposes
  // In a real app, this would use a sentiment analysis library
  // or call an API endpoint
  
  const positiveWords = ['happy', 'good', 'great', 'awesome', 'love', 'like', 'thanks'];
  const negativeWords = ['sad', 'bad', 'terrible', 'hate', 'dislike', 'sorry'];
  
  return messages.map(message => {
    const content = message.content?.toLowerCase() || '';
    const words = content.split(/\s+/);
    
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });
    
    // Clamp score between -1 and 1
    score = Math.max(-1, Math.min(1, score));
    
    return {
      ...message,
      sentiment_score: score
    };
  });
}
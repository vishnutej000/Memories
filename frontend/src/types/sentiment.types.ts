export interface SentimentAnalysis {
  overall_score: number;
  overall_magnitude: number;
  daily_sentiment: DailySentiment[];
  sender_sentiment: {
    [sender: string]: {
      avg_score: number;
      message_count: number;
    };
  };
  emotion_distribution: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    neutral: number;
  };
  topic_sentiment: {
    [topic: string]: number;
  };
}

export interface DailySentiment {
  date: string;
  avg_score: number;
  message_count: number;
  top_positive_message?: {
    content: string;
    score: number;
    sender: string;
  };
  top_negative_message?: {
    content: string;
    score: number;
    sender: string;
  };
}

export interface EmojiAnalysis {
  most_used: Array<{
    emoji: string;
    count: number;
    percentage: number;
  }>;
  by_sender: {
    [sender: string]: Array<{
      emoji: string;
      count: number;
    }>;
  };
  by_sentiment: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}
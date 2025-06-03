import { useCallback, useState } from 'react';

interface UseSentimentAnalysisReturn {
    analyzeSentiment: (text: string) => Promise<number>;
    analyzeBatchSentiment: (texts: string[]) => Promise<number[]>;
    isAnalyzing: boolean;
}

export const useSentimentAnalysis = (): UseSentimentAnalysisReturn => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeSentiment = useCallback(async (text: string): Promise<number> => {
        try {
            setIsAnalyzing(true);
            const response = await fetch('/api/analyze-sentiment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze sentiment');
            }

            const data = await response.json();
            return data.sentiment_score;
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            return 0;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const analyzeBatchSentiment = useCallback(async (texts: string[]): Promise<number[]> => {
        try {
            setIsAnalyzing(true);
            const response = await fetch('/api/analyze-batch-sentiment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ texts }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze batch sentiment');
            }

            const data = await response.json();
            return data.sentiment_scores;
        } catch (error) {
            console.error('Error analyzing batch sentiment:', error);
            return texts.map(() => 0);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return {
        analyzeSentiment,
        analyzeBatchSentiment,
        isAnalyzing,
    };
};
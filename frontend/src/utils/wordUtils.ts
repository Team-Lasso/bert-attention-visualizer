import { WordPrediction } from './interfaces';

/**
 * Get replacement options for a selected word
 * Returns either model-based predictions or fallback options
 * 
 * @param token The original token text to be replaced
 * @param predictions Model predictions if available
 * @returns Array of word replacement options with probability scores
 */
export const getReplacementOptions = (
  token: string,
  predictions: WordPrediction[] | null
): { word: string, score: number }[] => {
  // If no predictions are available, return fallback options
  if (!predictions || predictions.length === 0) {
    return [
      { word: 'good', score: 0.25 },
      { word: 'great', score: 0.20 },
      { word: 'nice', score: 0.18 },
      { word: 'awesome', score: 0.15 },
      { word: 'wonderful', score: 0.12 }
    ];
  }

  // Return top 5 predictions that are not the original word
  return predictions
    .filter(p => p.word.toLowerCase() !== token.toLowerCase())
    .slice(0, 5);
}; 
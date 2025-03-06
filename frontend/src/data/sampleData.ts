import { AttentionData, SampleData, MaskPrediction, WordPrediction, Token } from '../types';

// Generate sample predictions for a masked token
const generateSamplePredictions = (tokenIndex: number, contextTokens: string[]): WordPrediction[] => {
  // This is a simplified simulation of BERT predictions
  // In a real application, this would call a backend API with the actual BERT model
  
  // Handle special tokens
  if (tokenIndex === 0) {
    // Predictions for [CLS] token
    return [
      { word: "[CLS]", score: 0.95 },
      { word: "[SEP]", score: 0.02 },
      { word: "the", score: 0.01 },
      { word: "a", score: 0.005 },
      { word: "this", score: 0.005 },
      { word: "it", score: 0.003 },
      { word: "there", score: 0.002 },
      { word: "they", score: 0.002 },
      { word: "we", score: 0.002 },
      { word: "i", score: 0.001 }
    ];
  }
  
  if (contextTokens[tokenIndex] === "[SEP]") {
    // Predictions for [SEP] token
    return [
      { word: "[SEP]", score: 0.92 },
      { word: ".", score: 0.03 },
      { word: "[CLS]", score: 0.02 },
      { word: "!", score: 0.01 },
      { word: "?", score: 0.005 },
      { word: ",", score: 0.005 },
      { word: "and", score: 0.003 },
      { word: "but", score: 0.002 },
      { word: "so", score: 0.002 },
      { word: "then", score: 0.001 }
    ];
  }
  
  // Common words that BERT might predict based on context
  const commonWords = [
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'will', 'would', 'can', 
    'could', 'should', 'may', 'might', 'must', 'has', 'have', 'had', 'do', 
    'does', 'did', 'to', 'for', 'with', 'in', 'on', 'at', 'by', 'from', 
    'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 
    'out', 'up', 'down', 'off', 'and', 'or', 'but', 'so', 'because', 'if', 
    'when', 'where', 'how', 'what', 'who', 'which', 'that', 'this', 'these', 
    'those', 'it', 'they', 'he', 'she', 'we', 'you', 'I', 'me', 'him', 'her', 
    'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 
    'hers', 'ours', 'theirs'
  ];
  
  // Context-specific words based on surrounding tokens
  const contextSpecificWords: string[] = [];
  
  // Add some context-specific words based on surrounding tokens
  if (contextTokens.includes('cat') || contextTokens.includes('dog')) {
    contextSpecificWords.push('pet', 'animal', 'furry', 'cute', 'small');
  }
  
  if (contextTokens.includes('sat') || contextTokens.includes('stood')) {
    contextSpecificWords.push('walked', 'jumped', 'ran', 'moved', 'fell');
  }
  
  if (contextTokens.includes('mat') || contextTokens.includes('chair')) {
    contextSpecificWords.push('table', 'floor', 'couch', 'bed', 'rug');
  }
  
  // Combine common and context-specific words
  const candidateWords = [...new Set([...commonWords, ...contextSpecificWords])];
  
  // Generate random scores for each word
  const predictions = candidateWords.map(word => ({
    word,
    score: Math.random()
  }));
  
  // Sort by score (descending) and take top 20
  return predictions
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
};

// Generate attention data from a sentence with BERT's special tokens
export const generateAttentionData = (sentence: string): AttentionData => {
  // Split sentence into tokens and add BERT special tokens
  const rawTokens = sentence.split(/\s+/);
  
  // Create tokens array with [CLS] at the beginning and [SEP] at the end
  const tokenTexts = ["[CLS]", ...rawTokens, "[SEP]"];
  const tokens: Token[] = tokenTexts.map((text, index) => ({ text, index }));
  
  // Generate sample attention matrices for each layer and head
  const layers = Array.from({ length: 12 }, (_, layerIndex) => {
    const heads = Array.from({ length: 12 }, (_, headIndex) => {
      // Create a sample attention matrix for this head
      const attention = Array.from({ length: tokens.length }, () => 
        Array.from({ length: tokens.length }, () => Math.random())
      );
      
      // For BERT-like attention patterns:
      // - [CLS] token often attends to all tokens
      // - Tokens often attend to themselves
      // - Special emphasis on [CLS] and [SEP]
      for (let i = 0; i < tokens.length; i++) {
        // Boost self-attention
        attention[i][i] *= 2;
        
        // [CLS] token (index 0) attends to all tokens somewhat evenly
        if (i === 0) {
          for (let j = 0; j < tokens.length; j++) {
            attention[i][j] *= 1.5;
          }
        }
        
        // All tokens pay some attention to [CLS] and [SEP]
        attention[i][0] *= 1.5; // Attention to [CLS]
        attention[i][tokens.length - 1] *= 1.5; // Attention to [SEP]
      }
      
      // Normalize each row to sum to 1
      attention.forEach(row => {
        const sum = row.reduce((a, b) => a + b, 0);
        for (let i = 0; i < row.length; i++) {
          row[i] = row[i] / sum;
        }
      });
      
      return { headIndex, attention };
    });
    
    return { layerIndex, heads };
  });
  
  // Generate mask predictions for each token
  const maskPredictions: MaskPrediction[] = tokens.map(token => ({
    tokenIndex: token.index,
    predictions: generateSamplePredictions(token.index, tokenTexts)
  }));
  
  return { tokens, layers, maskPredictions };
};

// Sample attention data for visualization
const generateSampleAttentionData = (): AttentionData => {
  return generateAttentionData("The cat sat on the mat");
};

// Create a few sample datasets
export const sampleDatasets: SampleData[] = [
  {
    name: "Sample 1: Basic Sentence",
    data: generateSampleAttentionData()
  },
  {
    name: "Sample 2: Another Example",
    data: generateAttentionData("The quick brown fox jumps over the lazy dog")
  },
  {
    name: "Sample 3: Question Answering",
    data: generateAttentionData("What is the capital of France")
  }
];
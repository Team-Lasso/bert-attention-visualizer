
//! this is not a token, but that's fine ... (should rename as word)
export interface Token {
  text: string;
  index: number;
}

export interface AttentionHead {
  headIndex: number;
  attention: number[][];
}

export interface Layer {
  layerIndex: number;
  heads: AttentionHead[];
}
/**
 * one of the example of AttentionData
 *  
 * {
  "tokens": [
    { "text": "[CLS]" },
    { "text": "Hello" },
    { "text": "world" },
    { "text": "!" },
    { "text": "[SEP]" }
    ],
  layers: [
    {
      layerIndex: 0,
      heads: [
        { headIndex: 0, attention: [[0.1, 0.2, 0.3, 0.4], [0.2, 0.1, 0.3, 0.4]] },
        { headIndex: 1, attention: [[0.3, 0.1, 0.4, 0.2], [0.5, 0.2, 0.1, 0.2]] }
      ]
    }
  ],
  maskPredictions: [
    {
      tokenIndex: 1,
      predictions: [
        { word: "Hi", score: 0.85 },
        { word: "Hey", score: 0.10 }
      ]
    }
  ]
} 
*/

export interface AttentionData {
  tokens: { text: string }[];
  layers: {
    heads: {
      attention: number[][];
    }[];
  }[];
  maskPredictions?: MaskPredictionData[];
}

/**
 * one of the example of SampleData
 * 
 * {
 *  name: "Sample 1",
 *  data: {
 *    tokens: [{ text: "[CLS]" }, { text: "Hello" }, { text: "world" }, { text: "!" }, { text: "[SEP]" }],
 *    layers: [{ heads: [{ attention: [[0.1, 0.2, 0.3, 0.4], [0.2, 0.1, 0.3, 0.4]] }] }],
 *    maskPredictions: [{ tokenIndex: 1, predictions: [{ word: "Hi", score: 0.85 }, { word: "Hey", score: 0.10 }] }]
 *  }
 * }  
*/
export interface SampleData {
  name: string;
  data: AttentionData;
}

export interface WordAttentionData {
  sourceWord: string;
  targetWords: string[];
  attentionValues: number[];
}

export interface MaskPredictionData {
  tokenIndex: number;
  predictions: WordPrediction[];
}

export interface WordPrediction {
  word: string;
  score: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  parameters: string;
  tokenizer: string;
  architecture: string;
  defaultLayers: number;
  defaultHeads: number;
  icon?: string;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  maxSequenceLength: number;
}

export interface TrainingStatus {
  isTraining: boolean;
  currentEpoch: number;
  totalEpochs: number;
  progress: number;
  loss?: number;
  accuracy?: number;
  elapsedTime?: number;
  estimatedTimeRemaining?: number;
}
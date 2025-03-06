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

export interface AttentionData {
  tokens: Token[];
  layers: Layer[];
  maskPredictions?: MaskPrediction[];
}

export interface SampleData {
  name: string;
  data: AttentionData;
}

export interface WordAttentionData {
  sourceWord: string;
  targetWords: string[];
  attentionValues: number[];
}

export interface MaskPrediction {
  tokenIndex: number;
  predictions: WordPrediction[];
}

export interface WordPrediction {
  word: string;
  score: number;
}
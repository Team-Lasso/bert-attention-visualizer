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
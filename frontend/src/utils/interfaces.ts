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

export interface AttentionMatrixProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
  selectedTokenIndex: number | null;
  onTokenClick?: (tokenIndex: number) => void;
}

export interface ParallelViewProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
  selectedTokenIndex: number | null;
  onTokenClick?: (tokenIndex: number) => void;
} 

export interface TokensVisualizerProps {
  tokens: Token[];
  onTokenSelect: (tokenIndex: number) => void;
  selectedTokenIndex: number | null;
}

export interface VisualizationSidebarProps {
  layers: (Layer & { layerIndex: number })[];
  selectedLayer: number;
  selectedHead: number;
  onLayerChange: (layer: number) => void;
  onHeadChange: (head: number) => void;
  modelName: string;
  modelArchitecture: string;
  modelTokenizer: string;
  tokenCount: number;
  layerCount: number;
  headsPerLayer: number;
  activeView: "matrix" | "parallel";
  onViewChange: (view: "matrix" | "parallel") => void;
}

export interface WordAttentionBarChartProps {
  data: WordAttentionData;
  width: number;
  height: number;
}

export interface WordMaskingProps {
  tokens: Token[];
  onMaskWord: (tokenIndex: number) => void;
  maskedTokenIndex: number | null;
  predictions: { word: string; score: number }[] | null;
}

export interface WordReplacementPanelProps {
  showWordReplacement: boolean;
  toggleWordReplacement: () => void;
  tokens: Token[];
  wordToReplace: number | null;
  replacementOptions: { word: string, score: number }[];
  replacementWord: string | null;
  isReplacing: boolean;
  handleSelectWordToReplace: (index: number) => void;
  handleSelectReplacement: (word: string) => void;
  handleApplyReplacement: () => void;
}

export interface SentenceInputProps {
  onSentenceSubmit: (sentence: string) => void;
  isLoading: boolean;
}

export interface PretrainedModelSelectorProps {
  availableModels: ModelConfig[];
  onModelSelect: (modelId: string) => void;
  selectedModelId: string | null;
  isLoading?: boolean;
  onUseModel?: () => void;
}

export interface ParallelViewProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
  selectedTokenIndex: number | null;
  onTokenClick?: (tokenIndex: number) => void;
}

export interface MaskPredictionPanelProps {
  maskedTokenIndex: number | null;
  predictions: WordPrediction[] | null;
}

export interface InputSentencePanelProps {
  modelName: string;
  onSentenceSubmit: (sentence: string) => void;
  isProcessing: boolean;
}


export interface HeaderProps {
  showModelSelector: boolean;
  onToggleModelSelector: () => void;
}

export interface ComparisonViewProps {
  showWordReplacement: boolean;
  showComparison: boolean;
  beforeData: AttentionData | null;
  afterData: AttentionData | null;
  wordToReplace: number | null;
  replacementWord: string | null;
  comparisonView: 'parallel' | 'matrix';
  setComparisonView: (view: 'parallel' | 'matrix') => void;
  selectedLayer: number;
  selectedHead: number;
  selectedTokenIndex: number | null;
  setSelectedLayer: (layer: number) => void;
  setSelectedHead: (head: number) => void;
  currentData: AttentionData;
}

export interface AttentionVisualizerProps {
  datasets: SampleData[];
}

export interface AttentionHeadSelectorProps {
  layers: Layer[];
  selectedLayer: number;
  selectedHead: number;
  onLayerChange: (layerIndex: number) => void;
  onHeadChange: (headIndex: number) => void;
}
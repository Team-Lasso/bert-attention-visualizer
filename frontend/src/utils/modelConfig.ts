import { ModelConfig } from './interfaces';
import { fetchAvailableModels } from '../services/modelService';

// Default model configurations as fallback
export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'bert-base-uncased',
    name: 'BERT Base Uncased',
    description: 'PyTorch implementation of the BERT Base Uncased model',
    parameters: '110M',
    tokenizer: 'WordPiece',
    architecture: 'BERT',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'server'
  },
  {
    id: 'roberta-base',
    name: 'RoBERTa Base',
    description: 'PyTorch implementation of the RoBERTa Base model',
    parameters: '125M',
    tokenizer: 'Byte-level BPE',
    architecture: 'RoBERTa',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'cpu'
  }
];

// Function to load models from backend, falling back to defaults if needed
export const loadAvailableModels = async (): Promise<ModelConfig[]> => {
  try {
    const backendModels = await fetchAvailableModels();
    if (backendModels.length > 0) {
      return backendModels;
    }
    console.warn('No models returned from backend, using defaults');
    return DEFAULT_MODELS;
  } catch (error) {
    console.error('Error loading models from backend:', error);
    console.warn('Using default model configurations');
    return DEFAULT_MODELS;
  }
}; 
import { ModelConfig } from '../types';

export const pretrainedModels: ModelConfig[] = [
  {
    id: 'bert-base-uncased',
    name: 'BERT Base Uncased',
    description: 'The original BERT base model with 12 layers and uncased tokens',
    parameters: '110M parameters',
    tokenizer: 'WordPiece',
    architecture: 'Transformer Encoder',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'server'
  },
  {
    id: 'roberta-base',
    name: 'RoBERTa Base',
    description: 'Optimized version of BERT with improved training methodology',
    parameters: '125M parameters',
    tokenizer: 'Byte-level BPE',
    architecture: 'Transformer Encoder',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'cpu'
  },
  
];

export default pretrainedModels; 
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
    id: 'bert-large-uncased',
    name: 'BERT Large Uncased',
    description: 'The original BERT large model with 24 layers and uncased tokens',
    parameters: '340M parameters',
    tokenizer: 'WordPiece',
    architecture: 'Transformer Encoder',
    defaultLayers: 24,
    defaultHeads: 16,
    icon: 'server'
  },
  {
    id: 'bert-base-cased',
    name: 'BERT Base Cased',
    description: 'Case-sensitive version of BERT base with 12 layers',
    parameters: '110M parameters',
    tokenizer: 'WordPiece',
    architecture: 'Transformer Encoder',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'server'
  },
  {
    id: 'distilbert-base-uncased',
    name: 'DistilBERT',
    description: 'Distilled version of BERT that is smaller, faster, and lighter',
    parameters: '66M parameters',
    tokenizer: 'WordPiece',
    architecture: 'Distilled Transformer',
    defaultLayers: 6,
    defaultHeads: 12,
    icon: 'cpu'
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
  {
    id: 'albert-base-v2',
    name: 'ALBERT Base v2',
    description: 'A Lite BERT with parameter reduction techniques',
    parameters: '12M parameters',
    tokenizer: 'SentencePiece',
    architecture: 'Transformer Encoder (Factorized)',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'cpu'
  },
  {
    id: 'bert-base-multilingual-uncased',
    name: 'Multilingual BERT',
    description: 'BERT trained on 104 languages with shared vocabulary',
    parameters: '168M parameters',
    tokenizer: 'WordPiece',
    architecture: 'Transformer Encoder',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'book'
  },
  {
    id: 'biobert-v1.1',
    name: 'BioBERT',
    description: 'BERT trained on biomedical domain texts, optimized for scientific text',
    parameters: '110M parameters',
    tokenizer: 'WordPiece',
    architecture: 'Transformer Encoder',
    defaultLayers: 12,
    defaultHeads: 12,
    icon: 'book'
  }
];

export default pretrainedModels; 
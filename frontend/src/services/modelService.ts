import { ModelConfig, Token, WordPrediction, AttentionData } from '../utils/interfaces';
import pretrainedModels from '../data/pretrainedModels';

// Update URL to use the proxy configured in vite.config.ts
const API_URL = '/api';

/**
 * Fetch available PyTorch models from the backend
 */
export const fetchAvailableModels = async (): Promise<ModelConfig[]> => {
  try {
    const response = await fetch(`${API_URL}/models`);
    if (!response.ok) {
      console.warn('Failed to fetch models from backend, using predefined models');
      // Filter to only include the models likely supported by backend
      return pretrainedModels.filter(model => 
        ['bert-base-uncased', 'roberta-base'].includes(model.id)
      );
    }

    const data = await response.json();
    
    // Map backend models to frontend model configs
    const backendModels = data.models.map((model: {id: string, name: string}) => {
      // First try to find the model in our predefined list
      const predefinedModel = pretrainedModels.find(pm => pm.id === model.id);
      
      if (predefinedModel) {
        return predefinedModel;
      }
      
      // If not found, create a default config
      return {
        id: model.id,
        name: model.name,
        description: `PyTorch implementation of ${model.name}`,
        parameters: model.id.includes('bert-base') ? '110M parameters' : '125M parameters',
        tokenizer: model.id.includes('roberta') ? 'Byte-level BPE' : 'WordPiece',
        architecture: model.id.includes('roberta') ? 'Transformer Encoder (RoBERTa)' : 'Transformer Encoder (BERT)',
        defaultLayers: model.id.includes('large') ? 24 : 12,
        defaultHeads: model.id.includes('large') ? 16 : 12,
        icon: 'server'
      };
    });
    
    return backendModels;
  } catch (error) {
    console.error('Error fetching models:', error);
    // Fallback to predefined models that are likely supported
    return pretrainedModels.filter(model => 
      ['bert-base-uncased', 'roberta-base'].includes(model.id)
    );
  }
};

/**
 * Tokenize text using the specified model
 */
export const tokenizeText = async (text: string, modelName: string): Promise<Token[]> => {
  try {
    // Properly handle punctuation by letting the backend tokenizer handle it
    const response = await fetch(`${API_URL}/tokenize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_name: modelName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to tokenize text: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tokens;
  } catch (error) {
    console.error('Error tokenizing text:', error);
    throw error;
  }
};

/**
 * Get masked word predictions using the specified model
 */
export const getMaskedPredictions = async (
  text: string,
  maskIndex: number,
  modelName: string,
  topK: number = 10
): Promise<WordPrediction[]> => {
  try {
    // Let the backend handle punctuation properly
    const response = await fetch(`${API_URL}/predict_masked`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        mask_index: maskIndex,
        model_name: modelName,
        top_k: topK,
      }),
    });

    if (!response.ok) {
      // Log detailed error information
      const errorText = await response.text();
      console.error(`Prediction error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to get predictions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.predictions;
  } catch (error) {
    console.error('Error getting masked predictions:', error);
    throw error;
  }
};

/**
 * Get attention data for a sentence using the specified model
 * If the backend doesn't support the /attention endpoint, falls back to sample data
 */
export const getAttentionData = async (text: string, modelName: string): Promise<AttentionData> => {
  try {
    console.log(`Attempting to fetch attention data for: "${text}" with model: ${modelName}`);
    
    // Now try the actual request
    const response = await fetch(`${API_URL}/attention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_name: modelName,
      }),
    });

    // If we get a 404, the endpoint doesn't exist yet
    if (response.status === 404) {
      console.warn('Attention endpoint not found on backend (404), using fallback data');
      return fallbackToSampleAttentionData(text);
    }

    if (!response.ok) {
      console.error(`Failed to get attention data: ${response.status} ${response.statusText}`);
      return fallbackToSampleAttentionData(text);
    }

    const data = await response.json();
    console.log('Successfully received attention data from backend', data);
    
    // Validate the data structure
    if (!data.attention_data) {
      console.error('Response is missing attention_data field', data);
      return fallbackToSampleAttentionData(text);
    }
    
    const attentionData = data.attention_data;
    
    // Verify that the data has the expected structure
    if (!Array.isArray(attentionData.tokens) || !Array.isArray(attentionData.layers)) {
      console.error('Invalid attention data structure', attentionData);
      return fallbackToSampleAttentionData(text);
    }
    
    // Log some statistics about the data
    console.log(`Received attention data for ${attentionData.tokens.length} tokens, ${attentionData.layers.length} layers`);
    if (attentionData.layers.length > 0) {
      const firstLayer = attentionData.layers[0];
      console.log(`First layer has ${firstLayer.heads.length} heads`);
      if (firstLayer.heads.length > 0) {
        const firstHead = firstLayer.heads[0];
        console.log(`First head's attention matrix dimensions: ${firstHead.attention.length}x${firstHead.attention[0]?.length || 0}`);
      }
    }
    
    return attentionData;
  } catch (error) {
    console.error('Error getting attention data:', error);
    console.warn('Falling back to sample attention data');
    return fallbackToSampleAttentionData(text);
  }
};

/**
 * Fallback function to generate sample attention data if the backend API is not available
 */
const fallbackToSampleAttentionData = (text: string): AttentionData => {
  // Split sentence into tokens and add BERT special tokens
  const rawTokens = text.split(/\s+/);
  
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
  
  return { tokens, layers };
};
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
    // For BERT specifically, identify the word being masked to help backend
    const isBert = modelName.includes('bert') && !modelName.includes('roberta');
    const isRoberta = modelName.includes('roberta');
    
    // Get the word at the mask index, cleaning it of any punctuation
    const words = text.split(' ');
    const wordAtIndex = words[maskIndex] || '';
    // Clean the word from any punctuation
    const cleanWord = wordAtIndex.replace(/^[^\w]+|[^\w]+$/g, '');
    console.log(`Word to mask: "${cleanWord}" from "${wordAtIndex}" at index ${maskIndex}`);
    
    // For RoBERTa, create an explicit masked text to avoid masking issues
    let explicitMaskedText = '';
    if (isRoberta) {
      const wordsWithMask = [...words];
      wordsWithMask[maskIndex] = '<mask>';
      explicitMaskedText = wordsWithMask.join(' ');
      console.log(`RoBERTa explicit masked text: "${explicitMaskedText}"`);
    }
    
    // Let the backend handle punctuation properly
    const response = await fetch(`${API_URL}/predict_masked`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add extra headers to help backend with masking
        ...(isBert && { 'X-Token-To-Mask': cleanWord }),
        ...(isRoberta && { 'X-Explicit-Masked-Text': explicitMaskedText })
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
 * Now requires a working backend connection - no fallback to sample data
 */
export const getAttentionData = async (text: string, modelName: string): Promise<AttentionData> => {
  try {
    console.log(`Fetching attention data for: "${text}" with model: ${modelName}`);
    
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

    // If we get a 404, the endpoint doesn't exist
    if (response.status === 404) {
      throw new Error('Attention endpoint not found. Please make sure the backend server is running and supports the /attention endpoint.');
    }

    if (!response.ok) {
      throw new Error(`Failed to get attention data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully received attention data from backend');
    
    // Validate the data structure
    if (!data.attention_data) {
      throw new Error('Backend response is missing attention_data field');
    }
    
    const attentionData = data.attention_data;
    
    // Verify that the data has the expected structure
    if (!Array.isArray(attentionData.tokens) || !Array.isArray(attentionData.layers)) {
      throw new Error('Invalid attention data structure received from backend');
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
    
    // Add mask predictions placeholder as they're not directly included in backend response
    // This will allow compatibility with the rest of the application that expects maskPredictions
    if (!attentionData.maskPredictions) {
      attentionData.maskPredictions = [];
    }
    
    return attentionData;
  } catch (error) {
    console.error('Error getting attention data:', error);
    throw error; // Re-throw the error instead of falling back to sample data
  }
};
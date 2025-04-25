import { ModelConfig, Token, WordPrediction, AttentionData } from '../utils/interfaces';
import pretrainedModels from '../data/pretrainedModels';
import { getApiUrl } from '../utils/api';

// Use the API utils to get the correct URL based on environment
const getEndpointUrl = (endpoint: string): string => {
  return getApiUrl(endpoint);
};

/**
 * Normalize prediction scores to proper probability values (0-1 range)
 * This handles cases where backend returns values outside expected ranges
 */
const normalizePredictionScores = (predictions: WordPrediction[]): WordPrediction[] => {
  if (!predictions || predictions.length === 0) return predictions;

  // Check if scores are already in valid range (approximately 0-1)
  const allScoresValid = predictions.every(p => p.score >= 0 && p.score <= 1.05);
  const sumOfScores = predictions.reduce((sum, p) => sum + p.score, 0);
  const scoresAreProbabilities = allScoresValid && Math.abs(sumOfScores - 1.0) < 0.1;

  if (scoresAreProbabilities) {
    // Scores are already valid probabilities, just return them
    console.log("Prediction scores are already valid probabilities:", { sum: sumOfScores });
    return predictions;
  }

  console.log("Normalizing prediction scores. Original range:", {
    min: Math.min(...predictions.map(p => p.score)),
    max: Math.max(...predictions.map(p => p.score)),
    sum: sumOfScores
  });

  // Use softmax to convert scores to probabilities if they're not already
  // This ensures they sum to 1.0 and are in 0-1 range
  const maxScore = Math.max(...predictions.map(p => p.score));
  const expScores = predictions.map(p => Math.exp(p.score - maxScore)); // Subtract max for numerical stability
  const sumExpScores = expScores.reduce((sum, exp) => sum + exp, 0);

  const normalizedPredictions = predictions.map((prediction, i) => ({
    ...prediction,
    score: expScores[i] / sumExpScores
  }));

  console.log("Normalized scores:", {
    min: Math.min(...normalizedPredictions.map(p => p.score)),
    max: Math.max(...normalizedPredictions.map(p => p.score)),
    sum: normalizedPredictions.reduce((sum, p) => sum + p.score, 0)
  });

  return normalizedPredictions;
};

/**
 * Fetch available PyTorch models from the backend
 */
export const fetchAvailableModels = async (): Promise<ModelConfig[]> => {
  try {
    const response = await fetch(`${getEndpointUrl('models')}`);
    if (!response.ok) {
      console.warn('Failed to fetch models from backend, using predefined models');
      // Filter to only include the models likely supported by backend
      return pretrainedModels.filter(model =>
        ['bert-base-uncased', 'roberta-base'].includes(model.id)
      );
    }

    const data = await response.json();

    // Map backend models to frontend model configs
    const backendModels = data.models.map((model: { id: string, name: string }) => {
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
    const response = await fetch(`${getEndpointUrl('tokenize')}`, {
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

    // Get the word at the mask index
    const words = text.split(' ');
    const wordAtIndex = words[maskIndex] || '';

    // More precise punctuation detection - check if the entire token is only punctuation
    const isPunctuation = /^[.,;:!?'"()[\]{}]+$/.test(wordAtIndex.trim());
    console.log(`Word to mask: "${wordAtIndex}" at index ${maskIndex}, isPunctuation: ${isPunctuation}`);

    // Clean the word from any punctuation if it's not a pure punctuation token
    const cleanWord = isPunctuation ? wordAtIndex : wordAtIndex.replace(/^[^\w]+|[^\w]+$/g, '');

    // For RoBERTa or punctuation tokens, create an explicit masked text
    let explicitMaskedText = '';

    // Only use explicit masking for RoBERTa or actual punctuation tokens
    if ((isRoberta && wordAtIndex.trim() !== '') || isPunctuation) {
      // Handle punctuation and RoBERTa specially with explicit masking
      const wordsWithMask = [...words];

      // If masking punctuation at the end of a word, we need special handling
      if (isPunctuation && maskIndex > 0 && words[maskIndex - 1] && words[maskIndex - 1].endsWith(wordAtIndex)) {
        // The punctuation is part of
        //  the previous word
        const prevWord = words[maskIndex - 1];
        wordsWithMask[maskIndex - 1] = prevWord.slice(0, -1) + '<mask>';
        // Remove the separate punctuation token as we've merged it with the previous word
        if (maskIndex < wordsWithMask.length) {
          wordsWithMask.splice(maskIndex, 1);
        }
      } else {
        wordsWithMask[maskIndex] = '<mask>';
      }

      explicitMaskedText = wordsWithMask.join(' ');
      console.log(`Explicit masked text: "${explicitMaskedText}"`);
    }

    // Let the backend handle masking properly
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add token-to-mask header for BERT when dealing with regular words
    if (isBert && !isPunctuation && cleanWord) {
      headers['X-Token-To-Mask'] = cleanWord;
    }

    // Only add explicit masked text header when we have one
    if (explicitMaskedText) {
      headers['X-Explicit-Masked-Text'] = explicitMaskedText;
    }

    const response = await fetch(`${getEndpointUrl('predict_masked')}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        mask_index: maskIndex + 1, //!: Chen fix this, but it may not be the best way for off index question.
        model_name: modelName, //! 
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
    console.log("Raw predictions from backend:", data.predictions);

    // Skip normalization for RoBERTa as it's already normalized in the backend
    if (isRoberta) {
      console.log("Using RoBERTa model - skipping frontend normalization as backend already applies softmax");
      return data.predictions;
    }

    // Normalize the scores to ensure they're proper probabilities for BERT
    return normalizePredictionScores(data.predictions);
  } catch (error) {
    console.error('Error getting masked predictions:', error);
    throw error;
  }
};

/**
 * Get attention data for a sentence using the specified model
 * Now requires a working backend connection - no fallback to sample data
 */
export const getAttentionData = async (
  text: string,
  modelName: string,
  visualizationMethod: 'raw' | 'rollout' | 'flow' = 'raw'
): Promise<AttentionData> => {
  try {
    console.log(`Fetching attention data for: "${text}" with model: ${modelName}, method: ${visualizationMethod}`);

    const response = await fetch(`${getEndpointUrl('attention')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_name: modelName,
        visualization_method: visualizationMethod
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

/**
 * Get comparison of attention data before and after replacing a masked token
 * This calls the attention_comparison endpoint in the backend
 */
export const getAttentionComparison = async (
  text: string,
  maskedIndex: number,
  replacementWord: string,
  modelName: string,
  visualizationMethod: 'raw' | 'rollout' | 'flow' = 'raw'
): Promise<{ before_attention: AttentionData, after_attention: AttentionData }> => {
  try {
    const isRoberta = modelName.includes('roberta');
    console.log(`Fetching attention comparison for: "${text}" with replacement "${replacementWord}" at index ${maskedIndex} (using ${isRoberta ? 'RoBERTa' : 'BERT'})`);
    console.log(`Visualization method: ${visualizationMethod}`);

    // For RoBERTa, we need to handle token vs word indices differently
    // The backend now handles this internally with robust token-to-word mapping

    // Splitting tokens and logging for debugging
    const tokens = text.split(/\s+/);
    console.log(`Text tokens (${tokens.length}): ${JSON.stringify(tokens)}`);

    // If maskedIndex is out of bounds, provide a safer index
    const safeIndex = Math.min(maskedIndex, tokens.length - 1);
    if (safeIndex !== maskedIndex) {
      console.warn(`Masked index ${maskedIndex} was out of range, adjusted to ${safeIndex}`);
    }

    const response = await fetch(`${getEndpointUrl('attention_comparison')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        masked_index: maskedIndex,
        replacement_word: replacementWord,
        model_name: modelName,
        visualization_method: visualizationMethod
      }),
    });

    if (response.status === 404) {
      throw new Error('Attention comparison endpoint not found. Please make sure the backend supports the /attention_comparison endpoint.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from attention comparison endpoint: ${response.status}`, errorText);
      throw new Error(`Failed to get attention comparison data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully received attention comparison data from backend');

    // Validate the data structure
    if (!data.before_attention || !data.after_attention) {
      throw new Error('Backend response is missing before_attention or after_attention field');
    }

    // Log the "before" and "after" tokens for debugging
    console.log(`Before tokens (${data.before_attention.tokens.length}): ${data.before_attention.tokens.map((t: { text: string }) => t.text).join(', ')}`);
    console.log(`After tokens (${data.after_attention.tokens.length}): ${data.after_attention.tokens.map((t: { text: string }) => t.text).join(', ')}`);

    // Add maskPredictions placeholders if not present
    if (!data.before_attention.maskPredictions) {
      data.before_attention.maskPredictions = [];
    }
    if (!data.after_attention.maskPredictions) {
      data.after_attention.maskPredictions = [];
    }

    return {
      before_attention: data.before_attention,
      after_attention: data.after_attention
    };
  } catch (error) {
    console.error('Error getting attention comparison data:', error);
    throw error;
  }
};

/**
 * Fetch attention data for a sentence using the specified model - 
 * an alias for getAttentionData with more consistent naming
 */
export const fetchAttentionData = async (
  params: {
    text: string;
    model_name: string;
    visualization_method?: 'raw' | 'rollout' | 'flow';
  }
): Promise<AttentionData> => {
  return getAttentionData(
    params.text,
    params.model_name,
    params.visualization_method || 'raw'
  );
};
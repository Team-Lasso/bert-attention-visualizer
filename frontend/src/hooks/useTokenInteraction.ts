import { useState, useCallback, useEffect } from "react";
import { AttentionData, WordPrediction } from "../types";
import { getMaskedPredictions } from "../services/modelService";

// Helper function to check if a token is a special token that should not be masked
const isSpecialToken = (tokenText: string): boolean => {
  // Handle BERT special tokens
  if (tokenText === '[CLS]' || tokenText === '[SEP]' || tokenText === '[PAD]' || 
      tokenText === '[UNK]' || tokenText === '[MASK]') {
    return true;
  }
  
  // Handle RoBERTa special tokens - RoBERTa uses HTML-like notation
  if (tokenText === '<s>' || tokenText === '</s>' || tokenText === '<pad>' || 
      tokenText === '<unk>' || tokenText === '<mask>') {
    return true;
  }

  // Handle any other obvious special tokens used by transformers
  if (tokenText.startsWith('[') && tokenText.endsWith(']')) {
    // Any other token enclosed in square brackets is likely a special token
    return true;
  }
  
  if (tokenText.startsWith('<') && tokenText.endsWith('>')) {
    // Any other token enclosed in angle brackets is likely a special token
    return true;
  }
  
  // The "Ġ" prefix in RoBERTa indicates the start of a word, not a special token
  // So we don't classify words starting with Ġ as special tokens
  
  return false;
};

// Helper function to identify content vs. function words (using heuristics, not hardcoded lists)
const isLikelyContentWord = (tokenText: string): boolean => {
  // Note: This is a frontend heuristic approach only. The backend uses NLTK for more accurate
  // function word identification with POS tagging and stopwords analysis.
  
  // Clean the token text
  const cleanText = tokenText.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
  
  // Empty or very short words are often function words
  if (!cleanText || cleanText.length <= 2) return false;
  
  // Most function words are short
  const isShort = cleanText.length <= 3;
  
  // Most function words are very common and don't contain unusual characters
  const hasUnusualChars = /[^a-z]/.test(cleanText);
  
  // Part of speech heuristics - many content words end with certain suffixes
  const hasContentSuffix = /([aeiou]tion|ment|ity|ance|ence|ism|ship|hood|ness|ing|er|or|ist|ant|ent|logy|graphy|[^aeious]y)$/.test(cleanText);
  
  // Basic heuristic: longer words with unusual chars or content suffixes are likely content words
  if (hasContentSuffix) return true;
  if (hasUnusualChars) return true;
  if (!isShort) return true;
  
  // Default to treating short, common words as function words
  return false;
};

/**
 * token interaction hook
 * responsible for managing token selection, masking and prediction
 */
export const useTokenInteraction = (currentData: AttentionData) => {
  // states
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [maskedTokenIndex, setMaskedTokenIndex] = useState<number | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [predictionResults, setPredictionResults] = useState<WordPrediction[] | null>(null);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string>("bert-base-uncased");

  // reset all states
  const resetTokenInteractions = useCallback(() => {
    setSelectedTokenIndex(null);
    setMaskedTokenIndex(null);
    setSelectedPrediction(null);
    setPredictionResults(null);
  }, []);

  // handle word masking
  const handleMaskWord = useCallback(
    async (tokenIndex: number, modelId: string = "bert-base-uncased") => {
      // Not allowed to mask if currentData or tokens are missing
      if (!currentData?.tokens || !currentData.tokens[tokenIndex]) {
        return;
      }
      
      // Not allowed to mask special tokens
      const tokenText = currentData.tokens[tokenIndex].text;
      console.log("tokenText", tokenText);
      //!: this is not special token here any more, do we still need this?
      if (isSpecialToken(tokenText)) {
        console.log(`Cannot mask special token: ${tokenText}`);
        return;
      }

      // Toggle the masked state
      if (maskedTokenIndex === tokenIndex) {
        // Unmasking
        setMaskedTokenIndex(null);
        setPredictionResults(null);
        setSelectedPrediction(null);
        return;
      }

      // Set masking
      setMaskedTokenIndex(tokenIndex);
      setSelectedPrediction(null);
      setCurrentModelId(modelId);

      // Get predictions from API - different approach based on model type
      setIsLoadingPredictions(true);
      try {
        // Filter out special tokens from the tokens array to get a clean list
        const filteredTokens = currentData.tokens.filter(token => !isSpecialToken(token.text));
        
        // Create sentence text from filtered tokens
        const text = filteredTokens.map(token => token.text).join(' ');
        
        // Create a mapping from original token indices to filtered token indices
        const originalToFilteredIndex = new Map<number, number>();
        let filteredIdx = 0;
        
        currentData.tokens.forEach((token, origIdx) => {
          if (!isSpecialToken(token.text)) {
            originalToFilteredIndex.set(origIdx, filteredIdx);
            filteredIdx++;
          }
        });
        
        // Get the actual filtered index we need to mask
        const filteredIndex = originalToFilteredIndex.get(tokenIndex);
        
        if (filteredIndex === undefined) {
          console.error("Could not map token index to filtered index");
          return;
        }
        
        console.log(`Masking token: "${tokenText}" at original index ${tokenIndex}, filtered index: ${filteredIndex}`);
        
        // For RoBERTa models, use the accurate index mapping
        if (modelId.includes('roberta')) {
          console.log(`Using RoBERTa masking with text: "${text}", filtered index: ${filteredIndex}, token: "${tokenText}"`);
          
          // Create a token to word mapping to ensure we mask the correct word
          const tokenToWordMap = new Map<number, number>();
          const words = text.split(' ');
          let currentWordIdx = 0;
          
          // Map each filtered token to its respective word in the sentence
          filteredTokens.forEach((token, idx) => {
            // Skip to the next word if necessary
            while (currentWordIdx < words.length) {
              const word = words[currentWordIdx];
              
              // If the current token appears in this word
              if (token.text === word || word.includes(token.text)) {
                tokenToWordMap.set(idx, currentWordIdx);
                currentWordIdx++; 
                break;
              }
              // Move to next word if we didn't find a match
              currentWordIdx++;
            }
          });
          
          // Get the word index for our token
          const wordIdx = tokenToWordMap.get(filteredIndex) || filteredIndex;
          console.log(`Token's word index in sentence: ${wordIdx}`);
          
          // For content words, add extra logging
          const isContent = isLikelyContentWord(tokenText);
          console.log(`Is '${tokenText}' a content word? ${isContent}`);
          
          // Explicitly create text with mask at the word level to avoid mismatches
          const wordsWithMask = [...words];
          wordsWithMask[wordIdx] = '[MASK]';
          const textWithExplicitMask = wordsWithMask.join(' ');
          
          console.log(`Sending explicit mask text: "${textWithExplicitMask}"`);
          console.log(`Using word index: ${wordIdx} for masking`);
          
          // Send the word index instead of token index for more reliable masking
          const predictions = await getMaskedPredictions(text, wordIdx, modelId);
          setPredictionResults(predictions);
        } 
        // For BERT models
        else {
          // BERT uses a more direct approach with the token-to-mask header
          console.log(`Using BERT masking with text: "${text}", filtered index: ${filteredIndex}, token: "${tokenText}"`);
          
          // For content words, add extra logging
          const isContent = isLikelyContentWord(tokenText);
          console.log(`Is '${tokenText}' a content word? ${isContent}`);
          
          const predictions = await getMaskedPredictions(text, filteredIndex, modelId);
          setPredictionResults(predictions);
        }
      } catch (error) {
        console.error("Error getting predictions:", error);
        setPredictionResults([]);
      } finally {
        setIsLoadingPredictions(false);
      }
    },
    [currentData?.tokens, maskedTokenIndex]
  );

  // handle word prediction selection
  const handleSelectPrediction = useCallback((word: string) => {
    setSelectedPrediction((prev) => (prev === word ? null : word));
  }, []);

  // listen to the global token selection event
  useEffect(() => {
    const handleTokenSelection = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && "tokenIndex" in customEvent.detail) {
        setSelectedTokenIndex(customEvent.detail.tokenIndex);
      }
    };

    window.addEventListener("token-selection-change", handleTokenSelection);

    return () => {
      window.removeEventListener("token-selection-change", handleTokenSelection);
    };
  }, []);

  // get the text of the selected token
  const selectedTokenText =
    selectedTokenIndex !== null && currentData?.tokens
      ? currentData.tokens[selectedTokenIndex].text
      : null;

  return {
    // states
    selectedTokenIndex,
    maskedTokenIndex,
    selectedPrediction,
    maskPredictions: predictionResults,
    selectedTokenText,
    isLoadingPredictions,
    currentModelId,

    // operation functions
    setSelectedTokenIndex,
    handleMaskWord,
    handleSelectPrediction,
    resetTokenInteractions,
    setCurrentModelId,
  };
};

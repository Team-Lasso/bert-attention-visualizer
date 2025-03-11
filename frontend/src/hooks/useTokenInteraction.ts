import { useState, useCallback, useEffect } from "react";
import { AttentionData, WordPrediction } from "../types";
import { getMaskedPredictions } from "../services/modelService";

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
      // Not allowed to mask special tokens
      if (
        !currentData?.tokens ||
        currentData.tokens[tokenIndex]?.text === "[CLS]" ||
        currentData.tokens[tokenIndex]?.text === "[SEP]"
      ) {
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

      // Get original sentence text from tokens (excluding special tokens)
      const sentenceTokens = currentData.tokens
        .filter(token => token.text !== "[CLS]" && token.text !== "[SEP]" && token.text !== "[PAD]")
        .map(token => token.text);
      
      // Create sentence text
      const text = sentenceTokens.join(' ');

      // Calculate the mask index (accounting for special tokens filtering)
      const maskedTokenPosition = tokenIndex;
      
      // Get predictions from API
      setIsLoadingPredictions(true);
      try {
        const predictions = await getMaskedPredictions(text, maskedTokenPosition, modelId);
        setPredictionResults(predictions);
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

import { useState, useCallback, useEffect } from "react";
import { AttentionData, WordPrediction } from "../types";

/**
 * token interaction hook
 * responsible for managing token selection, masking and prediction
 */
export const useTokenInteraction = (currentData: AttentionData) => {
  // states
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
    null
  );
  const [maskedTokenIndex, setMaskedTokenIndex] = useState<number | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(
    null
  );

  // reset all states
  const resetTokenInteractions = useCallback(() => {
    setSelectedTokenIndex(null); // set selectedTokenIndex to null
    setMaskedTokenIndex(null); // set maskedTokenIndex to null
    setSelectedPrediction(null); // set selectedPrediction to null
  }, []);

  // handle word masking
  const handleMaskWord = useCallback(
    // the user will pass a tokenIndex, which represents the index of the token to be masked
    (tokenIndex: number) => {
      // not allowed to mask special tokens
      if (
        currentData?.tokens[tokenIndex]?.text === "[CLS]" ||
        currentData?.tokens[tokenIndex]?.text === "[SEP]"
      ) {
        return;
      }

      // toggle the masked state
      setMaskedTokenIndex((prevIndex) =>
        prevIndex === tokenIndex ? null : tokenIndex
      );

      // reset the prediction selection
      setSelectedPrediction(null);
    },
    [currentData?.tokens]
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
      window.removeEventListener(
        "token-selection-change",
        handleTokenSelection
      );
    };
  }, []);

  // get the prediction results based on the masked token
  const maskPredictions: WordPrediction[] | null =
    maskedTokenIndex !== null && currentData?.maskPredictions
      ? currentData.maskPredictions.find(
          (mp) => mp.tokenIndex === maskedTokenIndex
        )?.predictions || null
      : null;

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
    maskPredictions,
    selectedTokenText,

    // operation functions
    setSelectedTokenIndex,
    handleMaskWord,
    handleSelectPrediction,
    resetTokenInteractions,
  };
};

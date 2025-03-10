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
      //这个prevIndex是maskedTokenIndex的值，在第一次调用时，prevIndex为null
      //但是我们会不停的更新prevIndex的值
      //如果prevIndex的值和tokenIndex的值相等，则将maskedTokenIndex设置为null 这表示用户没有选择任何token
      //如果prevIndex的值和tokenIndex的值不相等，则将maskedTokenIndex设置为tokenIndex 这表示用户选择了这个token
      setMaskedTokenIndex((prevIndex) =>
        prevIndex === tokenIndex ? null : tokenIndex
      );

      // reset the prediction selection
      //清空是为了避免用户选择了一个token，但是之前的prediction还在
      setSelectedPrediction(null);
      
      //todo:这里我们需要调用fill-mask和prediction之类的。
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

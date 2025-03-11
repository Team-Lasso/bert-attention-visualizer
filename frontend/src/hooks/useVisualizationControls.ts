import { useState, useCallback } from "react";
import { AttentionData, WordAttentionData } from "../types";

/**
 * visualization control hook
 * responsible for managing visualization views, layers and attention heads
 */
export const useVisualizationControls = (currentData: AttentionData) => {
  // states
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [activeView, setActiveView] = useState<"matrix" | "parallel">(
    "parallel"
  );

  // get the current layer data
  const currentLayerData = currentData?.layers[selectedLayer];

  // get the current head data
  const currentHeadData = currentLayerData?.heads[selectedHead];

  // view switch
  const switchView = useCallback((view: "matrix" | "parallel") => {
    setActiveView(view);
  }, []);

  // calculate the attention data of the selected token
  const getWordAttentionData = useCallback(
    (selectedTokenIndex: number | null): WordAttentionData => {
      if (selectedTokenIndex === null || !currentData || !currentHeadData) {
        return {
          sourceWord: "",
          targetWords: [],
          attentionValues: [],
        };
      }

      return {
        sourceWord: currentData.tokens[selectedTokenIndex].text,
        targetWords: currentData.tokens.map((token) => token.text),
        attentionValues: currentHeadData.attention[selectedTokenIndex],
      };
    },
    [currentData, currentHeadData]
  );

  // reset the view state to the default value
  const resetViewState = useCallback(() => {
    setSelectedLayer(0);
    setSelectedHead(0);
    setActiveView("parallel");
  }, []);

  return {
    // states
    selectedLayer,
    selectedHead,
    activeView,
    currentLayerData,
    currentHeadData,

    // operation functions
    setSelectedLayer,
    setSelectedHead,
    switchView: setActiveView,
    getWordAttentionData,
    resetViewState,
  };
};

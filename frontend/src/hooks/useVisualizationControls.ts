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
  const [activeView, setActiveView] = useState<"matrix" | "parallel">("parallel");

  // Get the current layer data safely
  const hasLayers = currentData?.layers && currentData.layers.length > 0;
  
  // get the current layer data - safely handle missing data
  const currentLayerData = hasLayers 
    ? currentData.layers[Math.min(selectedLayer, currentData.layers.length - 1)]
    : undefined;

  // get the current head data - safely handle missing data
  const hasHeads = currentLayerData?.heads && currentLayerData.heads.length > 0;
  const currentHeadData = hasHeads 
    ? currentLayerData.heads[Math.min(selectedHead, currentLayerData.heads.length - 1)]
    : undefined;

  // view switch function - renamed to match its exported name
  const switchView = useCallback((view: "matrix" | "parallel") => {
    setActiveView(view);
  }, []);

  // calculate the attention data of the selected token
  const getWordAttentionData = useCallback(
    (selectedTokenIndex: number | null): WordAttentionData => {
      // If any required data is missing, return empty data
      if (
        selectedTokenIndex === null || 
        !currentData || 
        !currentHeadData || 
        !currentData.tokens || 
        selectedTokenIndex >= currentData.tokens.length
      ) {
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
    switchView,  // Use the renamed function directly
    getWordAttentionData,
    resetViewState,
  };
};

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
        selectedTokenIndex >= currentData.tokens.length ||
        !currentHeadData.attention ||
        !currentHeadData.attention[selectedTokenIndex]
      ) {
        return {
          sourceWord: "",
          targetWords: [],
          attentionValues: [],
        };
      }

      // Get the raw attention values for the selected token
      const rawAttentionValues = currentHeadData.attention[selectedTokenIndex];
      const tokenCount = currentData.tokens.length;

      // Make sure we only process indices that have corresponding tokens
      // Some models might have attention matrices with different dimensions than the token count
      const validIndices = rawAttentionValues
        .map((_, index) => index)
        .filter(index => index < tokenCount);

      // Create data array with indices for filtering and normalization (only for valid indices)
      const attentionData = validIndices.map(index => ({
        value: rawAttentionValues[index],
        token: currentData.tokens[index].text,
        index
      }));

      // Calculate the sum of attention values for normalization
      // This ensures the values will properly add up to 100%
      const attentionSum = attentionData.reduce((sum, item) => sum + item.value, 0);

      // Normalize attention values relative to the sum
      const normalizedData = attentionData.map(item => ({
        ...item,
        value: attentionSum > 0 ? item.value / attentionSum : 0
      }));

      // Get the source word safely
      const sourceWord = selectedTokenIndex < tokenCount
        ? currentData.tokens[selectedTokenIndex].text
        : "Unknown";

      return {
        sourceWord,
        targetWords: normalizedData.map(item => item.token),
        attentionValues: normalizedData.map(item => item.value),
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

import { useState, useCallback, useMemo } from "react";
import { AttentionData, WordAttentionData } from "../types";

/**
 * Calculates the average attention values for a specific layer across all heads
 */
const calculateAverageAttentionForLayer = (attentionData: AttentionData, layerIndex: number): number[][] => {
  if (!attentionData?.layers?.length || layerIndex >= attentionData.layers.length) return [];

  const layer = attentionData.layers[layerIndex];
  const headCount = layer.heads.length;
  const tokenCount = attentionData.tokens.length;

  // Initialize empty matrix for the average attention
  const averageAttention: number[][] = Array(tokenCount)
    .fill(null)
    .map(() => Array(tokenCount).fill(0));

  // Skip if no heads
  if (headCount === 0) return averageAttention;

  // Calculate average across all heads for this layer
  for (let headIdx = 0; headIdx < headCount; headIdx++) {
    const head = layer.heads[headIdx];

    // For each position in the attention matrix
    for (let i = 0; i < tokenCount; i++) {
      for (let j = 0; j < tokenCount; j++) {
        // Add to the sum (handle missing data)
        const attentionValue = head.attention[i]?.[j] || 0;
        averageAttention[i][j] += attentionValue / headCount;
      }
    }
  }

  return averageAttention;
};

/**
 * visualization control hook
 * responsible for managing visualization views, layers and attention heads
 */
export const useVisualizationControls = (currentData: AttentionData) => {
  // states
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [activeView, setActiveView] = useState<"matrix" | "parallel">("parallel");
  const [showAverageAttention, setShowAverageAttention] = useState(false);
  const [tokenVisibility, setTokenVisibility] = useState({
    // Special tokens
    cls: true, // [CLS] for BERT/DistilBERT/TinyBERT
    sep: true, // [SEP] for BERT/DistilBERT/TinyBERT
    s_token: true, // <s> for RoBERTa
    _s_token: true, // </s> for RoBERTa
    pad: true, // padding tokens for all models
    
    // Punctuation
    period: true, // periods (.)
    comma: true, // commas (,)
    exclamation: true, // exclamation marks (!)
    question: true, // question marks (?)
    semicolon: true, // semicolons (;)
    colon: true, // colons (:)
    apostrophe: true, // apostrophes (')
    quote: true, // quotation marks (" ")
    parentheses: true, // parentheses (( ))
    dash: true, // dashes (—)
    hyphen: true, // hyphens (-)
    ellipsis: true, // ellipses (...)
  });

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

  // Calculate average attention for the current layer when needed
  const averageAttentionForCurrentLayer = useMemo(() => {
    if (!showAverageAttention || !currentData) return null;
    return calculateAverageAttentionForLayer(currentData, selectedLayer);
  }, [showAverageAttention, currentData, selectedLayer]);

  // Get the appropriate attention data for the current view mode
  const attentionDataForCurrentView = useMemo(() => {
    if (showAverageAttention && averageAttentionForCurrentLayer) {
      return {
        headIndex: -1, // Use -1 to indicate this is averaged data
        attention: averageAttentionForCurrentLayer,
      };
    } else if (currentHeadData) {
      return {
        ...currentHeadData,
        headIndex: selectedHead
      };
    } else {
      // Return a fallback with empty data but valid structure
      return {
        headIndex: selectedHead,
        attention: []
      };
    }
  }, [showAverageAttention, averageAttentionForCurrentLayer, currentHeadData, selectedHead]);

  // view switch function - renamed to match its exported name
  const switchView = useCallback((view: "matrix" | "parallel") => {
    setActiveView(view);
  }, []);

  // toggle average attention view
  const toggleAverageAttention = useCallback(() => {
    setShowAverageAttention((prev) => !prev);
  }, []);

  // Replace single toggle with individual toggle functions
  const toggleTokenVisibility = useCallback((tokenType: keyof typeof tokenVisibility) => {
    setTokenVisibility(prev => ({
      ...prev,
      [tokenType]: !prev[tokenType]
    }));
  }, []);

  // For backward compatibility with existing code
  const hideSpecialTokens = useMemo(() => {
    return !tokenVisibility.cls || !tokenVisibility.sep || 
           !tokenVisibility.s_token || !tokenVisibility._s_token || 
           !tokenVisibility.period || !tokenVisibility.pad;
  }, [tokenVisibility]);

  // Filter out special tokens based on tokenVisibility settings
  const filteredTokens = useMemo(() => {
    if (!currentData?.tokens) {
      return [];
    }

    return currentData.tokens
      .filter((token) => {
        const text = token.text;
        
        // Check special tokens against visibility settings
        if ((text === "[CLS]") && !tokenVisibility.cls) return false;
        if ((text === "[SEP]") && !tokenVisibility.sep) return false;
        if ((text === "<s>") && !tokenVisibility.s_token) return false;
        if ((text === "</s>") && !tokenVisibility._s_token) return false;
        if ((text === "[PAD]" || text === "<pad>") && !tokenVisibility.pad) return false;
        
        // Check punctuation against visibility settings
        // Only filter standalone punctuation tokens
        if (text === "." && !tokenVisibility.period) return false;
        if (text === "," && !tokenVisibility.comma) return false;
        if (text === "!" && !tokenVisibility.exclamation) return false;
        if (text === "?" && !tokenVisibility.question) return false;
        if (text === ";" && !tokenVisibility.semicolon) return false;
        if (text === ":" && !tokenVisibility.colon) return false;
        if (text === "'" && !tokenVisibility.apostrophe) return false;
        if ((text === "\"" || text === "\"") && !tokenVisibility.quote) return false;
        if ((text === "(" || text === ")") && !tokenVisibility.parentheses) return false;
        if (text === "—" && !tokenVisibility.dash) return false;
        if (text === "-" && !tokenVisibility.hyphen) return false;
        if (text === "..." && !tokenVisibility.ellipsis) return false;
        
        return true;
      })
      .map((token, index) => ({
        ...token,
        index, // reassign indices after filtering
        originalIndex: index // keep original index for reference
      }));
  }, [currentData?.tokens, tokenVisibility]);

  // Get filtered attention matrix based on filtered tokens
  const filteredAttentionData = useMemo(() => {
    if ((!hideSpecialTokens) || !attentionDataForCurrentView || !currentData?.tokens) {
      return attentionDataForCurrentView;
    }

    // Get indices of tokens to keep based on visibility settings
    const keepIndices = currentData.tokens.map((token, i) => {
      const text = token.text;
      
      // Check special tokens against visibility settings
      if ((text === "[CLS]") && !tokenVisibility.cls) return -1;
      if ((text === "[SEP]") && !tokenVisibility.sep) return -1;
      if ((text === "<s>") && !tokenVisibility.s_token) return -1;
      if ((text === "</s>") && !tokenVisibility._s_token) return -1;
      if ((text === "[PAD]" || text === "<pad>") && !tokenVisibility.pad) return -1;
      
      // Check punctuation against visibility settings
      // Only filter standalone punctuation tokens
      if (text === "." && !tokenVisibility.period) return -1;
      if (text === "," && !tokenVisibility.comma) return -1;
      if (text === "!" && !tokenVisibility.exclamation) return -1;
      if (text === "?" && !tokenVisibility.question) return -1;
      if (text === ";" && !tokenVisibility.semicolon) return -1;
      if (text === ":" && !tokenVisibility.colon) return -1;
      if (text === "'" && !tokenVisibility.apostrophe) return -1;
      if ((text === "\"" || text === "\"") && !tokenVisibility.quote) return -1;
      if ((text === "(" || text === ")") && !tokenVisibility.parentheses) return -1;
      if (text === "—" && !tokenVisibility.dash) return -1;
      if (text === "-" && !tokenVisibility.hyphen) return -1;
      if (text === "..." && !tokenVisibility.ellipsis) return -1;
      
      return i;
    }).filter(i => i !== -1);

    // Create a mapping from original indices to new indices
    const indexMap = new Map();
    keepIndices.forEach((originalIdx, newIdx) => {
      indexMap.set(originalIdx, newIdx);
    });

    // Filter the attention matrix
    const filteredAttention: number[][] = [];
    keepIndices.forEach(srcIdx => {
      const srcRow = attentionDataForCurrentView.attention[srcIdx];
      if (!srcRow) return;

      const filteredRow: number[] = [];
      keepIndices.forEach(tgtIdx => {
        filteredRow.push(srcRow[tgtIdx] || 0);
      });

      filteredAttention.push(filteredRow);
    });

    return {
      ...attentionDataForCurrentView,
      attention: filteredAttention
    };
  }, [hideSpecialTokens, attentionDataForCurrentView, currentData?.tokens, tokenVisibility]);

  // calculate the attention data of the selected token
  const getWordAttentionData = useCallback(
    (selectedTokenIndex: number | null): WordAttentionData => {
      // If any required data is missing, return empty data
      if (
        selectedTokenIndex === null ||
        !currentData ||
        !attentionDataForCurrentView ||
        !currentData.tokens ||
        !attentionDataForCurrentView.attention
      ) {
        return {
          sourceWord: "",
          targetWords: [],
          attentionValues: [],
        };
      }

      // Handle the case when we're hiding special tokens
      if (hideSpecialTokens) {
        // Find the actual token we're working with from the filtered tokens
        const filteredTokenIdx = filteredTokens.findIndex(token => token.index === selectedTokenIndex);

        // If we can't find the selected token in the filtered list, return empty data
        if (filteredTokenIdx === -1) {
          return {
            sourceWord: "",
            targetWords: [],
            attentionValues: [],
          };
        }

        // Get the raw attention row for this token from the filtered attention data
        const rawAttentionValues = filteredAttentionData.attention[filteredTokenIdx];
        if (!rawAttentionValues) {
          return {
            sourceWord: "",
            targetWords: [],
            attentionValues: [],
          };
        }

        // Use the filtered tokens for target tokens
        const targetTokens = filteredTokens;

        // Create data array for filtering and normalization
        const attentionData = targetTokens.map((token, idx) => ({
          value: rawAttentionValues[idx] || 0,
          token: token.text,
          index: token.index
        }));

        // Calculate sum for normalization
        const attentionSum = attentionData.reduce((sum, item) => sum + item.value, 0);

        // Normalize values
        const normalizedData = attentionData.map(item => ({
          ...item,
          value: attentionSum > 0 ? item.value / attentionSum : 0
        }));

        // Get source word
        const sourceWord = filteredTokens[filteredTokenIdx]?.text || "Unknown";

        return {
          sourceWord,
          targetWords: normalizedData.map(item => item.token),
          attentionValues: normalizedData.map(item => item.value),
        };
      }
      // Handle the regular case (no filtering)
      else {
        // Get the raw attention values for the selected token
        const rawAttentionValues = attentionDataForCurrentView.attention[selectedTokenIndex];
        if (!rawAttentionValues) {
          return {
            sourceWord: "",
            targetWords: [],
            attentionValues: [],
          };
        }

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
      }
    },
    [
      currentData,
      attentionDataForCurrentView,
      hideSpecialTokens,
      filteredTokens,
      filteredAttentionData
    ]
  );

  // Reset view state function
  const resetViewState = useCallback(() => {
    setSelectedLayer(0);
    setSelectedHead(0);
    setActiveView("parallel");
    setShowAverageAttention(false);
    // Reset token visibility to show all tokens
    setTokenVisibility({
      cls: true,
      sep: true,
      s_token: true,
      _s_token: true,
      period: true,
      pad: true,
      comma: true,
      exclamation: true,
      question: true,
      semicolon: true,
      colon: true,
      apostrophe: true,
      quote: true,
      parentheses: true,
      dash: true,
      hyphen: true,
      ellipsis: true,
    });
  }, []);

  return {
    // states
    selectedLayer,
    selectedHead,
    activeView,
    currentLayerData,
    currentHeadData,
    showAverageAttention,
    tokenVisibility,
    hideSpecialTokens,
    attentionDataForCurrentView: filteredAttentionData,
    filteredTokens,

    // operation functions
    setSelectedLayer,
    setSelectedHead,
    switchView,
    toggleAverageAttention,
    toggleTokenVisibility,
    toggleHideSpecialTokens: () => {
      // For backward compatibility, toggle all token types at once
      const allHidden = !tokenVisibility.cls && !tokenVisibility.sep && 
                        !tokenVisibility.s_token && !tokenVisibility._s_token && 
                        !tokenVisibility.period && !tokenVisibility.pad &&
                        !tokenVisibility.comma && !tokenVisibility.exclamation &&
                        !tokenVisibility.question && !tokenVisibility.semicolon &&
                        !tokenVisibility.colon && !tokenVisibility.apostrophe &&
                        !tokenVisibility.quote && !tokenVisibility.parentheses &&
                        !tokenVisibility.dash && !tokenVisibility.hyphen &&
                        !tokenVisibility.ellipsis;
      
      setTokenVisibility({
        cls: allHidden,
        sep: allHidden,
        s_token: allHidden,
        _s_token: allHidden,
        period: allHidden,
        pad: allHidden,
        comma: allHidden,
        exclamation: allHidden,
        question: allHidden,
        semicolon: allHidden,
        colon: allHidden,
        apostrophe: allHidden,
        quote: allHidden,
        parentheses: allHidden,
        dash: allHidden,
        hyphen: allHidden,
        ellipsis: allHidden,
      });
    },
    getWordAttentionData,
    resetViewState,
  };
};

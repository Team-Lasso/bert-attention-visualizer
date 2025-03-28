import { useCallback, useEffect } from "react";
import { SampleData } from "../types";
import { useModelSelection } from "./useModelSelection";
import { useDatasetManager } from "./useDatasetManager";
import { useTokenInteraction } from "./useTokenInteraction";
import { useVisualizationControls } from "./useVisualizationControls";
import { useAttentionComparison } from "./useAttentionComparison";
import { tokenizeText } from "../services/modelService";

/**
 * Main hook that integrates other hooks to provide complete attention visualization functionality
 */
const useAttentionVisualizer = (initialDatasets: SampleData[]) => {
  // Load the dataset manager hook
  const datasetManager = useDatasetManager(initialDatasets);
  const { currentData, hasUserInput, currentModelId, setCurrentModelId, currentSentence } = datasetManager;

  // Load the model selection hook
  const modelSelection = useModelSelection();

  // When model changes, update the current model ID in the dataset manager
  useEffect(() => {
    setCurrentModelId(modelSelection.selectedModelId);
  }, [modelSelection.selectedModelId, setCurrentModelId]);

  // Load the token interaction hook
  const tokenInteraction = useTokenInteraction(currentData);

  // When model changes, update the token interaction hook's model ID
  useEffect(() => {
    tokenInteraction.setCurrentModelId(modelSelection.selectedModelId);
  }, [modelSelection.selectedModelId, tokenInteraction.setCurrentModelId]);

  // Load the visualization control hook
  const visualizationControls = useVisualizationControls(currentData);

  // Load the attention comparison hook
  const attentionComparison = useAttentionComparison();

  // Handle the reset operation after the model is loaded
  const handleLoadModel = useCallback(() => {
    modelSelection.handleLoadModel(() => {
      // Reset the token interaction and visualization control state
      tokenInteraction.resetTokenInteractions();
      visualizationControls.resetViewState();
      // Also exit comparison mode if active
      if (attentionComparison.isComparing) {
        attentionComparison.exitComparison();
      }
    });
  }, [
    modelSelection.handleLoadModel,
    tokenInteraction.resetTokenInteractions,
    visualizationControls.resetViewState,
    attentionComparison
  ]);

  // Handle the sentence submission - now passes modelId
  const handleSentenceSubmit = useCallback(
    (sentence: string) => {
      if (!sentence.trim()) return;

      // Exit comparison mode if active
      if (attentionComparison.isComparing) {
        attentionComparison.exitComparison();
      }

      // Use the currently selected model for processing
      datasetManager.handleSentenceSubmit(
        sentence,
        () => tokenInteraction.resetTokenInteractions(),
        modelSelection.selectedModelId
      );
    },
    [
      datasetManager.handleSentenceSubmit,
      tokenInteraction.resetTokenInteractions,
      modelSelection.selectedModelId,
      attentionComparison
    ]
  );

  // Handle the mask word operation - now passes modelId
  const handleMaskWord = useCallback(
    (tokenIndex: number) => {
      // Exit comparison mode if active
      if (attentionComparison.isComparing) {
        attentionComparison.exitComparison();
      }

      tokenInteraction.handleMaskWord(tokenIndex, modelSelection.selectedModelId);
    },
    [tokenInteraction.handleMaskWord, modelSelection.selectedModelId, attentionComparison]
  );

  // Handle the view attention comparison operation
  const handleViewAttentionComparison = useCallback(() => {
    if (!tokenInteraction.maskedTokenIndex || !tokenInteraction.selectedPrediction) {
      return;
    }

    // Get the original text being analyzed
    const text = datasetManager.currentSentence || '';
    if (!text) return;

    // Start the comparison with the selected prediction
    attentionComparison.startComparison(
      text,
      tokenInteraction.maskedTokenIndex,
      tokenInteraction.selectedPrediction,
      modelSelection.selectedModelId
    );
  }, [
    tokenInteraction.maskedTokenIndex,
    tokenInteraction.selectedPrediction,
    datasetManager.currentSentence,
    attentionComparison.startComparison,
    modelSelection.selectedModelId
  ]);

  // Calculate the attention data of the selected token
  const wordAttentionData = visualizationControls.getWordAttentionData(
    tokenInteraction.selectedTokenIndex
  );

  // Generate the tokens array for visualization
  const tokensWithIndex = currentData?.tokens.map((token, index) => ({
    ...token,
    index,
  })) || [];

  return {
    // dataset manager
    ...datasetManager,

    // model selection
    ...modelSelection,

    // token interaction
    ...tokenInteraction,

    // Override the handle mask word with our version that includes model ID
    handleMaskWord,

    // visualization control
    ...visualizationControls,

    // attention comparison
    ...attentionComparison,
    handleViewAttentionComparison,

    // combine the functionality and calculation properties
    currentModel: modelSelection.currentModel,
    wordAttentionData,
    tokensWithIndex,
    handleLoadModel,
    handleSentenceSubmit,
    currentSentence,
  };
};

export default useAttentionVisualizer;

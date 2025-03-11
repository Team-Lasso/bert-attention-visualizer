import { useCallback, useEffect } from "react";
import { SampleData } from "../types";
import { useModelSelection } from "./useModelSelection";
import { useDatasetManager } from "./useDatasetManager";
import { useTokenInteraction } from "./useTokenInteraction";
import { useVisualizationControls } from "./useVisualizationControls";
import { tokenizeText } from "../services/modelService";

/**
 * Main hook that integrates other hooks to provide complete attention visualization functionality
 */
const useAttentionVisualizer = (initialDatasets: SampleData[]) => {
  // Load the dataset manager hook
  const datasetManager = useDatasetManager(initialDatasets);
  const { currentData, hasUserInput, currentModelId, setCurrentModelId } = datasetManager;

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

  // Handle the reset operation after the model is loaded
  const handleLoadModel = useCallback(() => {
    modelSelection.handleLoadModel(() => {
      // Reset the token interaction and visualization control state
      tokenInteraction.resetTokenInteractions();
      visualizationControls.resetViewState();
    });
  }, [
    modelSelection.handleLoadModel,
    tokenInteraction.resetTokenInteractions,
    visualizationControls.resetViewState,
  ]);

  // Handle the sentence submission - now passes modelId
  const handleSentenceSubmit = useCallback(
    (sentence: string) => {
      if (!sentence.trim()) return;
      
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
      modelSelection.selectedModelId
    ]
  );
  
  // Handle the mask word operation - now passes modelId
  const handleMaskWord = useCallback(
    (tokenIndex: number) => {
      tokenInteraction.handleMaskWord(tokenIndex, modelSelection.selectedModelId);
    },
    [tokenInteraction.handleMaskWord, modelSelection.selectedModelId]
  );

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

    // combine the functionality and calculation properties
    currentModel: modelSelection.currentModel,
    wordAttentionData,
    tokensWithIndex,
    handleLoadModel,
    handleSentenceSubmit,
  };
};

export default useAttentionVisualizer;

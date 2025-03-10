import { useCallback, useEffect } from "react";
import { SampleData, WordAttentionData } from "../types";
import { useModelSelection } from "./useModelSelection";
import { useDatasetManager } from "./useDatasetManager";
import { useTokenInteraction } from "./useTokenInteraction";
import { useVisualizationControls } from "./useVisualizationControls";

/**
 * main hook, integrate other small hooks
 * provide complete attention visualization functionality
 */
const useAttentionVisualizer = (initialDatasets: SampleData[]) => {
  // load the dataset manager hook
  const datasetManager = useDatasetManager(initialDatasets);
  const { currentData, hasUserInput } = datasetManager; //this contains the currentData and hasUserInput

  // load the model selection hook
  const modelSelection = useModelSelection();

  // load the token interaction hook
  const tokenInteraction = useTokenInteraction(currentData);

  // load the visualization control hook
  const visualizationControls = useVisualizationControls(currentData);

  // handle the reset operation after the model is loaded
  const handleLoadModel = useCallback(() => {
    modelSelection.handleLoadModel(() => {
      // reset the token interaction and visualization control state
      tokenInteraction.resetTokenInteractions();
      visualizationControls.resetViewState();
    });
  }, [
    modelSelection.handleLoadModel,
    tokenInteraction.resetTokenInteractions,
    visualizationControls.resetViewState,
  ]);

  // handle the sentence submission
  // in the previous analysis, we know that handleSentenceSubmit is used to handle the user's input sentence
  // the onDatasetAdded is an optional parameter, the default value is an empty function
  // we here pass tokenInteraction.resetTokenInteractions to onDatasetAdded
  // so, when the user inputs a sentence, tokenInteraction.resetTokenInteractions will be called
  // then, tokenInteraction.resetTokenInteractions will reset the token interaction state

  const handleSentenceSubmit = useCallback(
    (sentence: string) => {
      datasetManager.handleSentenceSubmit(sentence, () => {
        // reset the token related state
        tokenInteraction.resetTokenInteractions(); 
      });
    },
    [
      datasetManager.handleSentenceSubmit,
      tokenInteraction.resetTokenInteractions,
    ]
  );

  // calculate the attention data of the selected token
  const wordAttentionData: WordAttentionData =
    visualizationControls.getWordAttentionData(
      tokenInteraction.selectedTokenIndex
    );

  // generate the tokens array for visualization
  const tokensWithIndex =
    currentData?.tokens.map((token, index) => ({
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

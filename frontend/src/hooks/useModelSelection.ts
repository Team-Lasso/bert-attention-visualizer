import { useState, useCallback } from "react";
import { pretrainedModels } from "../data/pretrainedModels";
import { ModelConfig } from "../types";

/**
 * model selection and loading hook
 * responsible for managing model selection, loading state and display state
 */
export const useModelSelection = () => {
  // states
  const [selectedModelId, setSelectedModelId] =
    useState<string>("bert-base-uncased");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // get the current model information
  const currentModel =
    pretrainedModels.find(
      (model: ModelConfig) => model.id === selectedModelId
    ) || pretrainedModels[0];

  // model selection processing
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
  }, []);

  // model loading processing
  const handleLoadModel = useCallback((onModelLoaded: () => void) => {
    setIsModelLoading(true);

    // simulate the loading delay (in the actual project, this will have the real model loading logic) //todo: split the sentence into token features
    setTimeout(() => {
      setIsModelLoading(false);
      setShowModelSelector(false);

      // call the callback function after the model is loaded
      onModelLoaded();
    }, 1500);
  }, []);

  // toggle the model selector display state
  const toggleModelSelector = useCallback(() => {
    setShowModelSelector((prev) => !prev);
  }, []);

  return {
    // states
    selectedModelId,
    isModelLoading,
    showModelSelector,
    currentModel,

    // operation functions
    handleModelSelect,
    handleLoadModel,
    toggleModelSelector,
    setShowModelSelector,
  };
};

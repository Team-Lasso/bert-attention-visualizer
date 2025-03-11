import { useState, useCallback, useEffect } from "react";
import { pretrainedModels } from "../data/pretrainedModels";
import { ModelConfig } from "../types";
import { fetchAvailableModels } from "../services/modelService";

/**
 * model selection and loading hook
 * responsible for managing model selection, loading state and display state
 */
export const useModelSelection = () => {
  // states
  const [selectedModelId, setSelectedModelId] = useState<string>("bert-base-uncased");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>(pretrainedModels);

  // Load available models from API on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await fetchAvailableModels();
        if (models && models.length > 0) {
          setAvailableModels(models);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        // Fallback to default models
        setAvailableModels(pretrainedModels.filter(model => 
          ['bert-base-uncased', 'roberta-base'].includes(model.id)
        ));
      }
    };

    loadModels();
  }, []);

  // get the current model information
  const currentModel =
    availableModels.find(
      (model: ModelConfig) => model.id === selectedModelId
    ) || availableModels[0];

  // model selection processing
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
  }, []);

  // model loading processing
  const handleLoadModel = useCallback((onModelLoaded: () => void) => {
    setIsModelLoading(true);

    // Simulate brief loading time (this would be real loading in production)
    setTimeout(() => {
      setIsModelLoading(false);
      setShowModelSelector(false);

      // call the callback function after the model is loaded
      onModelLoaded();
    }, 500);
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
    availableModels,

    // operation functions
    handleModelSelect,
    handleLoadModel,
    toggleModelSelector,
    setShowModelSelector,
  };
};

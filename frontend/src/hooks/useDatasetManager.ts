import { useState, useCallback } from "react";
import { SampleData, AttentionData } from "../types";
import { getAttentionData } from "../services/modelService";

// Create empty attention data structure for initial state
const emptyAttentionData: AttentionData = {
  tokens: [],
  layers: [],
  maskPredictions: []
};

/**
 * dataset manager hook
 * responsible for managing the dataset, processing sentence input and updating related states
 */
export const useDatasetManager = (initialDatasets: SampleData[]) => {
  // states
  const [datasets, setDatasets] = useState<SampleData[]>(initialDatasets);
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDatasetCount, setCustomDatasetCount] = useState(0);
  const [currentModelId, setCurrentModelId] = useState<string>("bert-base-uncased");

  // get the current data
  // Use empty attention data if there's no selected dataset
  const currentData: AttentionData = datasets[selectedDatasetIndex]?.data || emptyAttentionData;

  // sentence submission processing
  const handleSentenceSubmit = useCallback(
    async (sentence: string, onDatasetAdded: () => void = () => {}, modelId: string = "bert-base-uncased") => {
      if (!sentence.trim()) return;
      
      setIsProcessing(true);
      setCurrentModelId(modelId);

      try {
        // Use the API to get real attention data
        const attentionData = await getAttentionData(sentence, modelId);
        
        const newDatasetName = `Custom ${customDatasetCount + 1}: "${
          sentence.length > 30 ? sentence.substring(0, 27) + "..." : sentence
        }"`;

        // Add the dataset to the datasets
        setDatasets((prev) => [
          ...prev,
          {
            name: newDatasetName,
            data: attentionData,
          },
        ]);

        // Update customDatasetCount and selectedDatasetIndex
        setCustomDatasetCount((prev) => prev + 1);
        setSelectedDatasetIndex(datasets.length);
        
        // Call the callback function
        onDatasetAdded();
      } catch (error) {
        console.error("Error processing sentence:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [datasets.length, customDatasetCount]
  );

  // switch the dataset
  const selectDataset = useCallback(
    (index: number) => {
      if (index >= 0 && index < datasets.length) {
        setSelectedDatasetIndex(index);
      }
    },
    [datasets.length]
  );

  // check if there is a user input sentence (not the initial sample data)
  const hasUserInput = datasets.length > 0 && selectedDatasetIndex >= initialDatasets.length;

  return {
    // states
    datasets,
    selectedDatasetIndex,
    isProcessing,
    customDatasetCount,
    currentData,
    hasUserInput,
    currentModelId,

    // operation functions
    handleSentenceSubmit,
    selectDataset,
    setSelectedDatasetIndex,
    setCurrentModelId,
  };
};

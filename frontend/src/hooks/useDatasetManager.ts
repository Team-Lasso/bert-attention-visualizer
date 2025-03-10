import { useState, useCallback } from "react";
import { generateAttentionData } from "../data/sampleData";
import { SampleData, AttentionData } from "../types";

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

  // get the current data
  //AttentionData is the type defined in AttentionVisualizer.ts
  
  const currentData: AttentionData = datasets[selectedDatasetIndex]?.data;

  // sentence submission processing
  // called in useAttentionVisualizer.ts
  // this function is used to handle the user's input sentence
  const handleSentenceSubmit = useCallback(
    // use callback, avoid creating a new function on each render
    // on the parameter, onDatasetAdded is an optional parameter, the default value is an empty function
    // sentence is the user's input sentence
    (sentence: string, onDatasetAdded: () => void = () => {}) => {
      setIsProcessing(true); // set the isProcessing state to true

      // simulate the processing delay (in the actual project, this will call the API to get the real data) //todo: split the sentence into token features
      setTimeout(() => {
        const newAttentionData = generateAttentionData(sentence);
        const newDatasetName = `Custom ${customDatasetCount + 1}: "${
          sentence.length > 30 ? sentence.substring(0, 27) + "..." : sentence
        }"`; //? what's the point for having this? we are fully front-end, we don't need to count the number of user input

        // add the dataset to the datasets
        // add {name: newDatasetName, data: newAttentionData} to the datasets
        // the ...prev represents copying all the data in datasets and then adding a new data
        setDatasets((prev) => [
          ...prev,
          {
            name: newDatasetName,
            data: newAttentionData,
          },
        ]);

        // update customDatasetCount to +1, this is to record the number of user inputs
        setCustomDatasetCount((prev) => prev + 1); //? what's the point for having this? we are fully front-end, we don't need to count the number of user input

        // update selectedDatasetIndex to the length of datasets, this is to record the number of user inputs
        setSelectedDatasetIndex(datasets.length); //? what's the point for having this? we are fully front-end, we don't need to count the number of user input

        // now, the dataset has been updated, set the isProcessing state to false
        setIsProcessing(false);

        // call the callback function, but here, onDatasetAdded is an empty function, the real function depends on the handleSentenceSubmit in useAttentionVisualizer.ts
        onDatasetAdded();
      }, 500); // the 500 is the simulated processing delay, in the actual project, this will call the API to get the real data //todo: split the sentence into token features
    },
    [datasets.length, customDatasetCount] // the dependencies, when datasets.length or customDatasetCount changes, create a new function
  );

  // switch the dataset //? do we need this?
  const selectDataset = useCallback(
    (index: number) => {
      if (index >= 0 && index < datasets.length) {
        setSelectedDatasetIndex(index);
      }
    },
    [datasets.length]
  );

  // check if there is a user input sentence (not the initial sample data)
  const hasUserInput = selectedDatasetIndex >= initialDatasets.length;

  return {
    // states
    datasets,
    selectedDatasetIndex,
    isProcessing,
    customDatasetCount,
    currentData,
    hasUserInput,

    // operation functions
    handleSentenceSubmit,
    selectDataset,
    setSelectedDatasetIndex,
  };
};

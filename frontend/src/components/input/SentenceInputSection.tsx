import React from "react";
import SentenceInput from "../SentenceInput";


//this component is the whole input sentence component, it contains two parts, one is the input box, one is the current model
interface SentenceInputSectionProps {
  onSentenceSubmit: (sentence: string) => void;
  isLoading: boolean;
  currentModelName: string;
}

const SentenceInputSection: React.FC<SentenceInputSectionProps> = ({
  onSentenceSubmit,
  isLoading,
  currentModelName,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100 min-h-[300px] flex flex-col">
      <div className="mb-2 flex items-center">
        <h2 className="text-lg font-semibold text-gray-800 mr-auto">
          Input Sentence
        </h2>

        {/* Current model indicator */}
        <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          <span className="mr-2">Current Model:</span>
          <span className="font-medium text-indigo-700">
            {currentModelName}
          </span>
        </div>
      </div>

      {/* this is the input sentence component, it is called in AttentionVisualizerPage.tsx */}
      <SentenceInput
        onSentenceSubmit={onSentenceSubmit} //this is the function that is passed to the SentenceInput component, it is called when the user inputs a sentence
        isLoading={isLoading}
      />
    </div>
  );
};

export default SentenceInputSection;

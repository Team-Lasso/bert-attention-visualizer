import React, { useState } from "react";
import SentenceInput from "../SentenceInput";

//this component is the whole input sentence component, it contains two parts, one is the input box, one is the current model
interface SentenceInputSectionProps {
  onSentenceSubmit: (sentence: string) => void;
  isProcessing: boolean;
  sentence?: string;
}

const SentenceInputSection: React.FC<SentenceInputSectionProps> = ({
  onSentenceSubmit,
  isProcessing,
  sentence = "",
}) => {
  // Track the local input value
  const [inputValue, setInputValue] = useState(sentence);

  // Update local input value when sentence prop changes
  React.useEffect(() => {
    if (sentence) {
      setInputValue(sentence);
    }
  }, [sentence]);

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100 min-h-[300px] flex flex-col">
      <div className="mb-2 flex items-center">
        <h2 className="text-lg font-semibold text-gray-800 mr-auto">
          Input Sentence
        </h2>
      </div>

      {/* this is the input sentence component, it is called in AttentionVisualizerPage.tsx */}
      <SentenceInput
        onSentenceSubmit={onSentenceSubmit} //this is the function that is passed to the SentenceInput component, it is called when the user inputs a sentence
        isLoading={isProcessing}
        initialValue={inputValue}
      />
    </div>
  );
};

export default SentenceInputSection;

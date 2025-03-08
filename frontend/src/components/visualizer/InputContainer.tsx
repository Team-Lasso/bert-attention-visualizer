import React from "react";
import SentenceInput from "../SentenceInput";
import WordMasking from "../WordMasking";
import MaskPredictionPanel from "./MaskPredictionPanel";
import { AttentionData, WordPrediction } from "../../types";

interface InputContainerProps {
  currentModel: any;
  currentData: AttentionData;
  handleSentenceSubmit: (sentence: string) => void;
  isProcessing: boolean;
  handleMaskWord: (tokenIndex: number) => void;
  maskedTokenIndex: number | null;
  maskPredictions: WordPrediction[] | null;
  handleSelectPrediction: (word: string) => void;
  predictionProgress: number;
}

const InputContainer: React.FC<InputContainerProps> = ({
  currentModel,
  currentData,
  handleSentenceSubmit,
  isProcessing,
  handleMaskWord,
  maskedTokenIndex,
  maskPredictions,
  handleSelectPrediction,
  predictionProgress,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Input Sentence Container */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100 min-h-[300px] flex flex-col">
        <div className="mb-2 flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 mr-auto">
            Input Sentence
          </h2>
          <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <span className="mr-2">Current Model:</span>
            <span className="font-medium text-indigo-700">
              {currentModel.name}
            </span>
          </div>
        </div>
        <SentenceInput
          onSentenceSubmit={handleSentenceSubmit}
          isLoading={isProcessing}
        />
      </div>

      {/* Word Masking Container */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100 min-h-[300px] flex flex-col">
        <div className="mb-2 flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 mr-auto">
            Word Masking
          </h2>
        </div>
        <WordMasking
          tokens={currentData.tokens}
          onMaskWord={handleMaskWord}
          maskedTokenIndex={maskedTokenIndex}
        />
      </div>

      {/* Mask Word Predictions Container */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100 min-h-[300px] flex flex-col">
        <div className="mb-2 flex items-center">
          <h2 className="text-lg font-semibold text-gray-800 mr-auto">
            Mask Word Predictions
          </h2>
        </div>
        <MaskPredictionPanel
          maskedTokenIndex={maskedTokenIndex}
          predictions={maskPredictions}
          onSelectPrediction={handleSelectPrediction}
          progress={predictionProgress}
        />
      </div>
    </div>
  );
};

export default InputContainer; 
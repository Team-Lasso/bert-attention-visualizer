import React from "react";
import SentenceInput from "../SentenceInput";


//这个组件是 input sentence整个的组件，这个组件包含两个部分，一个是输入框，一个是当前模型
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

      {/* 这部分是输入句子的组件， */}
      <SentenceInput
        onSentenceSubmit={onSentenceSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SentenceInputSection;

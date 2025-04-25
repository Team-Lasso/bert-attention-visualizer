import React from "react";
import WordMasking from "../WordMasking";
import { Token } from "../../types";

interface WordMaskingSectionProps {
  tokens: Token[];
  onMaskWord: (tokenIndex: number) => void;
  maskedTokenIndex: number | null;
  hasUserInput?: boolean;
  tokenVisibility?: {
    cls: boolean;
    sep: boolean;
    s_token: boolean;
    _s_token: boolean;
    period: boolean;
    pad: boolean;
    comma?: boolean;
    exclamation?: boolean;
    question?: boolean;
    semicolon?: boolean;
    colon?: boolean;
    apostrophe?: boolean;
    quote?: boolean;
    parentheses?: boolean;
    dash?: boolean;
    hyphen?: boolean;
    ellipsis?: boolean;
  };
}

const WordMaskingSection: React.FC<WordMaskingSectionProps> = ({
  tokens,
  onMaskWord,
  maskedTokenIndex,
  hasUserInput = false,
  tokenVisibility = { cls: true, sep: true, s_token: true, _s_token: true, period: true, pad: true },
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100 min-h-[300px] flex flex-col">
      <div className="mb-2 flex items-center">
        <h2 className="text-lg font-semibold text-gray-800 mr-auto">
          Word Masking
        </h2>
      </div>

      {hasUserInput ? (
        <WordMasking
          tokens={tokens}
          onMaskWord={onMaskWord}
          maskedTokenIndex={maskedTokenIndex}
          tokenVisibility={tokenVisibility}
          hideTitle={true}
        />
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg flex-grow flex items-center justify-center">
          <p className="text-gray-500">please input a sentence</p>
        </div>
      )}
    </div>
  );
};

export default WordMaskingSection;

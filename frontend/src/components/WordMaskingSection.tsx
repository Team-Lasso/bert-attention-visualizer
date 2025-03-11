import React from 'react';
import { SentenceArray } from '../newTypes';

//这是我们在laptop创建的文件：需要修改
interface WordMaskingSectionProps {
  sentenceArray: SentenceArray | null;
  maskedWordIndex: number | null;
  maskWord: (wordIndex: number | null) => void;
  onPredictClick?: () => void;
}

const WordMaskingSection: React.FC<WordMaskingSectionProps> = ({
  sentenceArray,
  maskedWordIndex,
  maskWord,
  onPredictClick
}) => {
  if (!sentenceArray || sentenceArray.words.length === 0) {
    return null;
  }

  const handleWordClick = (index: number) => {
    // 如果点击的是当前已选中的单词，则取消选择，否则选择新单词
    maskWord(maskedWordIndex === index ? null : index);
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="text-lg font-semibold mb-2">选择要掩码的单词</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {sentenceArray.words.map((word) => (
          <button
            key={word.index}
            className={`px-3 py-1 border rounded ${
              maskedWordIndex === word.index 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => handleWordClick(word.index)}
          >
            {word.text}
          </button>
        ))}
      </div>
      
      {maskedWordIndex !== null && (
        <div>
          <p className="mb-4">
            掩码句子: {sentenceArray.words.map((word, idx) => 
              idx === maskedWordIndex ? '<span className="font-bold text-red-500">[MASK]</span>' : word.text
            ).join(' ')}
          </p>
          
          {onPredictClick && (
            <button
              onClick={onPredictClick}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              预测掩码单词
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WordMaskingSection; 
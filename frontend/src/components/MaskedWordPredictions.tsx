import React from 'react';
import { WordPrediction } from '../types';

interface MaskedWordPredictionsProps {
  tokens: { text: string }[];
  maskedTokenIndex: number | null;
  predictions: WordPrediction[] | null;
  onSelectPrediction: (word: string) => void;
}

const MaskedWordPredictions: React.FC<MaskedWordPredictionsProps> = ({
  tokens,
  maskedTokenIndex,
  predictions,
  onSelectPrediction
}) => {
  if (maskedTokenIndex === null) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">select a word to mask</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-gray-700 mb-2 font-medium">masked sentence:</p>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token, index) => (
            <span 
              key={index} 
              className={`px-2 py-1 rounded ${index === maskedTokenIndex 
                ? 'bg-yellow-200 border border-yellow-400 font-bold' 
                : 'bg-gray-100'}`}
            >
              {index === maskedTokenIndex ? '[MASK]' : token.text}
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <p className="text-gray-700 mb-2 font-medium">prediction results:</p>
        {predictions ? (
          <div className="grid grid-cols-1 gap-2">
            {predictions.map((prediction, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrediction(prediction.word)}
                className="flex items-center justify-between bg-white border border-gray-200 hover:bg-indigo-50 rounded-lg p-3 transition-colors"
              >
                <span className="font-medium">{prediction.word}</span>
                <div className="flex items-center">
                  <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                    <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{width: `${prediction.score * 100}%`}}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{(prediction.score * 100).toFixed(1)}%</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">loading prediction results...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaskedWordPredictions; 
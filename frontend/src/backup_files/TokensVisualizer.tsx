import React from 'react';
import { Token } from '../types';
import { Hash } from 'lucide-react';

interface TokensVisualizerProps {
  tokens: Token[];
  onTokenSelect: (tokenIndex: number) => void;
  selectedTokenIndex: number | null;
}

const TokensVisualizer: React.FC<TokensVisualizerProps> = ({ 
  tokens, 
  onTokenSelect,
  selectedTokenIndex 
}) => {
  return (
    <div className="p-5 bg-white rounded-xl shadow-md border border-indigo-100">
      <div className="flex items-center mb-3">
        <Hash size={18} className="mr-2 text-indigo-600" />
        <h3 className="text-lg font-medium text-gray-900">Input Tokens</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">Click on a token to see its attention distribution</p>
      <div className="flex flex-wrap gap-2">
        {tokens.map((token, index) => (
          <button
            key={index}
            onClick={() => onTokenSelect(index)}
            className={`px-3 py-2 rounded-lg border transition-all ${
              selectedTokenIndex === index
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md transform scale-105'
                : 'bg-blue-50 text-blue-800 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
            }`}
          >
            {token.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TokensVisualizer;
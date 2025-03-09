import React, { useState } from 'react';
import { Send } from 'lucide-react';

/*
被SentenceInputSection.tsx调用
*/
interface SentenceInputProps {
  onSentenceSubmit: (sentence: string) => void;
  isLoading: boolean;
}

const SentenceInput: React.FC<SentenceInputProps> = ({ onSentenceSubmit, isLoading }) => {
  const [sentence, setSentence] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();  //阻止默认行为，防止页面刷新
    if (sentence.trim()) {
      onSentenceSubmit(sentence.trim());
    }
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Enter Your Own Sentence</h3>
      <p className="text-sm text-gray-500 mb-3">Type a sentence to analyze</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="E.g., The cat sat on the mat"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            disabled={isLoading}
          />
          {sentence && (
            <button
              type="button"
              onClick={() => setSentence('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!sentence.trim() || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing
            </div>
          ) : (
            <div className="flex items-center">
              <Send size={16} className="mr-2" />
              Analyze
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default SentenceInput;
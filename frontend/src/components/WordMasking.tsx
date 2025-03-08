import React from 'react';
import { Token } from '../types';
import { Wand2 } from 'lucide-react';

interface WordMaskingProps {
    tokens: Token[];
    onMaskWord: (tokenIndex: number) => void;
    maskedTokenIndex: number | null;
}

const WordMasking: React.FC<WordMaskingProps> = ({
    tokens,
    onMaskWord,
    maskedTokenIndex
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center mb-3">
                <Wand2 size={18} className="mr-2 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">Word Masking</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Click on a token to mask it and see BERT's predictions</p>

            <div className="flex flex-wrap gap-2 mb-3">
                {tokens.map((token, index) => (
                    <button
                        key={index}
                        onClick={() => onMaskWord(index)}
                        className={`px-3 py-2 rounded-lg border transition-all ${maskedTokenIndex === index
                                ? 'bg-purple-600 text-white border-purple-700 shadow-md transform scale-105'
                                : 'bg-purple-50 text-purple-800 border-purple-100 hover:bg-purple-100 hover:border-purple-200'
                            }`}
                    >
                        {maskedTokenIndex === index ? '[MASK]' : token.text}
                    </button>
                ))}
            </div>

            {maskedTokenIndex === null && (
                <div className="flex items-center justify-center flex-grow bg-gray-50 rounded-lg mt-4">
                    <div className="text-gray-500">Select a word to mask</div>
                </div>
            )}
        </div>
    );
};

export default WordMasking; 
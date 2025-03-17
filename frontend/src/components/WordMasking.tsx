import React from 'react';
import { Token } from '../types';
import { Wand2 } from 'lucide-react';

/*
used by WordMaskingSection.tsx
*/
interface WordMaskingProps {
    tokens: Token[];
    onMaskWord: (tokenIndex: number) => void;
    maskedTokenIndex: number | null;
}

// Helper function to check if a token is a special token that should not be masked
const isSpecialToken = (tokenText: string): boolean => {
    // Handle BERT special tokens
    if (tokenText === '[CLS]' || tokenText === '[SEP]' || tokenText === '[PAD]' ||
        tokenText === '[UNK]' || tokenText === '[MASK]') {
        return true;
    }

    // Handle RoBERTa special tokens - RoBERTa uses HTML-like notation
    if (tokenText === '<s>' || tokenText === '</s>' || tokenText === '<pad>' ||
        tokenText === '<unk>' || tokenText === '<mask>') {
        return true;
    }

    // Handle any other obvious special tokens used by transformers
    if (tokenText.startsWith('[') && tokenText.endsWith(']')) {
        // Any other token enclosed in square brackets is likely a special token
        return true;
    }

    if (tokenText.startsWith('<') && tokenText.endsWith('>')) {
        // Any other token enclosed in angle brackets is likely a special token
        return true;
    }

    // The "Ġ" prefix in RoBERTa indicates the start of a word, not a special token
    // So we don't classify words starting with Ġ as special tokens

    return false;
};

const WordMasking: React.FC<WordMaskingProps> = ({
    tokens,
    onMaskWord,
    maskedTokenIndex
}) => {
    // Filter out special tokens completely
    const maskableTokens = tokens.filter(token => !isSpecialToken(token.text));

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center mb-3">
                <Wand2 size={18} className="mr-2 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">Word Masking</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Click on a token to mask it and see model predictions</p>

            <div className="flex flex-wrap gap-2 mb-3">
                {maskableTokens.map((token) => (
                    <button
                        key={token.index}
                        onClick={() => onMaskWord(token.index)}
                        className={`px-3 py-2 rounded-lg border transition-all ${maskedTokenIndex === token.index
                            ? 'bg-purple-600 text-white border-purple-700 shadow-md transform scale-105'
                            : 'bg-purple-50 text-purple-800 border-purple-100 hover:bg-purple-100 hover:border-purple-200'
                            }`}
                        title="Click to mask this token"
                    >
                        {maskedTokenIndex === token.index ? '[MASK]' : token.text}
                    </button>
                ))}
            </div>

            {maskedTokenIndex === null && maskableTokens.length > 0 && (
                <div className="flex items-center justify-center flex-grow bg-gray-50 rounded-lg mt-4">
                    <div className="text-gray-500">Select a word to mask</div>
                </div>
            )}

            {maskableTokens.length === 0 && (
                <div className="flex items-center justify-center flex-grow bg-gray-50 rounded-lg mt-4">
                    <div className="text-gray-500">No maskable tokens available</div>
                </div>
            )}
        </div>
    );
};

export default WordMasking; 
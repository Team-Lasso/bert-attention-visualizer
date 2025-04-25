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
    hideTitle?: boolean;
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

    // Do not include periods here - periods should be maskable

    // The "Ġ" prefix in RoBERTa indicates the start of a word, not a special token
    // So we don't classify words starting with Ġ as special tokens

    return false;
};

// Check for specific token types
const isCLS = (tokenText: string): boolean => tokenText === '[CLS]' || tokenText === '<s>';
const isSEP = (tokenText: string): boolean => tokenText === '[SEP]' || tokenText === '</s>';
const isPAD = (tokenText: string): boolean => tokenText === '[PAD]' || tokenText === '<pad>';
const isPeriod = (tokenText: string): boolean => tokenText === '.';

const WordMasking: React.FC<WordMaskingProps> = ({
    tokens,
    onMaskWord,
    maskedTokenIndex,
    tokenVisibility = { cls: true, sep: true, s_token: true, _s_token: true, period: true, pad: true }, // Default all visible
    hideTitle = false
}) => {
    // Process all tokens and add metadata
    const processedTokens = tokens.map(token => ({
        ...token,
        isSpecial: isSpecialToken(token.text),
        isCLS: isCLS(token.text),
        isSEP: isSEP(token.text),
        isPAD: isPAD(token.text),
        isPeriod: isPeriod(token.text),
        isSToken: token.text === '<s>',
        is_SToken: token.text === '</s>'
    }));

    // Filter tokens based on tokenVisibility settings
    const tokensToDisplay = processedTokens.filter(token => {
        // Each token type is independently controlled by its visibility setting
        if (token.isCLS && !tokenVisibility.cls) return false;
        if (token.isSEP && !tokenVisibility.sep) return false;
        if (token.isPAD && !tokenVisibility.pad) return false;
        if (token.isPeriod && !tokenVisibility.period) return false;
        if (token.isSToken && !tokenVisibility.s_token) return false;
        if (token.is_SToken && !tokenVisibility._s_token) return false;

        return true;
    });

    // Some tokens should never be maskable regardless of whether they're shown
    const unmaskableTokens = ['[MASK]', '<mask>'];

    return (
        <div className="flex flex-col h-full">
            {!hideTitle && (
                <>
                    <div className="flex items-center mb-3">
                        <Wand2 size={18} className="mr-2 text-indigo-600" />
                        <h3 className="text-lg font-medium text-gray-900">Word Masking</h3>
                    </div>
                </>
            )}
            <p className="text-sm text-gray-600 mb-4">Select a word to mask</p>

            <div className="flex flex-wrap gap-2 mb-3">
                {tokensToDisplay.map((token) => {
                    // Special tokens can't be masked, but periods can
                    const isUnmaskable = (token.isSpecial && !token.isPeriod) || unmaskableTokens.includes(token.text);

                    return (
                        <button
                            key={token.index}
                            onClick={() => !isUnmaskable && onMaskWord(token.index)}
                            className={`px-3 py-2 rounded-lg border transition-all ${maskedTokenIndex === token.index
                                ? 'bg-purple-600 text-white border-purple-700 shadow-md transform scale-105'
                                : isUnmaskable
                                    ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-70'
                                    : 'bg-purple-50 text-purple-800 border-purple-100 hover:bg-purple-100 hover:border-purple-200'
                                }`}
                            title={isUnmaskable ? "This token cannot be masked" : "Click to mask this token"}
                            disabled={isUnmaskable}
                        >
                            {maskedTokenIndex === token.index ? '[MASK]' : token.text}
                        </button>
                    );
                })}
            </div>

            {maskedTokenIndex === null && tokensToDisplay.length > 0 && (
                <div className="flex items-center justify-center flex-grow bg-gray-50 rounded-lg mt-4">
                    <div className="text-gray-500">Click on any token above to mask it</div>
                </div>
            )}

            {tokensToDisplay.length === 0 && (
                <div className="flex items-center justify-center flex-grow bg-gray-50 rounded-lg mt-4">
                    <div className="text-gray-500">No tokens available</div>
                </div>
            )}
        </div>
    );
};

export default WordMasking; 
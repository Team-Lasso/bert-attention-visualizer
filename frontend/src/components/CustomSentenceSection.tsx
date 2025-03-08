import React from 'react';
import SentenceInput from './SentenceInput';
import { Token, WordPrediction } from '../types';
import WordMasking from './WordMasking';
import { FileText } from 'lucide-react';

interface CustomSentenceSectionProps {
    tokens: Token[];
    onSentenceSubmit: (sentence: string) => void;
    isProcessing: boolean;
    onMaskWord: (tokenIndex: number) => void;
    maskedTokenIndex: number | null;
}

const CustomSentenceSection: React.FC<CustomSentenceSectionProps> = ({
    tokens,
    onSentenceSubmit,
    isProcessing,
    onMaskWord,
    maskedTokenIndex
}) => {
    return (
        <div className="p-5 bg-white rounded-xl shadow-md border border-indigo-100 flex-1 flex flex-col">
            <div className="flex items-center mb-4">
                <FileText size={20} className="mr-2 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">Custom Sentence Analysis</h2>
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col">
                <SentenceInput 
                    onSentenceSubmit={onSentenceSubmit} 
                    isLoading={isProcessing} 
                />
                
                <div className="flex-1">
                    <WordMasking 
                        tokens={tokens}
                        onMaskWord={onMaskWord}
                        maskedTokenIndex={maskedTokenIndex}
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomSentenceSection; 
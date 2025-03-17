import React, { useMemo } from "react";
import { Grid, GitBranch, ArrowLeft } from "lucide-react";
import { AttentionData, WordAttentionData } from "../../types";
import AttentionMatrix from "../AttentionMatrix";
import ParallelView from "../ParallelView";
import WordAttentionBarChart from "../WordAttentionBarChart";

interface AttentionComparisonViewProps {
    beforeData: AttentionData;
    afterData: AttentionData;
    selectedLayer: number;
    selectedHead: number;
    selectedTokenIndex: number | null;
    activeView: "matrix" | "parallel";
    replacementWord: string | null;
    wordIndex: number | null;
    onExitComparison: () => void;
}

const AttentionComparisonView: React.FC<AttentionComparisonViewProps> = ({
    beforeData,
    afterData,
    selectedLayer,
    selectedHead,
    selectedTokenIndex,
    activeView,
    replacementWord,
    wordIndex,
    onExitComparison,
}) => {
    // Get the current head data for both before and after
    const beforeLayerData = beforeData?.layers?.[selectedLayer];
    const beforeHeadData = beforeLayerData?.heads?.[selectedHead];

    const afterLayerData = afterData?.layers?.[selectedLayer];
    const afterHeadData = afterLayerData?.heads?.[selectedHead];

    // Process tokens to add index property
    const beforeTokensWithIndex = beforeData?.tokens?.map((token, index) => ({
        ...token,
        index,
    })) || [];

    const afterTokensWithIndex = afterData?.tokens?.map((token, index) => ({
        ...token,
        index,
    })) || [];

    // Extract complete sentences from tokens
    const getFullSentence = (tokens: Array<{ text: string }>) => {
        // Filter out special tokens like [CLS], [SEP], <s>, </s>, etc.
        const specialTokens = ["[CLS]", "[SEP]", "<s>", "</s>", "<pad>", "[PAD]"];
        const filteredTokens = tokens.filter(token => !specialTokens.includes(token.text));

        // For RoBERTa, remove 'Ġ' prefix from tokens
        const processedTokens = filteredTokens.map(token => {
            let text = token.text;
            if (text.startsWith('Ġ')) {
                text = text.substring(1);
            }
            return text;
        });

        // Join tokens, adding spaces where appropriate
        let sentence = '';
        processedTokens.forEach((text, i) => {
            // Don't add space before punctuation or if it's the first token
            const isPunctuation = /^[.,;:!?'"()[\]{}]+$/.test(text);
            if (i === 0 || isPunctuation) {
                sentence += text;
            } else {
                sentence += ' ' + text;
            }
        });

        return sentence;
    };

    const originalSentence = useMemo(() => getFullSentence(beforeData?.tokens || []), [beforeData]);
    const replacedSentence = useMemo(() => getFullSentence(afterData?.tokens || []), [afterData]);

    // Find the original word that was replaced
    const originalWords = originalSentence.split(' ');
    const originalWord = wordIndex !== null && wordIndex < originalWords.length
        ? originalWords[wordIndex]
        : "";

    // Create word attention data for bar charts when a token is selected
    const beforeWordAttentionData: WordAttentionData | null = useMemo(() => {
        if (selectedTokenIndex === null || !beforeHeadData) return null;

        const sourceWord = beforeTokensWithIndex[selectedTokenIndex]?.text || "";
        const targetWords = beforeTokensWithIndex.map(token => token.text);
        const attentionValues = beforeHeadData?.attention?.[selectedTokenIndex] || [];

        return {
            sourceWord,
            targetWords,
            attentionValues
        };
    }, [selectedTokenIndex, beforeHeadData, beforeTokensWithIndex]);

    // Create word attention data for the "after" chart
    const afterWordAttentionData: WordAttentionData | null = useMemo(() => {
        if (selectedTokenIndex === null || !afterHeadData) return null;

        const sourceWord = afterTokensWithIndex[selectedTokenIndex]?.text || "";
        const targetWords = afterTokensWithIndex.map(token => token.text);
        const attentionValues = afterHeadData?.attention?.[selectedTokenIndex] || [];

        return {
            sourceWord,
            targetWords,
            attentionValues
        };
    }, [selectedTokenIndex, afterHeadData, afterTokensWithIndex]);

    return (
        <div className="flex flex-col space-y-6">
            {/* Header with comparison info */}
            <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        Attention Comparison
                    </h2>
                    <button
                        onClick={onExitComparison}
                        className="flex items-center text-indigo-600 hover:text-indigo-800"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Single View
                    </button>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                    <p>
                        Comparing attention before and after replacing{" "}
                        <span className="font-medium text-indigo-700">
                            {originalWord || (wordIndex !== null && beforeData?.tokens && beforeData.tokens[wordIndex]
                                ? beforeData.tokens[wordIndex].text
                                : "the masked word")}
                        </span>{" "}
                        with{" "}
                        <span className="font-medium text-indigo-700">
                            {replacementWord || "selected prediction"}
                        </span>
                        .
                    </p>
                </div>
                <div className="flex justify-between px-4">
                    <div className="text-center">
                        <h3 className="font-medium text-gray-700">Before</h3>
                    </div>
                    <div className="text-center">
                        <h3 className="font-medium text-gray-700">After</h3>
                    </div>
                </div>
            </div>

            {/* Visualization Views */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before View */}
                <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            {activeView === "matrix" ? (
                                <Grid size={20} className="mr-2 text-indigo-600" />
                            ) : (
                                <GitBranch size={20} className="mr-2 text-indigo-600" />
                            )}
                            Original
                        </h2>
                        <div className="text-sm text-gray-500 flex items-center">
                            <span className="mr-3">
                                Layer {selectedLayer + 1}, Head {selectedHead + 1}
                            </span>
                        </div>
                    </div>

                    {/* Display original full sentence */}
                    <div className="bg-gray-50 p-3 mb-4 rounded-lg text-gray-700 text-sm border border-indigo-50">
                        <div className="font-medium mb-1">Original Sentence:</div>
                        <div className="text-base">
                            {originalSentence}
                        </div>
                    </div>

                    {beforeHeadData && (
                        activeView === "matrix" ? (
                            <AttentionMatrix
                                tokens={beforeTokensWithIndex}
                                head={{
                                    ...beforeHeadData,
                                    headIndex: selectedHead,
                                }}
                                width={400} // Slightly smaller for side-by-side
                                height={400}
                                selectedTokenIndex={selectedTokenIndex}
                            />
                        ) : (
                            <ParallelView
                                tokens={beforeTokensWithIndex}
                                head={{
                                    ...beforeHeadData,
                                    headIndex: selectedHead,
                                }}
                                width={400} // Slightly smaller for side-by-side
                                height={400}
                                selectedTokenIndex={selectedTokenIndex}
                            />
                        )
                    )}
                </div>

                {/* After View */}
                <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            {activeView === "matrix" ? (
                                <Grid size={20} className="mr-2 text-indigo-600" />
                            ) : (
                                <GitBranch size={20} className="mr-2 text-indigo-600" />
                            )}
                            With "{replacementWord}"
                        </h2>
                        <div className="text-sm text-gray-500 flex items-center">
                            <span className="mr-3">
                                Layer {selectedLayer + 1}, Head {selectedHead + 1}
                            </span>
                        </div>
                    </div>

                    {/* Display replaced full sentence */}
                    <div className="bg-gray-50 p-3 mb-4 rounded-lg text-gray-700 text-sm border border-indigo-50">
                        <div className="font-medium mb-1">Replaced Sentence:</div>
                        <div className="text-base">
                            {replacedSentence}
                        </div>
                    </div>

                    {afterHeadData && (
                        activeView === "matrix" ? (
                            <AttentionMatrix
                                tokens={afterTokensWithIndex}
                                head={{
                                    ...afterHeadData,
                                    headIndex: selectedHead,
                                }}
                                width={400} // Slightly smaller for side-by-side
                                height={400}
                                selectedTokenIndex={selectedTokenIndex}
                            />
                        ) : (
                            <ParallelView
                                tokens={afterTokensWithIndex}
                                head={{
                                    ...afterHeadData,
                                    headIndex: selectedHead,
                                }}
                                width={400} // Slightly smaller for side-by-side
                                height={400}
                                selectedTokenIndex={selectedTokenIndex}
                            />
                        )
                    )}
                </div>
            </div>

            {/* Bar Charts - Added for the comparison view */}
            {selectedTokenIndex !== null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Bar Chart */}
                    {beforeWordAttentionData && (
                        <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    Token Attention Distribution (Original)
                                </h2>
                            </div>
                            <div className="flex justify-center">
                                <WordAttentionBarChart
                                    data={beforeWordAttentionData}
                                    width={375}
                                    height={300}
                                />
                            </div>
                        </div>
                    )}

                    {/* After Bar Chart */}
                    {afterWordAttentionData && (
                        <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                    Token Attention Distribution (With "{replacementWord}")
                                </h2>
                            </div>
                            <div className="flex justify-center">
                                <WordAttentionBarChart
                                    data={afterWordAttentionData}
                                    width={375}
                                    height={300}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttentionComparisonView; 
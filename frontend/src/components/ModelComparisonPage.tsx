import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { pretrainedModels } from "../data/pretrainedModels";
import { ModelConfig, AttentionData } from "../types";
import { fetchAttentionData } from "../services/modelService";
import VisualizationDisplay from "./visualization/VisualizationDisplay";
import VisualizationControls from "./visualization/VisualizationControls";

const ModelComparisonPage: React.FC = () => {
    // Models selection state
    const [modelA, setModelA] = useState<ModelConfig | null>(null);
    const [modelB, setModelB] = useState<ModelConfig | null>(null);
    const [inputSentence, setInputSentence] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Visualization state
    const [dataA, setDataA] = useState<AttentionData | null>(null);
    const [dataB, setDataB] = useState<AttentionData | null>(null);
    const [selectedLayer, setSelectedLayer] = useState(0);
    const [selectedHead, setSelectedHead] = useState(0);
    const [activeView, setActiveView] = useState<"matrix" | "parallel">("matrix");
    const [visualizationMethod, setVisualizationMethod] = useState<'raw' | 'rollout' | 'flow'>('raw');

    // Tokens state
    const [tokensWithIndexA, setTokensWithIndexA] = useState<{ text: string; index: number }[]>([]);
    const [tokensWithIndexB, setTokensWithIndexB] = useState<{ text: string; index: number }[]>([]);
    const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);

    // Current head data
    const [currentHeadDataA, setCurrentHeadDataA] = useState<{ headIndex: number; attention: number[][] } | null>(null);
    const [currentHeadDataB, setCurrentHeadDataB] = useState<{ headIndex: number; attention: number[][] } | null>(null);

    // Word attention data
    const [wordAttentionDataA, setWordAttentionDataA] = useState<{ sourceWord: string; targetWords: string[]; attentionValues: number[] } | null>(null);
    const [wordAttentionDataB, setWordAttentionDataB] = useState<{ sourceWord: string; targetWords: string[]; attentionValues: number[] } | null>(null);

    // Update current head data when layer or head changes
    useEffect(() => {
        if (dataA?.layers && dataA.layers.length > selectedLayer &&
            dataA.layers[selectedLayer].heads && dataA.layers[selectedLayer].heads.length > selectedHead) {
            setCurrentHeadDataA({
                headIndex: selectedHead,
                attention: dataA.layers[selectedLayer].heads[selectedHead].attention
            });
        } else {
            setCurrentHeadDataA(null);
        }

        if (dataB?.layers && dataB.layers.length > selectedLayer &&
            dataB.layers[selectedLayer].heads && dataB.layers[selectedLayer].heads.length > selectedHead) {
            setCurrentHeadDataB({
                headIndex: selectedHead,
                attention: dataB.layers[selectedLayer].heads[selectedHead].attention
            });
        } else {
            setCurrentHeadDataB(null);
        }
    }, [dataA, dataB, selectedLayer, selectedHead]);

    // Update tokens when data changes
    useEffect(() => {
        if (dataA?.tokens) {
            setTokensWithIndexA(dataA.tokens.map((token, index) => ({
                ...token,
                index
            })));
        }

        if (dataB?.tokens) {
            setTokensWithIndexB(dataB.tokens.map((token, index) => ({
                ...token,
                index
            })));
        }
    }, [dataA, dataB]);

    // Update word attention data when token is selected
    useEffect(() => {
        if (selectedTokenIndex !== null) {
            // Generate word attention data for model A
            if (currentHeadDataA && tokensWithIndexA.length > 0) {
                const sourceWord = tokensWithIndexA[selectedTokenIndex]?.text || '';
                const attentionValues = currentHeadDataA.attention[selectedTokenIndex] || [];
                const targetWords = tokensWithIndexA.map(token => token.text);

                setWordAttentionDataA({
                    sourceWord,
                    targetWords,
                    attentionValues
                });
            } else {
                setWordAttentionDataA(null);
            }

            // Generate word attention data for model B
            if (currentHeadDataB && tokensWithIndexB.length > 0) {
                const sourceWord = tokensWithIndexB[selectedTokenIndex]?.text || '';
                const attentionValues = currentHeadDataB.attention[selectedTokenIndex] || [];
                const targetWords = tokensWithIndexB.map(token => token.text);

                setWordAttentionDataB({
                    sourceWord,
                    targetWords,
                    attentionValues
                });
            } else {
                setWordAttentionDataB(null);
            }
        } else {
            setWordAttentionDataA(null);
            setWordAttentionDataB(null);
        }
    }, [selectedTokenIndex, currentHeadDataA, currentHeadDataB, tokensWithIndexA, tokensWithIndexB]);

    // Handle token click - listen for the token-selection-change event dispatched by visualization components
    useEffect(() => {
        const handleTokenSelection = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && "tokenIndex" in customEvent.detail) {
                setSelectedTokenIndex(customEvent.detail.tokenIndex);
            }
        };

        window.addEventListener("token-selection-change", handleTokenSelection);

        return () => {
            window.removeEventListener("token-selection-change", handleTokenSelection);
        };
    }, []);

    // Handle model selection
    const handleModelASelect = (modelId: string) => {
        const selected = pretrainedModels.find(model => model.id === modelId);
        setModelA(selected || null);
    };

    const handleModelBSelect = (modelId: string) => {
        const selected = pretrainedModels.find(model => model.id === modelId);
        setModelB(selected || null);
    };

    // Handle input sentence change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputSentence(e.target.value);
    };

    // Switch view for visualization
    const switchView = useCallback((view: "matrix" | "parallel") => {
        setActiveView(view);
    }, []);

    // Handle visualization method change
    const handleVisualizationMethodChange = (method: 'raw' | 'rollout' | 'flow') => {
        setVisualizationMethod(method);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputSentence.trim() || !modelA || !modelB) {
            return;
        }

        setIsProcessing(true);
        setSelectedTokenIndex(null); // Reset token selection

        try {
            // Fetch attention data for both models
            const [attentionDataA, attentionDataB] = await Promise.all([
                fetchAttentionData({
                    text: inputSentence,
                    model_name: modelA.id,
                    visualization_method: visualizationMethod
                }),
                fetchAttentionData({
                    text: inputSentence,
                    model_name: modelB.id,
                    visualization_method: visualizationMethod
                })
            ]);

            setDataA(attentionDataA);
            setDataB(attentionDataB);
        } catch (error) {
            console.error("Error fetching attention data:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Check if we can display visualizations
    const canShowVisualizations = dataA && dataB;

    // Determine max layers and heads for controls
    const maxLayers = Math.max(
        dataA?.layers?.length || 0,
        dataB?.layers?.length || 0
    );

    const maxHeads = Math.max(
        dataA?.layers?.[0]?.heads?.length || 0,
        dataB?.layers?.[0]?.heads?.length || 0
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            <div className="flex flex-col space-y-6 max-w-6xl mx-auto p-6">
                {/* Header with back navigation */}
                <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-6">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Visualizer
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Model Comparison</h1>
                    <div className="w-24"></div> {/* Spacer for alignment */}
                </div>

                {/* Model Selection and Input Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Compare Two Models</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Input Sentence - moved to top */}
                        <div className="border-b pb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Input Sentence</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                value={inputSentence}
                                onChange={handleInputChange}
                                placeholder="Type a paragraph to analyze (max 30 words)"
                                maxLength={500}
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                {inputSentence.trim().split(/\s+/).filter(Boolean).length}/30 words
                            </p>
                        </div>

                        {/* Model selection grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Model A Selection */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model A</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={modelA?.id || ""}
                                    onChange={(e) => handleModelASelect(e.target.value)}
                                    required
                                >
                                    <option value="">Select a model</option>
                                    {pretrainedModels.map(model => (
                                        <option key={`a-${model.id}`} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                                {modelA && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p>{modelA.description}</p>
                                        <p className="mt-1"><strong>Parameters:</strong> {modelA.parameters}</p>
                                        <p><strong>Tokenizer:</strong> {modelA.tokenizer}</p>
                                    </div>
                                )}
                            </div>

                            {/* Model B Selection */}
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model B</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={modelB?.id || ""}
                                    onChange={(e) => handleModelBSelect(e.target.value)}
                                    required
                                >
                                    <option value="">Select a model</option>
                                    {pretrainedModels.map(model => (
                                        <option key={`b-${model.id}`} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                                {modelB && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p>{modelB.description}</p>
                                        <p className="mt-1"><strong>Parameters:</strong> {modelB.parameters}</p>
                                        <p><strong>Tokenizer:</strong> {modelB.tokenizer}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visualization Method */}
                        <div className="pt-4 border-t border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Visualization Method</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        className="form-radio h-4 w-4 text-blue-600"
                                        name="visualization-method"
                                        value="raw"
                                        checked={visualizationMethod === 'raw'}
                                        onChange={() => handleVisualizationMethodChange('raw')}
                                    />
                                    <div className="ml-3">
                                        <span className="block text-sm font-medium">Raw Attention</span>
                                        <span className="text-xs text-gray-500">Direct attention weights</span>
                                    </div>
                                </label>
                                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        className="form-radio h-4 w-4 text-blue-600"
                                        name="visualization-method"
                                        value="rollout"
                                        checked={visualizationMethod === 'rollout'}
                                        onChange={() => handleVisualizationMethodChange('rollout')}
                                    />
                                    <div className="ml-3">
                                        <span className="block text-sm font-medium">Attention Rollout</span>
                                        <span className="text-xs text-gray-500">Propagated attention</span>
                                    </div>
                                </label>
                                <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        className="form-radio h-4 w-4 text-blue-600"
                                        name="visualization-method"
                                        value="flow"
                                        checked={visualizationMethod === 'flow'}
                                        onChange={() => handleVisualizationMethodChange('flow')}
                                    />
                                    <div className="ml-3">
                                        <span className="block text-sm font-medium">Attention Flow</span>
                                        <span className="text-xs text-gray-500">Optimized path attribution</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md shadow transition duration-150 ease-in-out flex justify-center items-center"
                                disabled={isProcessing || !modelA || !modelB || !inputSentence.trim()}
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing Attention Patterns...
                                    </>
                                ) : (
                                    "Compare Models"
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Visualization Controls (when data is available) */}
                {canShowVisualizations && (
                    <div className="bg-white rounded-lg shadow p-6 mb-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Attention Layer Controls</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <VisualizationControls
                                selectedLayer={selectedLayer}
                                selectedHead={selectedHead}
                                activeView={activeView}
                                onSelectLayer={setSelectedLayer}
                                onSelectHead={setSelectedHead}
                                onSwitchView={switchView}
                                totalLayers={maxLayers}
                                totalHeads={maxHeads}
                                view="comparison"
                                visualizationMethod={visualizationMethod}
                                onVisualizationMethodChange={handleVisualizationMethodChange}
                            />
                        </div>
                    </div>
                )}

                {/* Visualizations (when data is available) */}
                {canShowVisualizations && (
                    <div className="flex flex-col space-y-6">
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="border-b border-gray-200 bg-gray-50 p-4">
                                <h3 className="text-lg font-medium text-gray-900">Model Comparison: {activeView === "matrix" ? "Attention Matrix" : "Graph View"}</h3>
                                <p className="text-sm text-gray-600">
                                    Comparing Layer {selectedLayer + 1}, Head {selectedHead + 1} across both models
                                </p>
                                {selectedTokenIndex !== null && (
                                    <div className="mt-2 p-2 bg-blue-100 rounded-md text-sm">
                                        Showing attention for token: <span className="font-semibold">{tokensWithIndexA[selectedTokenIndex]?.text || ''}</span>
                                        <button
                                            className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                                            onClick={() => setSelectedTokenIndex(null)}
                                        >
                                            Clear selection
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Model A Visualization */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center mb-4">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {modelA?.name || "Model A"}
                                    </h3>
                                </div>
                                <VisualizationDisplay
                                    tokens={tokensWithIndexA}
                                    currentHead={currentHeadDataA ? {
                                        ...currentHeadDataA,
                                        headIndex: selectedHead
                                    } : {
                                        headIndex: selectedHead,
                                        attention: []
                                    }}
                                    selectedLayer={selectedLayer}
                                    selectedHead={selectedHead}
                                    selectedTokenIndex={selectedTokenIndex}
                                    activeView={activeView}
                                    wordAttentionData={wordAttentionDataA || {
                                        sourceWord: '',
                                        targetWords: [],
                                        attentionValues: []
                                    }}
                                    visualizationMethod={visualizationMethod}
                                />
                            </div>

                            {/* Model B Visualization */}
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {modelB?.name || "Model B"}
                                    </h3>
                                </div>
                                <VisualizationDisplay
                                    tokens={tokensWithIndexB}
                                    currentHead={currentHeadDataB ? {
                                        ...currentHeadDataB,
                                        headIndex: selectedHead
                                    } : {
                                        headIndex: selectedHead,
                                        attention: []
                                    }}
                                    selectedLayer={selectedLayer}
                                    selectedHead={selectedHead}
                                    selectedTokenIndex={selectedTokenIndex}
                                    activeView={activeView}
                                    wordAttentionData={wordAttentionDataB || {
                                        sourceWord: '',
                                        targetWords: [],
                                        attentionValues: []
                                    }}
                                    visualizationMethod={visualizationMethod}
                                />
                            </div>
                        </div>

                        {/* Differences Analysis (placeholder for future enhancement) */}
                        <div className="bg-white rounded-lg shadow p-6 mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Analysis & Comparison</h3>
                            <div className="border-t border-gray-200 pt-3">
                                <p className="text-gray-700">
                                    This section displays the two models' attention patterns for the same input.
                                    Observe differences in how each model attends to the tokens in the text.
                                    These differences can reveal how architectural variations affect the transformer's attention mechanisms.
                                </p>
                                <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
                                    <strong>Tip:</strong> Click on a token to see how it attends to other tokens in the sequence.
                                    The same token will be highlighted in both models for direct comparison.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModelComparisonPage; 
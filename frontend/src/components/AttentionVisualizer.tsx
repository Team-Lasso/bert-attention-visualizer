import React, { useState, useCallback, useEffect } from 'react';
import { AttentionData, SampleData, WordAttentionData, WordPrediction } from '../types';
import AttentionMatrix from './AttentionMatrix';
import AttentionHeadSelector from './AttentionHeadSelector';
import SentenceInput from './SentenceInput';
import WordAttentionBarChart from './WordAttentionBarChart';
import ParallelView from './ParallelView';
import WordMasking from './WordMasking';
import { Brain, Grid, GitBranch, BarChart, Info, Database } from 'lucide-react';
import { generateAttentionData } from '../data/sampleData';

interface AttentionVisualizerProps {
  datasets: SampleData[];
}

const AttentionVisualizer: React.FC<AttentionVisualizerProps> = ({ datasets: initialDatasets }) => {
  const [datasets, setDatasets] = useState<SampleData[]>(initialDatasets);
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [maskedTokenIndex, setMaskedTokenIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDatasetCount, setCustomDatasetCount] = useState(0);
  const [activeView, setActiveView] = useState<'matrix' | 'parallel'>('parallel');
  const [showInfo, setShowInfo] = useState(false);

  const currentData: AttentionData = datasets[selectedDatasetIndex].data;
  const currentLayer = currentData.layers[selectedLayer];
  const currentHead = currentLayer.heads[selectedHead];

  const handleSentenceSubmit = useCallback((sentence: string) => {
    setIsProcessing(true);

    // Simulate processing time
    setTimeout(() => {
      const newAttentionData = generateAttentionData(sentence);
      const newDatasetName = `Custom ${customDatasetCount + 1}: "${sentence.length > 30 ? sentence.substring(0, 27) + '...' : sentence}"`;

      setDatasets(prev => [
        ...prev,
        {
          name: newDatasetName,
          data: newAttentionData
        }
      ]);

      setCustomDatasetCount(prev => prev + 1);
      setSelectedDatasetIndex(datasets.length);
      setSelectedTokenIndex(null);
      setMaskedTokenIndex(null);
      setIsProcessing(false);
    }, 500);
  }, [datasets.length, customDatasetCount]);

  const handleMaskWord = useCallback((tokenIndex: number) => {
    // Don't allow masking [CLS] or [SEP] tokens
    if (currentData.tokens[tokenIndex].text === "[CLS]" || currentData.tokens[tokenIndex].text === "[SEP]") {
      return;
    }
    setMaskedTokenIndex(prevIndex => prevIndex === tokenIndex ? null : tokenIndex);
  }, [currentData.tokens]);

  // Add event listener for token selection from ParallelView
  useEffect(() => {
    const handleTokenSelection = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && 'tokenIndex' in customEvent.detail) {
        setSelectedTokenIndex(customEvent.detail.tokenIndex);
      }
    };

    window.addEventListener('token-selection-change', handleTokenSelection);

    return () => {
      window.removeEventListener('token-selection-change', handleTokenSelection);
    };
  }, []);

  // Get predictions for the masked token
  const maskPredictions: WordPrediction[] | null = maskedTokenIndex !== null && currentData.maskPredictions
    ? currentData.maskPredictions.find(mp => mp.tokenIndex === maskedTokenIndex)?.predictions || null
    : null;

  // Prepare word attention data for the bar chart
  const wordAttentionData: WordAttentionData = selectedTokenIndex !== null ? {
    sourceWord: currentData.tokens[selectedTokenIndex].text,
    targetWords: currentData.tokens.map(token => token.text),
    attentionValues: currentHead.attention[selectedTokenIndex]
  } : {
    sourceWord: '',
    targetWords: [],
    attentionValues: []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto p-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-xl shadow-md p-5 border border-indigo-100">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Brain size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BERT Attention Visualizer</h1>
              <p className="text-sm text-gray-500">Explore transformer attention patterns and masked word predictions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Show information"
            >
              <Info size={20} className="text-gray-700" />
            </button>
          </div>
        </header>

        {/* Input Section */}
        <div className="flex flex-col space-y-4">
          <SentenceInput onSentenceSubmit={handleSentenceSubmit} isLoading={isProcessing} />


        </div>

        {/* Main Visualization Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <AttentionHeadSelector
              layers={currentData.layers}
              selectedLayer={selectedLayer}
              selectedHead={selectedHead}
              onLayerChange={setSelectedLayer}
              onHeadChange={setSelectedHead}
            />

            <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Database size={16} className="mr-2 text-indigo-600" />
                Dataset Info
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Tokens: <span className="font-medium">{currentData.tokens.length}</span></p>
                <p>• Layers: <span className="font-medium">{currentData.layers.length}</span></p>
                <p>• Heads per layer: <span className="font-medium">{currentData.layers[0].heads.length}</span></p>
                <p>• Special tokens: <span className="font-medium">[CLS], [SEP]</span></p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Visualization Type</h3>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setActiveView('matrix')}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${activeView === 'matrix'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Grid size={18} className="mr-2" />
                  Matrix View
                </button>
                <button
                  onClick={() => setActiveView('parallel')}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${activeView === 'parallel'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <GitBranch size={18} className="mr-2" />
                  Parallel View
                </button>
              </div>
            </div>
          </div>

          {/* Main Visualization Container */}
          <div className="md:col-span-3 flex flex-col space-y-6">
            {/* Visualization View */}
            <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  {activeView === 'matrix' ? (
                    <Grid size={20} className="mr-2 text-indigo-600" />
                  ) : (
                    <GitBranch size={20} className="mr-2 text-indigo-600" />
                  )}
                  {activeView === 'matrix' ? 'Attention Matrix' : 'Attention Flow'}
                </h2>
                <div className="text-sm text-gray-500 flex items-center">
                  <span className="mr-3">Layer {selectedLayer + 1}, Head {selectedHead + 1}</span>
                  {selectedTokenIndex !== null && (
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                      Focus: "{currentData.tokens[selectedTokenIndex].text}"
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-center items-center">
                {activeView === 'matrix' ? (
                  <AttentionMatrix
                    tokens={currentData.tokens}
                    head={currentHead}
                    width={800}
                    height={500}
                    selectedTokenIndex={selectedTokenIndex}
                  />
                ) : (
                  <ParallelView
                    tokens={currentData.tokens}
                    head={currentHead}
                    width={800}
                    height={500}
                    selectedTokenIndex={selectedTokenIndex}
                  />
                )}
              </div>
            </div>

            {/* Bar Chart - Always show when token is selected (for both views) */}
            {selectedTokenIndex !== null && (
              <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart size={20} className="mr-2 text-indigo-600" />
                    Token Attention Distribution
                  </h2>
                </div>
                <div className="flex justify-center">
                  <WordAttentionBarChart
                    data={wordAttentionData}
                    width={750}
                    height={300}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <WordMasking
          tokens={currentData.tokens}
          onMaskWord={handleMaskWord}
          maskedTokenIndex={maskedTokenIndex}
          predictions={maskPredictions}
        />

        {/* Information Panel */}
        {showInfo && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Info size={20} className="mr-2 text-indigo-600" />
                About BERT Attention Visualization
              </h2>
              <button
                onClick={() => setShowInfo(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">BERT Special Tokens</h3>
                <p className="text-gray-600 mb-3 text-sm">
                  BERT uses special tokens: <code className="bg-gray-100 px-1 rounded">[CLS]</code> appears at the beginning of each sequence and is used for classification tasks. <code className="bg-gray-100 px-1 rounded">[SEP]</code> marks the end of segments.
                </p>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">Word Masking</h3>
                <p className="text-gray-600 mb-3 text-sm">
                  BERT is pre-trained with a masked language modeling objective. When words are masked, the model predicts the original content based on the surrounding context.
                </p>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">Matrix View</h3>
                <p className="text-gray-600 mb-3 text-sm">
                  The matrix visualization shows attention weights between tokens as a heatmap. Each cell represents how much a token (row) attends to another token (column).
                </p>
                <p className="text-gray-600 mb-3 text-sm">
                  Darker colors indicate higher attention weights. The percentages show the relative attention weight, with each row summing to 100%.
                </p>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">Parallel View</h3>
                <p className="text-gray-600 mb-3 text-sm">
                  The parallel view shows connections between tokens with curved lines. Thicker lines represent stronger attention connections.
                </p>
                <p className="text-gray-600 mb-3 text-sm">
                  Click on any source token to focus on its specific attention patterns. This view is particularly useful for visualizing the flow of attention across the sentence.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttentionVisualizer;
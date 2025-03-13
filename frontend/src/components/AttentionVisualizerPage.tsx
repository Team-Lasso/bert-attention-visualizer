import React from "react";
import useAttentionVisualizer from "../hooks/useAttentionVisualizer";
import { SampleData } from "../types";
import { pretrainedModels } from "../data/pretrainedModels";



// Layout Components
import AppHeader from "./layout/AppHeader";
import InfoPanel from "./layout/InfoPanel";

// Model Components
import ModelInfo from "./model/ModelInfo";
import PretrainedModelSelector from "./PretrainedModelSelector";

// Input Components
import SentenceInputSection from "./input/SentenceInputSection";
import WordMaskingSection from "./input/WordMaskingSection";
import PredictionsSection from "./input/PredictionsSection";

// Visualization Components
import VisualizationControls from "./visualization/VisualizationControls";
import VisualizationDisplay from "./visualization/VisualizationDisplay";
import AttentionHeadSelector from "./AttentionHeadSelector";

interface AttentionVisualizerPageProps {
  datasets: SampleData[];
}

const AttentionVisualizerPage: React.FC<AttentionVisualizerPageProps> = ({
  datasets,
}) => {
  // use the hook to get the data and the processing status
  const {
    // data and processing status
    currentData,
    isProcessing,
    hasUserInput,

    // model information
    currentModel,
    showModelSelector,
    isModelLoading,
    selectedModelId,
    setShowModelSelector,

    // view control
    selectedLayer,
    selectedHead,
    activeView,
    currentHeadData,
    setSelectedLayer,
    setSelectedHead,
    switchView,

    // Token interaction
    selectedTokenIndex,
    maskedTokenIndex,
    selectedPrediction,
    selectedTokenText,
    maskPredictions,

    // generated data
    tokensWithIndex,
    wordAttentionData,

    // processing functions
    handleSentenceSubmit,
    handleMaskWord,
    handleModelSelect,
    handleLoadModel,
    handleSelectPrediction,
  } = useAttentionVisualizer(datasets);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto p-6">
        {/* Header */}
        <AppHeader
          currentModelName={currentModel?.name || "No model selected"}
          showModelSelector={showModelSelector}
          onToggleModelSelector={() => setShowModelSelector(!showModelSelector)}
        />

        {/* Model Selector */}
        {showModelSelector && (
          <div className="animate-fadeIn">
            <PretrainedModelSelector
              availableModels={pretrainedModels}
              onModelSelect={handleModelSelect}
              selectedModelId={selectedModelId}
              isLoading={isModelLoading}
              onUseModel={handleLoadModel}
            />
          </div>
        )}

        {/* Input Section - Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SentenceInputSection
            onSentenceSubmit={handleSentenceSubmit}
            isLoading={isProcessing}
            currentModelName={currentModel?.name || "Default Model"}
          />

          <WordMaskingSection
            tokens={tokensWithIndex || []}
            onMaskWord={handleMaskWord}
            maskedTokenIndex={maskedTokenIndex}
            hasUserInput={hasUserInput}
          />

          <PredictionsSection
            maskedTokenIndex={maskedTokenIndex}
            maskPredictions={maskPredictions || []}
            selectedPrediction={selectedPrediction}
            onSelectPrediction={handleSelectPrediction}
            hasUserInput={hasUserInput}
          />
        </div>

        {/* Main Visualization Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
            {currentData && currentData.layers && currentData.layers.length > 0 ? (
              <AttentionHeadSelector
                layers={currentData.layers.map((layer, index) => ({
                  ...layer,
                  layerIndex: index,
                  heads: layer.heads.map((head, headIndex) => ({
                    ...head,
                    headIndex,
                  })),
                }))}
                selectedLayer={selectedLayer}
                selectedHead={selectedHead}
                onLayerChange={setSelectedLayer}
                onHeadChange={setSelectedHead}
              />
            ) : (
              <div className="flex flex-col space-y-4 p-5 bg-white rounded-xl shadow-md border border-indigo-100">
                <div className="text-center p-4">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Available</h3>
                  <p className="text-sm text-gray-600">
                    Please enter a sentence in the input field above to visualize attention data.
                  </p>
                </div>
              </div>
            )}

            {currentData && currentData.tokens && (
              <ModelInfo
                model={currentModel}
                tokenCount={currentData.tokens?.length || 0}
                layerCount={currentData.layers?.length || 0}
                headsPerLayer={currentData.layers?.[0]?.heads?.length || 0}
              />
            )}

            {currentData && currentData.layers && currentData.layers.length > 0 && (
              <VisualizationControls
                activeView={activeView}
                onViewChange={switchView}
                selectedLayer={selectedLayer}
                selectedHead={selectedHead}
                selectedTokenText={selectedTokenText || ""}
              />
            )}
          </div>

          {/* Main Visualization */}
          <div className="md:col-span-3">
            {currentData && currentData.layers && currentData.layers.length > 0 && currentHeadData ? (
              <VisualizationDisplay
                tokens={tokensWithIndex || []}
                currentHead={{
                  ...currentHeadData,
                  headIndex: selectedHead,
                }}
                selectedLayer={selectedLayer}
                selectedHead={selectedHead}
                selectedTokenIndex={selectedTokenIndex}
                activeView={activeView}
                wordAttentionData={wordAttentionData}
              />
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-md border border-indigo-100 h-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-gray-700 mb-3">Attention Visualization</h3>
                  <p className="text-gray-600 mb-4">
                    Enter a sentence above to see attention patterns from the model.
                  </p>
                  <div className="inline-block p-3 bg-indigo-100 rounded-full text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Panel */}
        <InfoPanel />
      </div>
    </div>
  );
};

export default AttentionVisualizerPage;

import React, { useState } from "react";
import useAttentionVisualizer from "../hooks/useAttentionVisualizer";
import { SampleData } from "../types";
import { pretrainedModels } from "../data/pretrainedModels";

// Layout Components
import AppHeader from "./layout/AppHeader";

// Model Components
import PretrainedModelSelector from "./PretrainedModelSelector";

// Input Components
import SentenceInputSection from "./input/SentenceInputSection";
import WordMaskingSection from "./input/WordMaskingSection";
import PredictionsSection from "./input/PredictionsSection";

// Visualization Components
import VisualizationControls from "./visualization/VisualizationControls";
import VisualizationDisplay from "./visualization/VisualizationDisplay";
import AttentionComparisonView from "./visualization/AttentionComparisonView";

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
    currentSentence,

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
    attentionDataForCurrentView,
    setSelectedLayer,
    setSelectedHead,
    switchView,

    // Token interaction
    selectedTokenIndex,
    maskedTokenIndex,
    selectedPrediction,
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

    // Add comparison-related states and functions
    isComparing,
    isLoadingComparison,
    comparisonData,
    comparisonView,
    exitComparison,
    setComparisonView,
    handleViewAttentionComparison,

    // Visualization method
    visualizationMethod,
    handleVisualizationMethodChange,

    // Layer-head summary
    showLayerHeadSummary,
    toggleLayerHeadSummary,

    // New average attention toggle functionality
    showAverageAttention,
    toggleAverageAttention,

    // New hide special tokens toggle functionality
    hideSpecialTokens,
    toggleHideSpecialTokens,

    // New token visibility toggle functionality
    tokenVisibility,
    toggleTokenVisibility,
  } = useAttentionVisualizer(datasets);

  // Matrix percentage visibility state
  const [showPercentages, setShowPercentages] = useState<boolean>(true);

  const togglePercentages = () => {
    setShowPercentages(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <AppHeader
        currentModelName={currentModel?.name || "No model selected"}
        showModelSelector={showModelSelector}
        onToggleModelSelector={() => setShowModelSelector(!showModelSelector)}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Model Selector */}
        {showModelSelector && (
          <div className="animate-fadeIn mb-6">
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
            sentence={currentSentence}
            isProcessing={isProcessing}
            onSentenceSubmit={handleSentenceSubmit}
          />

          <WordMaskingSection
            tokens={tokensWithIndex}
            hasUserInput={hasUserInput}
            onMaskWord={handleMaskWord}
            maskedTokenIndex={maskedTokenIndex}
            tokenVisibility={tokenVisibility}
          />

          <PredictionsSection
            hasUserInput={hasUserInput}
            maskedTokenIndex={maskedTokenIndex}
            maskPredictions={maskPredictions}
            selectedPrediction={selectedPrediction}
            onSelectPrediction={handleSelectPrediction}
            onViewComparison={handleViewAttentionComparison}
            isLoadingComparison={isLoadingComparison}
          />
        </div>

        {/* Visualization Section */}
        {hasUserInput && (
          <div className="grid grid-cols-1 gap-6 mt-6">
            <VisualizationControls
              selectedLayer={selectedLayer}
              selectedHead={selectedHead}
              activeView={isComparing ? comparisonView : activeView}
              onSelectLayer={setSelectedLayer}
              onSelectHead={setSelectedHead}
              onSwitchView={isComparing ? setComparisonView : switchView}
              totalLayers={currentData?.layers?.length || 0}
              totalHeads={currentData?.layers?.[0]?.heads?.length || 0}
              view="single"
              visualizationMethod={visualizationMethod}
              onVisualizationMethodChange={handleVisualizationMethodChange}
              showLayerHeadSummary={showLayerHeadSummary}
              onToggleLayerHeadSummary={toggleLayerHeadSummary}
              showAverageAttention={showAverageAttention}
              onToggleAverageAttention={toggleAverageAttention}
              showPercentages={showPercentages}
              onTogglePercentages={togglePercentages}
              tokenVisibility={tokenVisibility}
              onToggleTokenVisibility={toggleTokenVisibility}
              modelType={selectedModelId || "bert-base-uncased"}
              hideSpecialTokens={hideSpecialTokens}
              onToggleHideSpecialTokens={toggleHideSpecialTokens}
            />

            {/* Show either comparison view or regular view based on state */}
            {isComparing && comparisonData.before && comparisonData.after ? (
              <AttentionComparisonView
                beforeData={comparisonData.before}
                afterData={comparisonData.after}
                selectedLayer={selectedLayer}
                selectedHead={selectedHead}
                selectedTokenIndex={selectedTokenIndex}
                activeView={comparisonView}
                replacementWord={comparisonData.replacementWord}
                wordIndex={comparisonData.wordIndex}
                onExitComparison={exitComparison}
                visualizationMethod={comparisonData.visualizationMethod}
              />
            ) : (
              <VisualizationDisplay
                tokens={tokensWithIndex}
                currentHead={attentionDataForCurrentView || {
                  headIndex: selectedHead,
                  attention: []
                }}
                selectedLayer={selectedLayer}
                selectedHead={selectedHead}
                selectedTokenIndex={selectedTokenIndex}
                activeView={activeView}
                wordAttentionData={wordAttentionData}
                visualizationMethod={visualizationMethod}
                showLayerHeadSummary={showLayerHeadSummary}
                showAverageAttention={showAverageAttention}
                showPercentages={showPercentages}
                tokenVisibility={tokenVisibility}
                attentionData={currentData}
                onSelectLayerHead={(layer, head) => {
                  setSelectedLayer(layer);
                  setSelectedHead(head);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttentionVisualizerPage;

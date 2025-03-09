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
  // 使用重构后的钩子
  const {
    // 数据和处理状态
    currentData,
    isProcessing,
    hasUserInput,

    // 模型信息
    currentModel,
    showModelSelector,
    isModelLoading,
    selectedModelId,
    setShowModelSelector,

    // 视图控制
    selectedLayer,
    selectedHead,
    activeView,
    currentHeadData,
    setSelectedLayer,
    setSelectedHead,
    switchView,

    // Token交互
    selectedTokenIndex,
    maskedTokenIndex,
    selectedPrediction,
    selectedTokenText,
    maskPredictions,

    // 生成的数据
    tokensWithIndex,
    wordAttentionData,

    // 处理函数
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
          currentModelName={currentModel.name}
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
            currentModelName={currentModel.name}
          />

          <WordMaskingSection
            tokens={tokensWithIndex}
            onMaskWord={handleMaskWord}
            maskedTokenIndex={maskedTokenIndex}
            hasUserInput={hasUserInput}
          />

          <PredictionsSection
            maskedTokenIndex={maskedTokenIndex}
            maskPredictions={maskPredictions}
            selectedPrediction={selectedPrediction}
            onSelectPrediction={handleSelectPrediction}
            hasUserInput={hasUserInput}
          />
        </div>

        {/* Main Visualization Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
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

            <ModelInfo
              model={currentModel}
              tokenCount={currentData.tokens.length}
              layerCount={currentData.layers.length}
              headsPerLayer={currentData.layers[0].heads.length}
            />

            <VisualizationControls
              activeView={activeView}
              onViewChange={switchView}
              selectedLayer={selectedLayer}
              selectedHead={selectedHead}
              selectedTokenText={selectedTokenText}
            />
          </div>

          {/* Main Visualization */}
          <div className="md:col-span-3">
            <VisualizationDisplay
              tokens={tokensWithIndex}
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
          </div>
        </div>

        {/* Information Panel */}
        <InfoPanel />
      </div>
    </div>
  );
};

export default AttentionVisualizerPage;

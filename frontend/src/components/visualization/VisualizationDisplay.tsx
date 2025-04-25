import React from "react";
import { Grid, GitBranch, AlertCircle } from "lucide-react";
import { AttentionData, AttentionHead, Token } from "../../types";
import AttentionMatrix from "../AttentionMatrix";
import ParallelView from "../ParallelView";
import WordAttentionBarChart from "../WordAttentionBarChart";
import { VisualizationMethod } from "./VisualizationMethodSelector";
import LayerHeadSummary from "./LayerHeadSummary";
import AverageAttentionPerLayer from "./AverageAttentionPerLayer";

//todo: on attention flow section, Jay said he want the stright line, but now it's a curve

interface VisualizationDisplayProps {
  tokens: Token[];
  currentHead: AttentionHead;
  selectedLayer: number;
  selectedHead: number;
  selectedTokenIndex: number | null;
  activeView: "matrix" | "parallel";
  wordAttentionData: {
    sourceWord: string;
    targetWords: string[];
    attentionValues: number[];
  };
  visualizationMethod?: VisualizationMethod;
  showLayerHeadSummary?: boolean;
  showAverageAttention?: boolean;
  showPercentages?: boolean;
  tokenVisibility?: {
    cls: boolean;
    sep: boolean;
    s_token: boolean;
    _s_token: boolean;
    period: boolean;
    pad: boolean;
  };
  attentionData?: AttentionData;
  onSelectLayerHead?: (layer: number, head: number) => void;
}

const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({
  tokens,
  currentHead,
  selectedLayer,
  selectedHead,
  selectedTokenIndex,
  activeView,
  wordAttentionData,
  visualizationMethod = "raw",
  showLayerHeadSummary = false,
  showAverageAttention = false,
  showPercentages = true,
  tokenVisibility = {
    cls: true,
    sep: true,
    s_token: true,
    _s_token: true,
    period: true,
    pad: true
  },
  attentionData,
  onSelectLayerHead
}) => {
  // Determine if we're using an aggregate method
  const isAggregateMethod = visualizationMethod === "rollout" || visualizationMethod === "flow";

  // Helper function to get method display name
  const getMethodDisplayName = () => {
    switch (visualizationMethod) {
      case "rollout": return "Attention Rollout";
      case "flow": return "Attention Flow";
      default: return "Raw Attention";
    }
  };

  // Get the title for the matrix visualization
  const getMatrixTitle = () => {
    if (showAverageAttention) {
      return "Average Attention Matrix";
    } else if (currentHead.headIndex >= 0) {
      return `Head ${currentHead.headIndex + 1} Attention Matrix`;
    } else {
      return "Attention Matrix";
    }
  };

  // Check if any tokens are hidden
  const areAnyTokensHidden = !tokenVisibility.cls || !tokenVisibility.sep ||
    !tokenVisibility.s_token || !tokenVisibility._s_token || !tokenVisibility.period || !tokenVisibility.pad;

  // Helper function to get hidden token types as a string
  const getHiddenTokensString = () => {
    const hidden = [];
    if (!tokenVisibility.cls) hidden.push("CLS");
    if (!tokenVisibility.sep) hidden.push("SEP");
    if (!tokenVisibility.s_token) hidden.push("<s>");
    if (!tokenVisibility._s_token) hidden.push("</s>");
    if (!tokenVisibility.period) hidden.push("periods");
    if (!tokenVisibility.pad) hidden.push("PAD");
    return hidden.join(", ");
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Layer Head Summary (if enabled) */}
      {showLayerHeadSummary && attentionData && onSelectLayerHead && (
        <LayerHeadSummary
          attentionData={attentionData}
          tokens={tokens}
          selectedLayer={selectedLayer}
          selectedHead={selectedHead}
          onSelectLayerHead={onSelectLayerHead}
        />
      )}

      {/* Average Attention Per Layer (if enabled) */}
      {showAverageAttention && attentionData && (
        <AverageAttentionPerLayer
          key={`avg-attention-${tokens.length}-${attentionData.layers.length}`}
          attentionData={attentionData}
          tokens={tokens}
          selectedLayer={selectedLayer}
          onSelectLayer={(layer) => onSelectLayerHead && onSelectLayerHead(layer, selectedHead)}
        />
      )}

      {/* Visualization View */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            {activeView === "matrix" ? (
              <Grid size={20} className="mr-2 text-indigo-600" />
            ) : (
              <GitBranch size={20} className="mr-2 text-indigo-600" />
            )}
            {activeView === "matrix"
              ? "Token Attention Matrix"
              : "Subword Token Flow"}
            {isAggregateMethod && (
              <span className="ml-2 text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                {getMethodDisplayName()}
              </span>
            )}
            {!isAggregateMethod && showAverageAttention && (
              <span className="ml-2 text-sm text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
                Average Attention
              </span>
            )}
          </h2>
          <div className="text-sm text-gray-500 flex items-center">
            {isAggregateMethod ? (
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                Aggregated across all layers and heads
              </span>
            ) : showAverageAttention ? (
              <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
                Layer {selectedLayer + 1} (averaged across all heads)
              </span>
            ) : (
              <span className="mr-3">
                Layer {selectedLayer + 1}, Head {selectedHead + 1}
              </span>
            )}
            {selectedTokenIndex !== null && (
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full ml-2">
                Focus: "{tokens[selectedTokenIndex].text}"
              </span>
            )}
            {areAnyTokensHidden && (
              <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full ml-2">
                Hidden: {getHiddenTokensString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-center items-center">
          {activeView === "matrix" ? (
            <div className="flex flex-col items-center w-full">
              <h3 className="text-base font-medium text-gray-600 mb-3">{getMatrixTitle()}</h3>
              <AttentionMatrix
                tokens={tokens}
                head={currentHead}
                width={1000}
                height={600}
                selectedTokenIndex={selectedTokenIndex}
                skipTitle={true}
                showPercentages={showPercentages}
              />
            </div>
          ) : (
            <ParallelView
              tokens={tokens}
              head={currentHead}
              width={1000}
              height={tokens.length <= 10 ? 400 : 700}
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
              Token Attention Distribution
              {isAggregateMethod && (
                <span className="ml-2 text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  {getMethodDisplayName()}
                </span>
              )}
              {!isAggregateMethod && showAverageAttention && (
                <span className="ml-2 text-sm text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
                  Average Attention
                </span>
              )}
            </h2>
            {areAnyTokensHidden && wordAttentionData.sourceWord === "" && (
              <div className="text-amber-600 flex items-center bg-amber-50 px-3 py-1 rounded-full">
                <AlertCircle size={15} className="mr-2" />
                Selected token is hidden
              </div>
            )}
          </div>
          <div className="flex justify-center">
            {areAnyTokensHidden && wordAttentionData.sourceWord === "" ? (
              <div className="p-10 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">The selected token is currently hidden.</p>
                <p className="text-gray-500 mt-2">To see its attention distribution, adjust token visibility settings.</p>
              </div>
            ) : (
              <WordAttentionBarChart
                data={wordAttentionData}
                width={900}
                height={400}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationDisplay;

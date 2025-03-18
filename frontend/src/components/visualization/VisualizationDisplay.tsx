import React from "react";
import { Grid, GitBranch } from "lucide-react";
import { AttentionHead, Token } from "../../types";
import AttentionMatrix from "../AttentionMatrix";
import ParallelView from "../ParallelView";
import WordAttentionBarChart from "../WordAttentionBarChart";

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
}

const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({
  tokens,
  currentHead,
  selectedLayer,
  selectedHead,
  selectedTokenIndex,
  activeView,
  wordAttentionData,
}) => {
  return (
    <div className="flex flex-col space-y-6">
      {/* Visualization View */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            {activeView === "matrix" ? (
              <Grid size={20} className="mr-2 text-indigo-600" />
            ) : (
              <GitBranch size={20} className="mr-2 text-indigo-600" />
            )}
            {activeView === "matrix" ? "Token Attention Matrix" : "Subword Token Flow"}
          </h2>
          <div className="text-sm text-gray-500 flex items-center">
            <span className="mr-3">
              Layer {selectedLayer + 1}, Head {selectedHead + 1}
            </span>
            {selectedTokenIndex !== null && (
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                Focus: "{tokens[selectedTokenIndex].text}"
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-center items-center">
          {activeView === "matrix" ? (
            <AttentionMatrix
              tokens={tokens}
              head={{
                ...currentHead,
                headIndex: selectedHead,
              }}
              width={1000}
              height={600}
              selectedTokenIndex={selectedTokenIndex}
            />
          ) : (
            <ParallelView
              tokens={tokens}
              head={{
                ...currentHead,
                headIndex: selectedHead,
              }}
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
            </h2>
          </div>
          <div className="flex justify-center">
            <WordAttentionBarChart
              data={wordAttentionData}
              width={900}
              height={400}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationDisplay;

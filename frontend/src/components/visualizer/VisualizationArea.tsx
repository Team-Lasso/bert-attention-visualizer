import React from "react";
import { Grid, GitBranch, BarChart } from "lucide-react";
import AttentionMatrix from "../AttentionMatrix";
import ParallelView from "../ParallelView";
import WordAttentionBarChart from "../WordAttentionBarChart";
import { AttentionHead, AttentionData, WordAttentionData } from "../../types";

interface VisualizationAreaProps {
  activeView: "matrix" | "parallel";
  currentData: AttentionData;
  currentHead: AttentionHead;
  selectedLayer: number;
  selectedHead: number;
  selectedTokenIndex: number | null;
  wordAttentionData: WordAttentionData;
}

const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  activeView,
  currentData,
  currentHead,
  selectedLayer,
  selectedHead,
  selectedTokenIndex,
  wordAttentionData,
}) => {
  return (
    <div className="md:col-span-3 flex flex-col space-y-6">
      {/* Visualization View */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            {activeView === "matrix" ? (
              <Grid size={20} className="mr-2 text-indigo-600" />
            ) : (
              <GitBranch size={20} className="mr-2 text-indigo-600" />
            )}
            {activeView === "matrix" ? "Attention Matrix" : "Attention Flow"}
          </h2>
          <div className="text-sm text-gray-500 flex items-center">
            <span className="mr-3">
              Layer {selectedLayer + 1}, Head {selectedHead + 1}
            </span>
            {selectedTokenIndex !== null && (
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                Focus: "{currentData.tokens[selectedTokenIndex].text}"
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-center items-center">
          {activeView === "matrix" ? (
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
  );
};

export default VisualizationArea; 
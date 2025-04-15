import React from "react";
import { Grid, GitBranch, Layers, Hash, AlertCircle } from "lucide-react";
import VisualizationMethodSelector, { VisualizationMethod } from "./VisualizationMethodSelector";

interface VisualizationControlsProps {
  activeView: "matrix" | "parallel";
  onSwitchView: (view: "matrix" | "parallel") => void;
  selectedLayer: number;
  selectedHead: number;
  onSelectLayer: (layer: number) => void;
  onSelectHead: (head: number) => void;
  totalLayers: number;
  totalHeads: number;
  view?: "single" | "comparison";
  visualizationMethod?: VisualizationMethod;
  onVisualizationMethodChange?: (method: VisualizationMethod) => void;
}

const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  activeView,
  onSwitchView,
  selectedLayer,
  selectedHead,
  onSelectLayer,
  onSelectHead,
  totalLayers,
  totalHeads,
  view = "single",
  visualizationMethod = "raw",
  onVisualizationMethodChange
}) => {
  // Determine if layer/head selection should be disabled
  const isAggregateMethod = visualizationMethod === "rollout" || visualizationMethod === "flow";

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* View Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            {view === "comparison" ? "Comparison View" : "Visualization Type"}
          </h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => onSwitchView("matrix")}
              className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${activeView === "matrix"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <Grid size={18} className="mr-2" />
              Matrix View
            </button>
            <button
              onClick={() => onSwitchView("parallel")}
              className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${activeView === "parallel"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <GitBranch size={18} className="mr-2" />
              Parallel View
            </button>
          </div>
        </div>

        {/* Layer Selection */}
        <div className={isAggregateMethod ? "opacity-60" : ""}>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Layers size={16} className="mr-1" />
            Layer Selection
            {isAggregateMethod && (
              <div className="ml-2 text-amber-600 inline-flex items-center" title="Layer selection is disabled for rollout and flow visualization methods as they aggregate across all layers">
                <AlertCircle size={14} className="mr-1" />
                <span className="text-xs">Disabled for {visualizationMethod}</span>
              </div>
            )}
          </h3>
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <span className="text-sm text-gray-600 w-24">Current Layer:</span>
              <span className="font-medium text-indigo-700">{selectedLayer + 1} of {totalLayers}</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalLayers > 0 ? totalLayers - 1 : 0}
              value={selectedLayer}
              onChange={(e) => onSelectLayer(parseInt(e.target.value))}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isAggregateMethod ? "cursor-not-allowed" : ""}`}
              disabled={isAggregateMethod}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>{totalLayers}</span>
            </div>
          </div>
        </div>

        {/* Head Selection */}
        <div className={isAggregateMethod ? "opacity-60" : ""}>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Hash size={16} className="mr-1" />
            Head Selection
            {isAggregateMethod && (
              <div className="ml-2 text-amber-600 inline-flex items-center" title="Head selection is disabled for rollout and flow visualization methods as they average across all heads">
                <AlertCircle size={14} className="mr-1" />
                <span className="text-xs">Disabled for {visualizationMethod}</span>
              </div>
            )}
          </h3>
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <span className="text-sm text-gray-600 w-24">Current Head:</span>
              <span className="font-medium text-indigo-700">{selectedHead + 1} of {totalHeads}</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalHeads > 0 ? totalHeads - 1 : 0}
              value={selectedHead}
              onChange={(e) => onSelectHead(parseInt(e.target.value))}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isAggregateMethod ? "cursor-not-allowed" : ""}`}
              disabled={isAggregateMethod}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>{totalHeads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Method Selection */}
      {onVisualizationMethodChange && (
        <div className="border-t border-gray-200 pt-4">
          <VisualizationMethodSelector
            selectedMethod={visualizationMethod}
            onMethodChange={onVisualizationMethodChange}
          />
          {isAggregateMethod && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
              <p>
                {visualizationMethod === "rollout" ? (
                  <>
                    <span className="font-semibold">Attention Rollout</span> recursively combines attention weights
                    across layers by matrix multiplication to model how attention propagates through the network,
                    accounting for residual connections.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Attention Flow</span> treats the attention weights as a graph and
                    uses maximum flow algorithms to measure information flow between tokens, considering all possible
                    paths through the network.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualizationControls;

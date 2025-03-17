import React from "react";
import { Grid, GitBranch, Layers, Hash } from "lucide-react";

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
  view = "single"
}) => {
  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Layers size={16} className="mr-1" />
            Layer Selection
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>{totalLayers}</span>
            </div>
          </div>
        </div>

        {/* Head Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Hash size={16} className="mr-1" />
            Head Selection
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>{totalHeads}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationControls;

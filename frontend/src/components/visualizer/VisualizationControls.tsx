import React from "react";
import { Database, Grid, GitBranch } from "lucide-react";
import AttentionHeadSelector from "../AttentionHeadSelector";
import { AttentionData } from "../../types";

interface VisualizationControlsProps {
  currentData: AttentionData;
  currentModel: any;
  activeView: "matrix" | "parallel";
  setActiveView: (view: "matrix" | "parallel") => void;
  selectedLayer: number;
  selectedHead: number;
  setSelectedLayer: (layer: number) => void;
  setSelectedHead: (head: number) => void;
}

const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  currentData,
  currentModel,
  activeView,
  setActiveView,
  selectedLayer,
  selectedHead,
  setSelectedLayer,
  setSelectedHead,
}) => {
  return (
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
          Model & Dataset Info
        </h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            • Model: <span className="font-medium">{currentModel.name}</span>
          </p>
          <p>
            • Architecture:{" "}
            <span className="font-medium">{currentModel.architecture}</span>
          </p>
          <p>
            • Tokenizer:{" "}
            <span className="font-medium">{currentModel.tokenizer}</span>
          </p>
          <p>
            • Tokens:{" "}
            <span className="font-medium">{currentData.tokens.length}</span>
          </p>
          <p>
            • Layers:{" "}
            <span className="font-medium">{currentData.layers.length}</span>
          </p>
          <p>
            • Heads per layer:{" "}
            <span className="font-medium">
              {currentData.layers[0].heads.length}
            </span>
          </p>
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Visualization Type
        </h3>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setActiveView("matrix")}
            className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${
              activeView === "matrix"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Grid size={18} className="mr-2" />
            Matrix View
          </button>
          <button
            onClick={() => setActiveView("parallel")}
            className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${
              activeView === "parallel"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <GitBranch size={18} className="mr-2" />
            Parallel View
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualizationControls; 
import React from "react";
import { Grid, GitBranch } from "lucide-react";

interface VisualizationControlsProps {
  activeView: "matrix" | "parallel";
  onViewChange: (view: "matrix" | "parallel") => void;
  selectedLayer: number;
  selectedHead: number;
  selectedTokenText: string | null;
}

const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  activeView,
  onViewChange,
  selectedLayer,
  selectedHead,
  selectedTokenText,
}) => {
  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Visualization Type
      </h3>
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => onViewChange("matrix")}
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
          onClick={() => onViewChange("parallel")}
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

      <div className="mt-3 text-sm text-gray-500">
        <p className="mb-1">
          Layer: <span className="font-medium">{selectedLayer + 1}</span>
        </p>
        <p className="mb-1">
          Head: <span className="font-medium">{selectedHead + 1}</span>
        </p>
        {selectedTokenText && (
          <p className="mt-2 bg-indigo-50 p-2 rounded text-indigo-700">
            Selected: <span className="font-medium">"{selectedTokenText}"</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default VisualizationControls;

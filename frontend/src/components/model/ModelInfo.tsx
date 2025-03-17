import React from "react";
import { Database } from "lucide-react";
import { ModelConfig } from "../../types";

interface ModelInfoProps {
  model: ModelConfig;
  tokenCount: number;
  layerCount: number;
  headsPerLayer: number;
}

const ModelInfo: React.FC<ModelInfoProps> = ({
  model,
  tokenCount,
  layerCount,
  headsPerLayer,
}) => {
  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <Database size={16} className="mr-2 text-indigo-600" />
        Model & Dataset Info
      </h3>
      <div className="text-xs text-gray-600 space-y-1">
        <p>
          • Model: <span className="font-medium">{model.name}</span>
        </p>
        <p>
          • Architecture:{" "}
          <span className="font-medium">{model.architecture}</span>
        </p>
        <p>
          • Tokenizer: <span className="font-medium">{model.tokenizer}</span>
        </p>
        <p>
          • Tokens: <span className="font-medium">{tokenCount}</span>
        </p>
        <p>
          • Layers: <span className="font-medium">{layerCount}</span>
        </p>
        <p>
          • Heads per layer:{" "}
          <span className="font-medium">{headsPerLayer}</span>
        </p>
      </div>
    </div>
  );
};

export default ModelInfo;

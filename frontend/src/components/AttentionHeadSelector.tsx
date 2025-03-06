import React from 'react';
import { Layer } from '../types';
import { Layers, Cpu } from 'lucide-react';

interface AttentionHeadSelectorProps {
  layers: Layer[];
  selectedLayer: number;
  selectedHead: number;
  onLayerChange: (layerIndex: number) => void;
  onHeadChange: (headIndex: number) => void;
}

const AttentionHeadSelector: React.FC<AttentionHeadSelectorProps> = ({
  layers,
  selectedLayer,
  selectedHead,
  onLayerChange,
  onHeadChange,
}) => {
  const currentLayer = layers[selectedLayer];
  
  return (
    <div className="flex flex-col space-y-4 p-5 bg-white rounded-xl shadow-md border border-indigo-100">
      <div>
        <label htmlFor="layer-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Layers size={16} className="mr-2 text-indigo-600" />
          Layer
        </label>
        <select
          id="layer-select"
          value={selectedLayer}
          onChange={(e) => onLayerChange(Number(e.target.value))}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 bg-white border transition-colors"
        >
          {layers.map((layer) => (
            <option key={layer.layerIndex} value={layer.layerIndex}>
              Layer {layer.layerIndex + 1}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="head-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Cpu size={16} className="mr-2 text-indigo-600" />
          Attention Head
        </label>
        <select
          id="head-select"
          value={selectedHead}
          onChange={(e) => onHeadChange(Number(e.target.value))}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 bg-white border transition-colors"
        >
          {currentLayer.heads.map((head) => (
            <option key={head.headIndex} value={head.headIndex}>
              Head {head.headIndex + 1}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Attention Guide</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p className="flex items-center">
            <span className="w-2 h-2 bg-blue-900 rounded-full mr-2"></span>
            Darker colors = Higher attention
          </p>
          <p className="flex items-center">
            <span className="w-2 h-2 bg-blue-300 rounded-full mr-2"></span>
            Lighter colors = Lower attention
          </p>
          <p className="flex items-center">
            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
            Percentages show relative attention weight
          </p>
          <p className="flex items-center">
            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
            Each row sums to 100% of attention
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttentionHeadSelector;
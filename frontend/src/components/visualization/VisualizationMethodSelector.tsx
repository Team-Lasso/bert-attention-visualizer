import React from 'react';

export type VisualizationMethod = 'raw' | 'rollout' | 'flow';

interface VisualizationMethodSelectorProps {
    selectedMethod: VisualizationMethod;
    onMethodChange: (method: VisualizationMethod) => void;
}

const VisualizationMethodSelector: React.FC<VisualizationMethodSelectorProps> = ({
    selectedMethod,
    onMethodChange
}) => {
    return (
        <div className="flex flex-col">
            <label className="font-medium text-sm text-gray-700 mb-2">
                Attention Visualization Method
            </label>
            <div className="flex space-x-2">
                <MethodButton
                    method="raw"
                    selectedMethod={selectedMethod}
                    onMethodChange={onMethodChange}
                    label="Raw Attention"
                    tooltip="Show raw attention weights from model"
                />
                <MethodButton
                    method="rollout"
                    selectedMethod={selectedMethod}
                    onMethodChange={onMethodChange}
                    label="Attention Rollout"
                    tooltip="Recursively combine attention weights across layers to account for how attention propagates through the network"
                />
                <MethodButton
                    method="flow"
                    selectedMethod={selectedMethod}
                    onMethodChange={onMethodChange}
                    label="Attention Flow"
                    tooltip="Use maximum flow algorithm to measure information flow between tokens, accounting for all possible paths"
                />
            </div>
        </div>
    );
};

interface MethodButtonProps {
    method: VisualizationMethod;
    selectedMethod: VisualizationMethod;
    onMethodChange: (method: VisualizationMethod) => void;
    label: string;
    tooltip: string;
}

const MethodButton: React.FC<MethodButtonProps> = ({
    method,
    selectedMethod,
    onMethodChange,
    label,
    tooltip
}) => {
    const isSelected = method === selectedMethod;

    return (
        <button
            className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            onClick={() => onMethodChange(method)}
            title={tooltip}
        >
            {label}
        </button>
    );
};

export default VisualizationMethodSelector; 
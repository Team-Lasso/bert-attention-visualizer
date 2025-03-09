import React, { useState } from 'react';
import { ModelConfig, TrainingConfig, TrainingStatus } from '../types';
import { Cpu, Server, Book, BarChart2, RefreshCw } from 'lucide-react';

interface ModelSelectorProps {
    availableModels: ModelConfig[];
    onModelSelect: (modelId: string) => void;
    onStartTraining: (config: TrainingConfig) => void;
    selectedModelId: string | null;
    trainingStatus: TrainingStatus | null;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
    availableModels,
    onModelSelect,
    onStartTraining,
    selectedModelId,
    trainingStatus
}) => {
    const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
        epochs: 3,
        batchSize: 16,
        learningRate: 0.001,
        maxSequenceLength: 128
    });

    const selectedModel = selectedModelId
        ? availableModels.find(model => model.id === selectedModelId)
        : null;

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTrainingConfig({
            ...trainingConfig,
            [name]: name === 'epochs' || name === 'batchSize' || name === 'maxSequenceLength'
                ? parseInt(value, 10)
                : parseFloat(value)
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-indigo-100 overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-50 p-4 border-b border-indigo-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Server size={20} className="mr-2 text-indigo-600" />
                    Model Selection & Training
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Select a model to visualize or train on your data
                </p>
            </div>

            {/* Model Selection */}
            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Available Models</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {availableModels.map(model => (
                        <button
                            key={model.id}
                            onClick={() => onModelSelect(model.id)}
                            className={`p-3 rounded-lg border transition-all flex items-start text-left ${selectedModelId === model.id
                                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="mt-0.5 mr-3 text-indigo-600">
                                {model.icon === 'cpu' ? (
                                    <Cpu size={18} />
                                ) : model.icon === 'book' ? (
                                    <Book size={18} />
                                ) : (
                                    <Server size={18} />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">{model.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{model.parameters} • {model.architecture}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Model Details */}
            {selectedModel && (
                <div className="px-4 pb-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                        <h3 className="font-medium text-gray-800 mb-1">{selectedModel.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{selectedModel.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Architecture:</span> {selectedModel.architecture}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Parameters:</span> {selectedModel.parameters}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Tokenizer:</span> {selectedModel.tokenizer}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Default Layers/Heads:</span> {selectedModel.defaultLayers} / {selectedModel.defaultHeads}
                            </div>
                        </div>
                    </div>

                    {/* Training Configuration */}
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Training Configuration</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="epochs" className="block text-xs font-medium text-gray-700 mb-1">
                                Epochs
                            </label>
                            <input
                                type="number"
                                id="epochs"
                                name="epochs"
                                min="1"
                                max="10"
                                value={trainingConfig.epochs}
                                onChange={handleConfigChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="batchSize" className="block text-xs font-medium text-gray-700 mb-1">
                                Batch Size
                            </label>
                            <input
                                type="number"
                                id="batchSize"
                                name="batchSize"
                                min="4"
                                max="64"
                                step="4"
                                value={trainingConfig.batchSize}
                                onChange={handleConfigChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="learningRate" className="block text-xs font-medium text-gray-700 mb-1">
                                Learning Rate
                            </label>
                            <input
                                type="number"
                                id="learningRate"
                                name="learningRate"
                                min="0.0001"
                                max="0.01"
                                step="0.0001"
                                value={trainingConfig.learningRate}
                                onChange={handleConfigChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="maxSequenceLength" className="block text-xs font-medium text-gray-700 mb-1">
                                Max Sequence Length
                            </label>
                            <input
                                type="number"
                                id="maxSequenceLength"
                                name="maxSequenceLength"
                                min="32"
                                max="512"
                                step="16"
                                value={trainingConfig.maxSequenceLength}
                                onChange={handleConfigChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Training Status or Start Button */}
                    {trainingStatus && trainingStatus.isTraining ? (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-gray-700">
                                    Training Progress - Epoch {trainingStatus.currentEpoch}/{trainingStatus.totalEpochs}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {trainingStatus.elapsedTime ? `Elapsed: ${Math.round(trainingStatus.elapsedTime)}s` : ''}
                                    {trainingStatus.estimatedTimeRemaining ? ` • Remaining: ~${Math.round(trainingStatus.estimatedTimeRemaining)}s` : ''}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                                <div
                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                                    style={{ width: `${trainingStatus.progress * 100}%` }}
                                ></div>
                            </div>

                            {/* Metrics */}
                            {(trainingStatus.loss !== undefined || trainingStatus.accuracy !== undefined) && (
                                <div className="flex items-center justify-start gap-4 text-xs text-gray-500 mt-1">
                                    {trainingStatus.loss !== undefined && (
                                        <div className="flex items-center">
                                            <BarChart2 size={14} className="mr-1 text-indigo-500" />
                                            <span>Loss: {trainingStatus.loss.toFixed(4)}</span>
                                        </div>
                                    )}
                                    {trainingStatus.accuracy !== undefined && (
                                        <div className="flex items-center">
                                            <BarChart2 size={14} className="mr-1 text-green-500" />
                                            <span>Accuracy: {(trainingStatus.accuracy * 100).toFixed(2)}%</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => onStartTraining(trainingConfig)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Start Training
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ModelSelector; 
import React, { useState } from 'react';
import { ModelConfig } from '../types';
import { Cpu, Server, Book, ExternalLink, Search } from 'lucide-react';

// this part is used to select the pretrained model, like bert-base-uncased
// it is called in AttentionVisualizerPage.tsx
interface PretrainedModelSelectorProps {
    availableModels: ModelConfig[];
    onModelSelect: (modelId: string) => void;
    selectedModelId: string | null;
    isLoading?: boolean;
    onUseModel?: () => void;
}

const PretrainedModelSelector: React.FC<PretrainedModelSelectorProps> = ({
    availableModels,
    onModelSelect,
    selectedModelId,
    isLoading = false,
    onUseModel
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const selectedModel = selectedModelId
        ? availableModels.find(model => model.id === selectedModelId)
        : null;

    const filteredModels = searchTerm
        ? availableModels.filter(model =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.architecture.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : availableModels;

    return (
        <div className="bg-white rounded-xl shadow-md border border-indigo-100 overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-50 p-4 border-b border-indigo-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Server size={20} className="mr-2 text-indigo-600" />
                    Pretrained Model Selection
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Choose a pretrained Hugging Face BERT model to visualize
                </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Model Selection Grid */}
            <div className="p-4 border-b border-gray-100 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                    {filteredModels.map(model => (
                        <button
                            key={model.id}
                            onClick={() => onModelSelect(model.id)}
                            disabled={isLoading}
                            className={`p-3 rounded-lg border transition-all flex items-start text-left ${selectedModelId === model.id
                                ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="mt-0.5 mr-3 text-indigo-600 flex-shrink-0">
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
                                <div className="text-sm text-gray-600 mt-0.5">{model.description}</div>
                                <div className="text-xs text-gray-500 mt-1">{model.parameters} • {model.architecture}</div>
                            </div>
                        </button>
                    ))}

                    {filteredModels.length === 0 && (
                        <div className="text-center p-4 text-gray-500">
                            No models match your search criteria
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Model Details & Actions */}
            {selectedModel && (
                <div className="p-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                        <div className="flex justify-between">
                            <h3 className="font-medium text-gray-800">{selectedModel.name}</h3>
                            <a
                                href={`https://huggingface.co/models?search=${selectedModel.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                            >
                                View on Hugging Face
                                <ExternalLink size={14} className="ml-1" />
                            </a>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Layers:</span> {selectedModel.defaultLayers}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Attention Heads:</span> {selectedModel.defaultHeads}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Tokenizer:</span> {selectedModel.tokenizer}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <span className="font-medium mr-1">Parameters:</span> {selectedModel.parameters}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onUseModel}
                        disabled={isLoading}
                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading Model...
                            </>
                        ) : (
                            <>Use This Model</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PretrainedModelSelector; 
import React from "react";
import { Brain, Zap } from "lucide-react";

interface AppHeaderProps {
  currentModelName: string;
  showModelSelector: boolean;
  onToggleModelSelector: () => void;
}

// this part is used to show the model name and the model selector
const AppHeader: React.FC<AppHeaderProps> = ({
  currentModelName,
  showModelSelector,
  onToggleModelSelector,
}) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-xl shadow-md p-5 border border-indigo-100">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Brain size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            BERT Attention Visualizer
          </h1>
          <p className="text-sm text-gray-500">
            Explore transformer attention patterns and masked word predictions
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleModelSelector}
          className="px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center"
        >
          <Zap size={16} className="mr-1.5" />
          {showModelSelector ? "Hide Model Selector" : "Change Model"}
        </button>
      </div>
    </header>
  );
};

export default AppHeader;

import React from "react";
import { WordPrediction } from "../../types";

interface MaskPredictionPanelProps {
  maskedTokenIndex: number | null;
  predictions: WordPrediction[] | null;
  onSelectPrediction: (word: string) => void;
  progress: number;
}

const MaskPredictionPanel: React.FC<MaskPredictionPanelProps> = ({
  maskedTokenIndex,
  predictions,
  onSelectPrediction,
  progress,
}) => {
  if (progress > 0 && progress < 100) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-700">Loading predictions...</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            {progress < 30 && "Initializing model..."}
            {progress >= 30 && progress < 60 && "Processing tokens..."}
            {progress >= 60 && progress < 90 && "Calculating probabilities..."}
            {progress >= 90 && "Finalizing results..."}
          </div>
        </div>
      </div>
    );
  }

  if (maskedTokenIndex === null) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg flex-grow flex items-center justify-center">
        <p className="text-gray-500">
          Please select a word to mask in the middle panel
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 flex-grow">
      <div>
        <p className="text-gray-700 mb-2 font-medium">
          Prediction Results:
        </p>
        {predictions ? (
          <div className="grid grid-cols-1 gap-2 overflow-auto" style={{ maxHeight: "220px" }}>
            {predictions.map((prediction, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrediction(prediction.word)}
                className="flex items-center justify-between bg-white border border-gray-200 hover:bg-indigo-50 rounded-lg p-3 transition-colors"
              >
                <span className="font-medium">{prediction.word}</span>
                <div className="flex items-center">
                  <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${prediction.score * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {(prediction.score * 100).toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              No predictions available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaskPredictionPanel; 
import React from "react";
import { WordPrediction } from "../../types";

interface PredictionsSectionProps {
  maskedTokenIndex: number | null;
  maskPredictions: WordPrediction[] | null;
  selectedPrediction: string | null;
  onSelectPrediction: (word: string) => void;
  hasUserInput?: boolean;
}

const PredictionsSection: React.FC<PredictionsSectionProps> = ({
  maskedTokenIndex,
  maskPredictions,
  selectedPrediction,
  onSelectPrediction,
  hasUserInput = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100 min-h-[300px] flex flex-col">
      <div className="mb-2 flex items-center">
        <h2 className="text-lg font-semibold text-gray-800 mr-auto">
          Mask Word Predictions
        </h2>
      </div>

      {!hasUserInput ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg flex-grow flex items-center justify-center">
          <p className="text-gray-500">input a sentence on the left panel</p>
        </div>
      ) : maskedTokenIndex !== null ? (
        <div className="flex flex-col space-y-4 flex-grow">
          <div>
            <p className="text-gray-700 mb-2 font-medium">
              Prediction Results:
            </p>
            {maskPredictions ? (
              <div className="grid grid-cols-1 gap-2">
                {/* only show the first 5 predictions */}
                {maskPredictions.slice(0, 5).map((prediction, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPrediction(prediction.word)}
                    className={`flex items-center justify-between ${selectedPrediction === prediction.word
                        ? "bg-indigo-100 border-indigo-300 shadow-sm"
                        : "bg-white border-gray-200 hover:bg-indigo-50"
                      } rounded-lg p-3 transition-colors border`}
                  >
                    <span
                      className={
                        selectedPrediction === prediction.word
                          ? "font-bold"
                          : "font-medium"
                      }
                    >
                      {prediction.word}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div
                          className={`h-full ${selectedPrediction === prediction.word
                              ? "bg-indigo-700"
                              : "bg-indigo-600"
                            } rounded-full`}
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
                <p className="text-gray-500">Loading prediction results...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg flex-grow flex items-center justify-center">
          <p className="text-gray-500">select a word to mask</p>
        </div>
      )}
    </div>
  );
};

export default PredictionsSection;

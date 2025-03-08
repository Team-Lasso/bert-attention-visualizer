import React from "react";
import { Info } from "lucide-react";

const InformationPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Info size={20} className="mr-2 text-indigo-600" />
          About BERT Attention Visualization
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Pretrained Models
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            The visualizer supports various BERT-based models from Hugging
            Face. Each model has a different number of layers, attention
            heads, and parameters, offering unique attention patterns.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            BERT Special Tokens
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            BERT uses special tokens:{" "}
            <code className="bg-gray-100 px-1 rounded">[CLS]</code> appears
            at the beginning of each sequence and is used for classification
            tasks. <code className="bg-gray-100 px-1 rounded">[SEP]</code>{" "}
            marks the end of segments.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Word Masking
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            BERT is pre-trained with a masked language modeling objective.
            When words are masked, the model predicts the original content
            based on the surrounding context.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Matrix View
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            The matrix visualization shows attention weights between tokens
            as a heatmap. Each cell represents how much a token (row)
            attends to another token (column).
          </p>
          <p className="text-gray-600 mb-3 text-sm">
            Darker colors indicate higher attention weights. The percentages
            show the relative attention weight, with each row summing to
            100%.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Parallel View
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            The parallel view shows connections between tokens with curved
            lines. Thicker lines represent stronger attention connections.
          </p>
          <p className="text-gray-600 mb-3 text-sm">
            Click on any source token to focus on its specific attention
            patterns. This view is particularly useful for visualizing the
            flow of attention across the sentence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InformationPanel; 
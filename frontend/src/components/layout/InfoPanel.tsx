import React from "react";
import { Info } from "lucide-react";

const InfoPanel: React.FC = () => {
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
            The visualizer supports four transformer models from Hugging Face:
            <code className="bg-gray-100 px-1 rounded mx-1">BERT Base Uncased</code>,
            <code className="bg-gray-100 px-1 rounded mx-1">RoBERTa Base</code>,
            <code className="bg-gray-100 px-1 rounded mx-1">DistilBERT Base Uncased</code>, and
            <code className="bg-gray-100 px-1 rounded mx-1">TinyBERT 6 Layer</code>.
            Each model has a different architecture, number of layers, and attention patterns
            that can be explored and compared.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Special Tokens
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            Each model type uses different special tokens:
          </p>
          <ul className="text-gray-600 mb-3 text-sm list-disc pl-5">
            <li>
              <span className="font-medium">BERT, DistilBERT & TinyBERT:</span>{" "}
              <code className="bg-gray-100 px-1 rounded">[CLS]</code> appears at
              the beginning of each sequence and is used for classification tasks.{" "}
              <code className="bg-gray-100 px-1 rounded">[SEP]</code> marks the
              end of segments.
            </li>
            <li>
              <span className="font-medium">RoBERTa:</span>{" "}
              <code className="bg-gray-100 px-1 rounded">&lt;s&gt;</code> marks the
              beginning of sequences.{" "}
              <code className="bg-gray-100 px-1 rounded">&lt;/s&gt;</code> marks the
              end of sequences.{" "}
              <code className="bg-gray-100 px-1 rounded">&lt;pad&gt;</code> is used for padding.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Word Masking
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            All supported models are pre-trained with a masked language modeling objective. When
            words are masked, the model predicts the original content based on
            the surrounding context.
          </p>
          <p className="text-gray-600 mb-3 text-sm">
            Attention visualizations can reveal how attention patterns change before and after masking.
            Masked tokens often receive more focused attention as the model attempts to reconstruct
            the original word, showing how contextual information flows to masked positions.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Matrix View
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            The matrix visualization shows attention weights between tokens as a
            heatmap. Each cell represents how much a token (row) attends to
            another token (column).
          </p>
          <p className="text-gray-600 mb-3 text-sm">
            Darker colors indicate higher attention weights. The percentages
            show the relative attention weight, with each row summing to 100%.
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
            patterns. This view is particularly useful for visualizing the flow
            of attention across the sentence.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Attention Rollout
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            Attention Rollout recursively combines attention weights across all layers
            through matrix multiplication. This accounts for how attention propagates
            through the network and incorporates the effect of residual connections,
            providing a more holistic view of token relationships.
          </p>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            Attention Flow
          </h3>
          <p className="text-gray-600 mb-3 text-sm">
            Attention Flow treats the multi-layer attention weights as a graph network
            and uses maximum flow algorithms to measure information flow between tokens.
            This method accounts for all possible paths through the network, revealing
            important connections that might not be apparent in raw attention weights.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;

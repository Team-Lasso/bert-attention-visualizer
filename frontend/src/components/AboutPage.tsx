import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Book, Brain, Network, LayoutGrid, GitBranch, BarChart2, Layers } from "lucide-react";

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            {/* Consistent navbar */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Visualizer
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-800">
                        About BERT Attention Visualization
                    </h1>
                    <div className="w-28"></div> {/* Empty div for balance */}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Introduction */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Book size={20} className="mr-2 text-indigo-600" />
                        Introduction
                    </h2>
                    <p className="text-gray-700 mb-4">
                        This tool helps you visualize and understand attention mechanisms in transformer-based language models.
                        You can explore how different models attend to tokens in a sentence, see how masking affects attention patterns,
                        and compare different visualization methods.
                    </p>
                    <p className="text-gray-700">
                        Attention is a key component of transformer models that allows them to focus on different parts of the input
                        when generating representations. This visualization tool makes these complex attention patterns more accessible and interpretable.
                    </p>
                </div>

                {/* Models Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Brain size={20} className="mr-2 text-indigo-600" />
                        Pretrained Models
                    </h2>
                    <p className="text-gray-700 mb-4">
                        The visualizer supports four transformer models from Hugging Face:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">BERT Base Uncased</h3>
                            <p className="text-sm text-gray-600">The original BERT model with 12 layers, 12 attention heads, and 110M parameters.</p>
                            <p className="text-sm text-gray-600 mt-1">Uses WordPiece tokenization and was trained on a large corpus of English text.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">RoBERTa Base</h3>
                            <p className="text-sm text-gray-600">An optimized version of BERT with improved training methodology.</p>
                            <p className="text-sm text-gray-600 mt-1">Uses Byte-level BPE tokenization and was trained with a dynamic masking pattern.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">DistilBERT Base Uncased</h3>
                            <p className="text-sm text-gray-600">A distilled version of BERT with 6 layers, retaining 95% of BERT's performance with 40% fewer parameters.</p>
                            <p className="text-sm text-gray-600 mt-1">Uses the same WordPiece tokenization as BERT but runs faster due to its smaller size.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">TinyBERT 6 Layer</h3>
                            <p className="text-sm text-gray-600">A compressed BERT model using knowledge distillation, optimized for masked language modeling.</p>
                            <p className="text-sm text-gray-600 mt-1">Significantly smaller than BERT while maintaining good performance on many tasks.</p>
                        </div>
                    </div>
                </div>

                {/* Special Tokens Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Network size={20} className="mr-2 text-indigo-600" />
                        Special Tokens
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Each model type uses different special tokens that serve specific functions in the model architecture:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">BERT, DistilBERT & TinyBERT</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-600">
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">[CLS]</code> appears at the beginning of each sequence and is used for classification tasks.
                                </li>
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">[SEP]</code> marks the end of segments in the input.
                                </li>
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">[MASK]</code> is used to replace tokens for the masked language modeling objective.
                                </li>
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">[PAD]</code> is used to pad sequences to a uniform length.
                                </li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2">RoBERTa</h3>
                            <ul className="list-disc pl-5 text-sm text-gray-600">
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">&lt;s&gt;</code> marks the beginning of sequences.
                                </li>
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">&lt;/s&gt;</code> marks the end of sequences.
                                </li>
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">&lt;mask&gt;</code> is used for the masked language modeling task.
                                </li>
                                <li>
                                    <code className="bg-gray-200 px-1 rounded">&lt;pad&gt;</code> is used for padding sequences.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Visualization Methods */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <LayoutGrid size={20} className="mr-2 text-indigo-600" />
                        Visualization Methods
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                                <LayoutGrid size={16} className="mr-2 text-indigo-500" />
                                Matrix View
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                The matrix visualization shows attention weights between tokens as a
                                heatmap. Each cell represents how much a token (row) attends to
                                another token (column).
                            </p>
                            <p className="text-sm text-gray-600">
                                Darker colors indicate higher attention weights. The percentages
                                show the relative attention weight, with each row summing to 100%.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                                <GitBranch size={16} className="mr-2 text-indigo-500" />
                                Parallel View
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                The parallel view shows connections between tokens with curved
                                lines. Thicker lines represent stronger attention connections.
                            </p>
                            <p className="text-sm text-gray-600">
                                Click on any source token to focus on its specific attention
                                patterns. This view is particularly useful for visualizing the flow
                                of attention across the sentence.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                                <Layers size={16} className="mr-2 text-indigo-500" />
                                Layer Head Summary
                            </h3>
                            <p className="text-sm text-gray-600">
                                This visualization provides an overview of all attention heads within the selected layer,
                                showing a grid of small attention matrices that allows you to quickly identify which heads have
                                interesting attention patterns. Click on any head to select it for detailed examination.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                                <BarChart2 size={16} className="mr-2 text-indigo-500" />
                                Show Average Attention
                            </h3>
                            <p className="text-sm text-gray-600">
                                This toggle option displays attention patterns averaged across all heads in your selected layer,
                                rather than showing a single head's attention. This provides a consolidated view of the layer's
                                overall attention behavior, making it easier to understand general patterns without
                                head-specific variations.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                                <BarChart2 size={16} className="mr-2 text-indigo-500" />
                                Attention Rollout
                            </h3>
                            <p className="text-sm text-gray-600">
                                Attention Rollout recursively combines attention weights across all layers
                                through matrix multiplication. This accounts for how attention propagates
                                through the network and incorporates the effect of residual connections,
                                providing a more holistic view of token relationships.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                                <Network size={16} className="mr-2 text-indigo-500" />
                                Attention Flow
                            </h3>
                            <p className="text-sm text-gray-600">
                                Attention Flow treats the multi-layer attention weights as a graph network
                                and uses maximum flow algorithms to measure information flow between tokens.
                                This method accounts for all possible paths through the network, revealing
                                important connections that might not be apparent in raw attention weights.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Masking Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Book size={20} className="mr-2 text-indigo-600" />
                        Word Masking
                    </h2>
                    <p className="text-gray-700 mb-4">
                        All supported models are pre-trained with a masked language modeling objective. When
                        words are masked, the model predicts the original content based on
                        the surrounding context.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-2">How Masking Works</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            1. Select a token in the sentence to mask.
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            2. The model will predict the most likely words to fill that position.
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            3. Attention visualizations reveal how attention patterns change before and after masking.
                        </p>
                        <p className="text-sm text-gray-600">
                            4. Masked tokens often receive more focused attention as the model attempts to reconstruct
                            the original word, showing how contextual information flows to masked positions.
                        </p>
                    </div>
                </div>

                {/* References & Credits */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Book size={20} className="mr-2 text-indigo-600" />
                        References & Credits
                    </h2>
                    <p className="text-gray-700 mb-4">
                        This visualization tool builds on research in attention interpretability:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4">
                        <li>
                            <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                Attention Is All You Need (Vaswani et al., 2017)
                            </a> - The original transformer paper.
                        </li>
                        <li>
                            <a href="https://arxiv.org/abs/2005.00928" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                Quantifying Attention Flow in Transformers (Abnar & Zuidema, 2020)
                            </a> - Paper introducing attention rollout and attention flow methods.
                        </li>
                        <li>
                            <a href="https://arxiv.org/abs/1909.10351" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                TinyBERT: Distilling BERT for Natural Language Understanding (Jiao et al., 2020)
                            </a> - Paper describing the architecture and knowledge distillation methods for TinyBERT.
                        </li>
                        <li>
                            <a href="https://arxiv.org/abs/1908.08593" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                Revealing the Dark Secrets of BERT (Kovaleva et al., 2019)
                            </a> - Research analyzing attention patterns in BERT, showing that different heads use similar patterns with varying impact across tasks.
                        </li>
                    </ul>
                    <p className="text-gray-700">
                        Models are loaded from the <a href="https://huggingface.co/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Hugging Face Transformers</a> library.
                    </p>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm mt-8">
                    <p>© 2025 BERT Attention Visualizer</p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage; 
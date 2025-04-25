import React, { useState } from "react";
import { Grid, GitBranch, Layers, Hash, AlertCircle, LayoutGrid, BarChart2, EyeOff, Tag, ChevronDown, ChevronRight, Percent } from "lucide-react";
import VisualizationMethodSelector, { VisualizationMethod } from "./VisualizationMethodSelector";

interface VisualizationControlsProps {
  activeView: "matrix" | "parallel";
  onSwitchView: (view: "matrix" | "parallel") => void;
  selectedLayer: number;
  selectedHead: number;
  onSelectLayer: (layer: number) => void;
  onSelectHead: (head: number) => void;
  totalLayers: number;
  totalHeads: number;
  view?: "single" | "comparison";
  visualizationMethod?: VisualizationMethod;
  onVisualizationMethodChange?: (method: VisualizationMethod) => void;
  showLayerHeadSummary?: boolean;
  onToggleLayerHeadSummary?: () => void;
  showAverageAttention?: boolean;
  onToggleAverageAttention?: () => void;
  showPercentages?: boolean;
  onTogglePercentages?: () => void;
  tokenVisibility?: {
    cls: boolean;
    sep: boolean;
    s_token: boolean;
    _s_token: boolean;
    period: boolean;
    pad: boolean;
    comma: boolean;
    exclamation: boolean;
    question: boolean;
    semicolon: boolean;
    colon: boolean;
    apostrophe: boolean;
    quote: boolean;
    parentheses: boolean;
    dash: boolean;
    hyphen: boolean;
    ellipsis: boolean;
  };
  onToggleTokenVisibility?: (tokenType: "cls" | "sep" | "s_token" | "_s_token" | "period" | "pad" |
    "comma" | "exclamation" | "question" | "semicolon" | "colon" | "apostrophe" |
    "quote" | "parentheses" | "dash" | "hyphen" | "ellipsis") => void;
  modelType?: string;
  hideSpecialTokens?: boolean;
  onToggleHideSpecialTokens?: () => void;
}

const VisualizationControls: React.FC<VisualizationControlsProps> = ({
  activeView,
  onSwitchView,
  selectedLayer,
  selectedHead,
  onSelectLayer,
  onSelectHead,
  totalLayers,
  totalHeads,
  view = "single",
  visualizationMethod = "raw",
  onVisualizationMethodChange,
  showLayerHeadSummary = false,
  onToggleLayerHeadSummary,
  showAverageAttention = false,
  onToggleAverageAttention,
  showPercentages = true,
  onTogglePercentages,
  tokenVisibility = {
    cls: true, sep: true, s_token: true, _s_token: true, period: true, pad: true,
    comma: true, exclamation: true, question: true, semicolon: true, colon: true,
    apostrophe: true, quote: true, parentheses: true, dash: true, hyphen: true, ellipsis: true
  },
  onToggleTokenVisibility,
  modelType = "bert-base-uncased",
  hideSpecialTokens = false,
  onToggleHideSpecialTokens
}) => {
  // State for showing/hiding punctuation controls
  const [showPunctuationControls, setShowPunctuationControls] = useState(false);

  // Determine if layer/head selection should be disabled
  const isAggregateMethod = visualizationMethod === "rollout" || visualizationMethod === "flow";

  // Check model type based on exact model IDs from pretrainedModels.ts
  const isRobertaFamily = modelType === "roberta-base";
  const isBertFamily = modelType === "bert-base-uncased" ||
    modelType === "distilbert-base-uncased" ||
    modelType === "EdwinXhen/TinyBert_6Layer_MLM";

  // Helper to determine which controls to show based on the model ID
  const shouldShowBertControls = isBertFamily;
  const shouldShowRobertaControls = isRobertaFamily;

  // Toggle the punctuation controls dropdown
  const togglePunctuationControls = () => {
    setShowPunctuationControls(!showPunctuationControls);
  };

  // Helper function to check if all punctuation is hidden
  const punctuationAllHidden = () => {
    const punctuationTokens: Array<"comma" | "exclamation" | "question" | "semicolon" | "colon" |
      "apostrophe" | "quote" | "parentheses" | "dash" | "hyphen" | "ellipsis"> = [
        'comma', 'exclamation', 'question', 'semicolon', 'colon',
        'apostrophe', 'quote', 'parentheses', 'dash', 'hyphen', 'ellipsis'
      ];

    // Check if any punctuation is visible
    const anyPunctuationVisible = punctuationTokens.some(token => tokenVisibility[token]);

    return !anyPunctuationVisible;
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-indigo-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* View Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            {view === "comparison" ? "Comparison View" : "Visualization Type"}
          </h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => onSwitchView("matrix")}
              className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${activeView === "matrix"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <Grid size={18} className="mr-2" />
              Matrix View
            </button>
            <button
              onClick={() => onSwitchView("parallel")}
              className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${activeView === "parallel"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <GitBranch size={18} className="mr-2" />
              Parallel View
            </button>
            {onToggleLayerHeadSummary && (
              <button
                onClick={onToggleLayerHeadSummary}
                className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${showLayerHeadSummary
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <LayoutGrid size={18} className="mr-2" />
                {showLayerHeadSummary ? "Hide Layer Summary" : "Show Layer Summary"}
              </button>
            )}
            {onToggleAverageAttention && (
              <button
                onClick={onToggleAverageAttention}
                className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${showAverageAttention
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <BarChart2 size={18} className="mr-2" />
                {showAverageAttention ? "Hide Avg Attention" : "Show Avg Attention"}
              </button>
            )}

            {/* Matrix View Specific Controls - moved here to be grouped with other visualization controls */}
            {activeView === "matrix" && onTogglePercentages && (
              <button
                onClick={onTogglePercentages}
                className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${showPercentages
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-indigo-600 text-white shadow-md"
                  }`}
              >
                <Percent size={18} className="mr-2" />
                {showPercentages ? "Hide Percentages" : "Show Percentages"}
              </button>
            )}

            {onToggleTokenVisibility && (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                  <Tag size={14} className="mr-1" />
                  Token Visibility
                </h4>
                <div className="flex flex-col space-y-1">
                  {/* Hide All Special Tokens button */}
                  <button
                    onClick={() => onToggleHideSpecialTokens && onToggleHideSpecialTokens()}
                    className={`flex items-center px-4 py-2 rounded-lg text-xs transition-colors w-full ${(!tokenVisibility.cls && !tokenVisibility.sep &&
                      !tokenVisibility.s_token && !tokenVisibility._s_token)
                      ? "bg-amber-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <EyeOff size={14} className="mr-2" />
                    {(!tokenVisibility.cls && !tokenVisibility.sep &&
                      !tokenVisibility.s_token && !tokenVisibility._s_token)
                      ? "Show All Special Tokens"
                      : "Hide All Special Tokens"}
                  </button>

                  {/* Separator */}
                  <div className="border-t border-gray-100 my-1"></div>

                  {/* Special Tokens Grid */}
                  <div className="grid grid-cols-2 gap-1">
                    {/* BERT family tokens - only show for BERT models */}
                    {shouldShowBertControls && (
                      <>
                        <button
                          onClick={() => onToggleTokenVisibility('cls')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.cls
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.cls ? "Hide CLS" : "Show CLS"}
                        </button>
                        <button
                          onClick={() => onToggleTokenVisibility('sep')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.sep
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.sep ? "Hide SEP" : "Show SEP"}
                        </button>
                        <button
                          onClick={() => onToggleTokenVisibility('pad')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.pad
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.pad ? "Hide [PAD]" : "Show [PAD]"}
                        </button>
                      </>
                    )}

                    {/* RoBERTa family tokens - only show for RoBERTa models */}
                    {shouldShowRobertaControls && (
                      <>
                        <button
                          onClick={() => onToggleTokenVisibility('s_token')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.s_token
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.s_token ? "Hide <s>" : "Show <s>"}
                        </button>
                        <button
                          onClick={() => onToggleTokenVisibility('_s_token')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility._s_token
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility._s_token ? "Hide </s>" : "Show </s>"}
                        </button>
                        <button
                          onClick={() => onToggleTokenVisibility('pad')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.pad
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.pad ? "Hide <pad>" : "Show <pad>"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Punctuation Controls Button */}
                  <button
                    onClick={togglePunctuationControls}
                    className="flex items-center justify-between w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs transition-colors mt-1"
                  >
                    <span className="flex items-center">
                      <Tag size={14} className="mr-2" />
                      {showPunctuationControls ? "Hide Punctuation Controls" : "Show Punctuation Controls"}
                    </span>
                    {showPunctuationControls ?
                      <ChevronDown size={14} /> :
                      <ChevronRight size={14} />
                    }
                  </button>

                  {/* Punctuation Controls Dropdown */}
                  {showPunctuationControls && (
                    <div className="mt-1 pl-2 border-l-2 border-gray-100">
                      {/* Hide All Punctuation - full width */}
                      <button
                        onClick={() => {
                          if (onToggleTokenVisibility) {
                            const punctuationTokens: Array<"comma" | "exclamation" | "question" | "semicolon" | "colon" |
                              "apostrophe" | "quote" | "parentheses" | "dash" | "hyphen" | "ellipsis" | "period"> = [
                                'comma', 'exclamation', 'question', 'semicolon', 'colon',
                                'apostrophe', 'quote', 'parentheses', 'dash', 'hyphen', 'ellipsis', 'period'
                              ];

                            // Check if any punctuation is visible
                            const anyPunctuationVisible = punctuationTokens.some(token => tokenVisibility[token]);

                            // If any are visible, hide all. If all are hidden, show all.
                            punctuationTokens.forEach(token => {
                              if (anyPunctuationVisible && tokenVisibility[token]) {
                                onToggleTokenVisibility(token);
                              } else if (!anyPunctuationVisible && !tokenVisibility[token]) {
                                onToggleTokenVisibility(token);
                              }
                            });
                          }
                        }}
                        className={`flex items-center px-4 py-2 rounded-lg text-xs transition-colors w-full mb-2 ${punctuationAllHidden()
                          ? "bg-amber-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        <span className="flex items-center">
                          <EyeOff size={14} className="mr-2" />
                          {punctuationAllHidden() ? "Show All Punctuation" : "Hide All Punctuation"}
                        </span>
                      </button>

                      {/* Punctuation Controls Grid */}
                      <div className="grid grid-cols-2 gap-1">
                        {/* Period - moved from above into punctuation section */}
                        <button
                          onClick={() => onToggleTokenVisibility('period')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.period
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.period ? "Hide Period" : "Show Period"}
                        </button>

                        {/* Comma */}
                        <button
                          onClick={() => onToggleTokenVisibility('comma')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.comma
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.comma ? "Hide Commas" : "Show Commas"}
                        </button>

                        {/* Exclamation */}
                        <button
                          onClick={() => onToggleTokenVisibility('exclamation')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.exclamation
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.exclamation ? "Hide !" : "Show !"}
                        </button>

                        {/* Question */}
                        <button
                          onClick={() => onToggleTokenVisibility('question')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.question
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.question ? "Hide ?" : "Show ?"}
                        </button>

                        {/* Semicolon */}
                        <button
                          onClick={() => onToggleTokenVisibility('semicolon')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.semicolon
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.semicolon ? "Hide ;" : "Show ;"}
                        </button>

                        {/* Colon */}
                        <button
                          onClick={() => onToggleTokenVisibility('colon')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.colon
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.colon ? "Hide :" : "Show :"}
                        </button>

                        {/* Apostrophe */}
                        <button
                          onClick={() => onToggleTokenVisibility('apostrophe')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.apostrophe
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.apostrophe ? "Hide '" : "Show '"}
                        </button>

                        {/* Quote */}
                        <button
                          onClick={() => onToggleTokenVisibility('quote')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.quote
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.quote ? "Hide \"" : "Show \""}
                        </button>

                        {/* Parentheses */}
                        <button
                          onClick={() => onToggleTokenVisibility('parentheses')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.parentheses
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.parentheses ? "Hide ()" : "Show ()"}
                        </button>

                        {/* Dash */}
                        <button
                          onClick={() => onToggleTokenVisibility('dash')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.dash
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.dash ? "Hide —" : "Show —"}
                        </button>

                        {/* Hyphen */}
                        <button
                          onClick={() => onToggleTokenVisibility('hyphen')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.hyphen
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.hyphen ? "Hide -" : "Show -"}
                        </button>

                        {/* Ellipsis */}
                        <button
                          onClick={() => onToggleTokenVisibility('ellipsis')}
                          className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${tokenVisibility.ellipsis
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-amber-600 text-white shadow-md"
                            }`}
                        >
                          <EyeOff size={14} className="mr-1" />
                          {tokenVisibility.ellipsis ? "Hide ..." : "Show ..."}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Keep the original button for backwards compatibility, but hide it if we have individual controls */}
            {onToggleHideSpecialTokens && !onToggleTokenVisibility && (
              <button
                onClick={onToggleHideSpecialTokens}
                className={`flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${hideSpecialTokens
                  ? "bg-amber-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <EyeOff size={18} className="mr-2" />
                {hideSpecialTokens ? "Show Special Tokens" : "Hide Special Tokens"}
              </button>
            )}
          </div>
        </div>

        {/* Layer Selection */}
        <div className={`${isAggregateMethod || showAverageAttention ? "opacity-60" : ""}`}>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Layers size={16} className="mr-1" />
            Layer Selection
            {isAggregateMethod && (
              <div className="ml-2 text-amber-600 inline-flex items-center" title="Layer selection is disabled for rollout and flow visualization methods as they aggregate across all layers">
                <AlertCircle size={14} className="mr-1" />
                <span className="text-xs">Disabled for {visualizationMethod}</span>
              </div>
            )}
            {showAverageAttention && (
              <div className="ml-2 text-teal-600 inline-flex items-center" title="Use the average attention visualization to select layers">
                <AlertCircle size={14} className="mr-1" />
                <span className="text-xs">Click layers in visualization below</span>
              </div>
            )}
          </h3>
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <span className="text-sm text-gray-600 w-24">Current Layer:</span>
              <span className="font-medium text-indigo-700">{selectedLayer + 1} of {totalLayers}</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalLayers > 0 ? totalLayers - 1 : 0}
              value={selectedLayer}
              onChange={(e) => onSelectLayer(parseInt(e.target.value))}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isAggregateMethod || showAverageAttention ? "cursor-not-allowed" : ""}`}
              disabled={isAggregateMethod || showAverageAttention}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>{totalLayers}</span>
            </div>
          </div>
        </div>

        {/* Head Selection */}
        <div className={`${isAggregateMethod || showAverageAttention ? "opacity-60" : ""}`}>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Hash size={16} className="mr-1" />
            Head Selection
            {isAggregateMethod && (
              <div className="ml-2 text-amber-600 inline-flex items-center" title="Head selection is disabled for rollout and flow visualization methods as they average across all heads">
                <AlertCircle size={14} className="mr-1" />
                <span className="text-xs">Disabled for {visualizationMethod}</span>
              </div>
            )}
            {showAverageAttention && (
              <div className="ml-2 text-teal-600 inline-flex items-center" title="Head selection is disabled when viewing average attention per layer">
                <AlertCircle size={14} className="mr-1" />
                <span className="text-xs">Heads are averaged in visualization</span>
              </div>
            )}
          </h3>
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <span className="text-sm text-gray-600 w-24">Current Head:</span>
              <span className="font-medium text-indigo-700">{selectedHead + 1} of {totalHeads}</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalHeads > 0 ? totalHeads - 1 : 0}
              value={selectedHead}
              onChange={(e) => onSelectHead(parseInt(e.target.value))}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${isAggregateMethod || showAverageAttention ? "cursor-not-allowed" : ""}`}
              disabled={isAggregateMethod || showAverageAttention}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1</span>
              <span>{totalHeads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Information about token filtering */}
      {hideSpecialTokens && !onToggleTokenVisibility && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-md text-sm text-amber-700 flex items-start">
          <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
          <p>
            Special tokens ([CLS], [SEP], periods, and RoBERTa specials) are currently hidden.
          </p>
        </div>
      )}

      {/* Show token visibility information if any tokens are hidden */}
      {onToggleTokenVisibility && (
        (!tokenVisibility.cls || !tokenVisibility.sep || !tokenVisibility.s_token ||
          !tokenVisibility._s_token || !tokenVisibility.period || !tokenVisibility.comma ||
          !tokenVisibility.exclamation || !tokenVisibility.question || !tokenVisibility.semicolon ||
          !tokenVisibility.colon || !tokenVisibility.apostrophe || !tokenVisibility.quote ||
          !tokenVisibility.parentheses || !tokenVisibility.dash || !tokenVisibility.hyphen ||
          !tokenVisibility.ellipsis || !tokenVisibility.pad) && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-md text-sm text-amber-700 flex items-start">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
            <p>
              Hidden tokens:
              {!tokenVisibility.cls && shouldShowBertControls && " [CLS]"}
              {!tokenVisibility.sep && shouldShowBertControls && " [SEP]"}
              {!tokenVisibility.s_token && shouldShowRobertaControls && " <s>"}
              {!tokenVisibility._s_token && shouldShowRobertaControls && " </s>"}
              {!tokenVisibility.pad && " PAD"}
              {!tokenVisibility.period && " ."}
              {!tokenVisibility.comma && " ,"}
              {!tokenVisibility.exclamation && " !"}
              {!tokenVisibility.question && "?"}
              {!tokenVisibility.semicolon && ";"}
              {!tokenVisibility.colon && ":"}
              {!tokenVisibility.apostrophe && "'"}
              {!tokenVisibility.quote && '"'}
              {!tokenVisibility.parentheses && "()"}
              {!tokenVisibility.dash && "—"}
              {!tokenVisibility.hyphen && "-"}
              {!tokenVisibility.ellipsis && "..."}
            </p>
          </div>
        )
      )}

      {/* Visualization Method Selection */}
      {onVisualizationMethodChange && (
        <div className="border-t border-gray-200 pt-4">
          <VisualizationMethodSelector
            selectedMethod={visualizationMethod}
            onMethodChange={onVisualizationMethodChange}
          />
          {isAggregateMethod && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
              <p>
                {visualizationMethod === "rollout" ? (
                  <>
                    <span className="font-semibold">Attention Rollout</span> recursively combines attention weights
                    across layers by matrix multiplication to model how attention propagates through the network,
                    accounting for residual connections.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Attention Flow</span> treats the attention weights as a graph and
                    uses maximum flow algorithms to measure information flow between tokens, considering all possible
                    paths through the network.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualizationControls;

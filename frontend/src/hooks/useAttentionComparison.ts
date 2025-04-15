import { useState, useCallback } from "react";
import { AttentionData } from "../types";
import { getAttentionComparison } from "../services/modelService";
import { VisualizationMethod } from "../components/visualization/VisualizationMethodSelector";

/**
 * Hook for managing before/after attention comparison when a masked token is replaced
 */
export const useAttentionComparison = () => {
    // Comparison state
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonData, setComparisonData] = useState<{
        before: AttentionData | null;
        after: AttentionData | null;
        wordIndex: number | null;
        replacementWord: string | null;
        modelId: string | null;
        visualizationMethod: VisualizationMethod;
    }>({
        before: null,
        after: null,
        wordIndex: null,
        replacementWord: null,
        modelId: null,
        visualizationMethod: "raw"
    });
    const [isLoadingComparison, setIsLoadingComparison] = useState(false);
    const [comparisonView, setComparisonView] = useState<"matrix" | "parallel">("parallel");

    // Function to start a comparison
    const startComparison = useCallback(async (
        text: string,
        maskIndex: number,
        replacementWord: string,
        modelId: string,
        visualizationMethod: VisualizationMethod = "raw"
    ) => {
        setIsLoadingComparison(true);
        setIsComparing(true);

        try {
            console.log(`Starting comparison for "${text}" with replacement "${replacementWord}" at index ${maskIndex} using ${modelId}`);
            console.log(`Visualization method: ${visualizationMethod}`);

            // Different handling based on model type (BERT vs RoBERTa)
            const isRoberta = modelId.includes('roberta');
            console.log(`Using ${isRoberta ? 'RoBERTa' : 'BERT'} comparison logic`);

            const { before_attention, after_attention } = await getAttentionComparison(
                text,
                maskIndex,
                replacementWord,
                modelId,
                visualizationMethod
            );

            setComparisonData({
                before: before_attention,
                after: after_attention,
                wordIndex: maskIndex,
                replacementWord: replacementWord,
                modelId: modelId,
                visualizationMethod: visualizationMethod
            });

            console.log("Comparison data loaded successfully");
        } catch (error) {
            console.error("Error loading comparison data:", error);
            setIsComparing(false);
        } finally {
            setIsLoadingComparison(false);
        }
    }, []);

    // Function to exit comparison mode
    const exitComparison = useCallback(() => {
        setIsComparing(false);
        setComparisonData({
            before: null,
            after: null,
            wordIndex: null,
            replacementWord: null,
            modelId: null,
            visualizationMethod: "raw"
        });
    }, []);

    return {
        // States
        isComparing,
        isLoadingComparison,
        comparisonData,
        comparisonView,

        // Functions
        startComparison,
        exitComparison,
        setComparisonView
    };
}; 
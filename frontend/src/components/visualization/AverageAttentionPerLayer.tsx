import React, { useRef, useEffect, useMemo } from 'react';
import { Layers } from 'lucide-react';
import * as d3 from 'd3';
import { AttentionData, Token } from '../../types';

interface AverageAttentionPerLayerProps {
    attentionData: AttentionData;
    tokens: Token[];
    onSelectLayer: (layer: number) => void;
    selectedLayer: number;
}

/**
 * Calculates the average attention values for each layer across all heads
 */
const calculateAverageAttentionPerLayer = (attentionData: AttentionData): number[][][] => {
    if (!attentionData?.layers?.length) return [];

    const layerCount = attentionData.layers.length;
    const tokenCount = attentionData.tokens.length;

    // Initialize empty array for each layer
    const averageAttention: number[][][] = Array(layerCount)
        .fill(null)
        .map(() => Array(1).fill(null).map(() =>
            Array(tokenCount).fill(null).map(() => Array(tokenCount).fill(0))
        ));

    // Calculate sum for each layer
    for (let layerIdx = 0; layerIdx < layerCount; layerIdx++) {
        const layer = attentionData.layers[layerIdx];
        const headCount = layer.heads.length;

        // Skip if no heads
        if (headCount === 0) continue;

        // Get total attention across all heads for this layer
        for (let headIdx = 0; headIdx < headCount; headIdx++) {
            const head = layer.heads[headIdx];

            // For each position in the attention matrix
            for (let i = 0; i < tokenCount; i++) {
                for (let j = 0; j < tokenCount; j++) {
                    // Add to the sum (handle missing data)
                    const attentionValue = head.attention[i]?.[j] || 0;
                    averageAttention[layerIdx][0][i][j] += attentionValue / headCount;
                }
            }
        }
    }

    return averageAttention;
};

/**
 * Normalizes attention values to sum to 1 (100%) for each row
 */
const normalizeAttentionValues = (attentionMatrix: number[][]): number[][] => {
    const normalized = attentionMatrix.map(row => {
        const sum = row.reduce((acc, val) => acc + val, 0);
        // If sum is 0, avoid division by zero
        if (sum === 0) return row.map(() => 0);
        // Normalize each value so the row sums to 1 (100%)
        return row.map(val => val / sum);
    });
    return normalized;
};

const AverageAttentionPerLayer: React.FC<AverageAttentionPerLayerProps> = ({
    attentionData,
    tokens,
    onSelectLayer,
    selectedLayer
}) => {
    // Memoize the average attention calculation to prevent recalculation on each render
    const averageAttentionPerLayer = useMemo(() =>
        calculateAverageAttentionPerLayer(attentionData),
        [attentionData]
    );

    const layerCount = attentionData?.layers?.length || 0;

    if (layerCount === 0) {
        return <div className="p-4 text-gray-500">No attention data available</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Layers size={20} className="mr-2 text-indigo-600" />
                    Average Attention Per Layer
                </h2>
                <div className="text-sm text-gray-500 flex items-center">
                    <span className="mr-2">Click on a layer to select it</span>
                    <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
                        {layerCount} layers × {attentionData?.layers?.[0]?.heads?.length || 0} heads
                    </span>
                </div>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700 flex items-start">
                <p>
                    Each matrix shows the average attention weights across all heads for that layer.
                    Darker colors indicate stronger attention. Select a layer to view it in detail.
                </p>
            </div>

            <div className="overflow-auto max-h-[600px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: layerCount }).map((_, layerIndex) => (
                        <LayerAttentionSummary
                            key={`layer-${layerIndex}`}
                            layerIndex={layerIndex}
                            tokens={tokens}
                            attentionMatrix={averageAttentionPerLayer[layerIndex]?.[0] || []}
                            onSelect={() => onSelectLayer(layerIndex)}
                            isSelected={layerIndex === selectedLayer}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface LayerAttentionSummaryProps {
    layerIndex: number;
    tokens: Token[];
    attentionMatrix: number[][];
    onSelect: () => void;
    isSelected: boolean;
}

const LayerAttentionSummary: React.FC<LayerAttentionSummaryProps> = React.memo(({
    layerIndex,
    tokens,
    attentionMatrix,
    onSelect,
    isSelected
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || attentionMatrix.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Set dimensions
        const size = 120; // Size of the attention matrix
        const padding = 4; // Padding inside the matrix

        // Set SVG dimensions
        svg.attr("width", size).attr("height", size);

        // Normalize the attention matrix
        const normalizedAttention = normalizeAttentionValues(attentionMatrix);

        // Calculate cell size
        const tokenCount = tokens.length;
        const cellSize = (size - padding * 2) / tokenCount;

        // Create main group
        const g = svg.append("g").attr("transform", `translate(${padding}, ${padding})`);

        // Color scale for attention weights - memoize this
        const maxValue = d3.max(normalizedAttention.flat()) || 1;
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, maxValue]);

        // Draw cells
        for (let i = 0; i < tokenCount; i++) {
            for (let j = 0; j < tokenCount; j++) {
                const value = normalizedAttention[i]?.[j] || 0;
                g.append("rect")
                    .attr("x", j * cellSize)
                    .attr("y", i * cellSize)
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("fill", colorScale(value))
                    .attr("stroke", "none");
            }
        }

    }, [layerIndex, tokens.length, attentionMatrix]);

    return (
        <div
            ref={containerRef}
            onClick={onSelect}
            className={`cursor-pointer transition-all rounded ${isSelected
                ? 'ring-2 ring-indigo-600 bg-indigo-50 shadow-md relative z-10 m-1'
                : 'hover:bg-gray-50 border border-gray-100 hover:scale-105 p-2'
                }`}
        >
            <div className="flex flex-col items-center">
                <div className={`text-sm font-medium mb-2 ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                    Layer {layerIndex + 1}
                    {isSelected && <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Selected</span>}
                </div>
                <svg ref={svgRef} />
            </div>
        </div>
    );
});

export default AverageAttentionPerLayer; 
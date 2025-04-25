import React, { useRef, useEffect } from 'react';
import { Grid, Layers } from 'lucide-react';
import * as d3 from 'd3';
import { AttentionData, Token } from '../../types';

interface LayerHeadSummaryProps {
    attentionData: AttentionData;
    tokens: Token[];
    onSelectLayerHead: (layer: number, head: number) => void;
    selectedLayer: number;
    selectedHead: number;
}

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

const LayerHeadSummary: React.FC<LayerHeadSummaryProps> = ({
    attentionData,
    tokens,
    onSelectLayerHead,
    selectedLayer,
    selectedHead
}) => {
    // Calculate grid dimensions
    const layerCount = attentionData?.layers?.length || 0;
    const headCount = attentionData?.layers?.[0]?.heads?.length || 0;

    if (layerCount === 0 || headCount === 0) {
        return <div className="p-4 text-gray-500">No attention data available</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Layers size={20} className="mr-2 text-indigo-600" />
                    Attention Matrix Summary
                </h2>
                <div className="text-sm text-gray-500">
                    {layerCount} layers × {headCount} heads
                </div>
            </div>

            <div className="overflow-auto max-h-[600px]">
                <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: layerCount }).map((_, layerIndex) => (
                        <div key={`layer-${layerIndex}`} className="p-2 border border-gray-100 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Layer {layerIndex + 1}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                                {Array.from({ length: headCount }).map((_, headIndex) => (
                                    <MiniAttentionMatrix
                                        key={`matrix-${layerIndex}-${headIndex}`}
                                        layerIndex={layerIndex}
                                        headIndex={headIndex}
                                        tokens={tokens}
                                        attentionData={attentionData}
                                        onSelect={() => onSelectLayerHead(layerIndex, headIndex)}
                                        isSelected={layerIndex === selectedLayer && headIndex === selectedHead}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface MiniAttentionMatrixProps {
    layerIndex: number;
    headIndex: number;
    tokens: Token[];
    attentionData: AttentionData;
    onSelect: () => void;
    isSelected: boolean;
}

const MiniAttentionMatrix: React.FC<MiniAttentionMatrixProps> = ({
    layerIndex,
    headIndex,
    tokens,
    attentionData,
    onSelect,
    isSelected
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Get the attention matrix for this layer and head
        const attentionMatrix = attentionData.layers[layerIndex]?.heads[headIndex]?.attention || [];
        if (attentionMatrix.length === 0) {
            return;
        }

        // Set dimensions for mini matrix
        const size = 80; // Size of the mini matrix
        const padding = 2; // Padding inside the matrix

        // Set SVG dimensions
        svg.attr("width", size).attr("height", size);

        // Normalize the attention matrix
        const normalizedAttention = normalizeAttentionValues(attentionMatrix);

        // Calculate cell size
        const tokenCount = tokens.length;
        const cellSize = (size - padding * 2) / tokenCount;

        // Create main group
        const g = svg.append("g").attr("transform", `translate(${padding}, ${padding})`);

        // Color scale for attention weights
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(normalizedAttention.flat()) || 1]);

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

    }, [layerIndex, headIndex, tokens, attentionData]);

    return (
        <div
            ref={containerRef}
            onClick={onSelect}
            className={`cursor-pointer transition-all hover:scale-105 rounded p-1 ${isSelected ? 'ring-2 ring-indigo-600 bg-indigo-50' : 'hover:bg-gray-50'}`}
        >
            <div className="flex flex-col items-center">
                <svg ref={svgRef} />
                <div className="text-xs mt-1 text-gray-600 text-center">
                    H{headIndex + 1}
                </div>
            </div>
        </div>
    );
};

export default LayerHeadSummary; 
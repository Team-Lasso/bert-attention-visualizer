import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Token } from '../types';
import { Wand2 } from 'lucide-react';

interface WordMaskingProps {
    tokens: Token[];
    onMaskWord: (tokenIndex: number) => void;
    maskedTokenIndex: number | null;
    predictions: { word: string; score: number }[] | null;
}

const WordMasking: React.FC<WordMaskingProps> = ({
    tokens,
    onMaskWord,
    maskedTokenIndex,
    predictions
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    // Render the predictions bar chart
    useEffect(() => {
        if (!svgRef.current || !predictions || predictions.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 400;
        const margin = { top: 30, right: 30, bottom: 70, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Sort predictions by score (descending)
        const sortedPredictions = [...predictions].sort((a, b) => b.score - a.score);

        // Take top 10 predictions for better visualization
        const topPredictions = sortedPredictions.slice(0, 10);

        const words = topPredictions.map(p => p.word);
        const scores = topPredictions.map(p => p.score);

        // X scale
        const x = d3.scaleBand()
            .domain(words)
            .range([0, innerWidth])
            .padding(0.2);

        // Y scale
        const y = d3.scaleLinear()
            .domain([0, d3.max(scores) || 1])
            .nice()
            .range([innerHeight, 0]);

        // Color scale - gradient from blue to purple
        const colorScale = d3.scaleLinear<string>()
            .domain([0, scores.length - 1])
            .range(["#4f46e5", "#7c3aed"]);

        // Add X axis
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "11px");

        // Add Y axis
        g.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `${(d as number * 100).toFixed(0)}%`))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll(".tick line").attr("stroke", "#e2e8f0"));

        // Add horizontal grid lines
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-innerWidth)
                .tickFormat(() => "")
            )
            .call(g => g.selectAll(".tick line")
                .attr("stroke", "#e2e8f0")
                .attr("stroke-dasharray", "2,2")
            )
            .call(g => g.select(".domain").remove());

        // Add bars with animation
        g.selectAll(".bar")
            .data(scores)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (_, i) => x(words[i]) || 0)
            .attr("width", x.bandwidth())
            .attr("y", innerHeight)
            .attr("height", 0)
            .attr("fill", (_, i) => colorScale(i))
            .attr("rx", 2)
            .attr("ry", 2)
            .transition()
            .duration(750)
            .attr("y", d => y(d))
            .attr("height", d => innerHeight - y(d));

        // Add bar outlines
        g.selectAll(".bar-outline")
            .data(scores)
            .enter()
            .append("rect")
            .attr("class", "bar-outline")
            .attr("x", (_, i) => x(words[i]) || 0)
            .attr("width", x.bandwidth())
            .attr("y", d => y(d))
            .attr("height", d => innerHeight - y(d))
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("rx", 2)
            .attr("ry", 2);

        // Add tooltips
        g.selectAll(".bar-tooltip-area")
            .data(scores)
            .enter()
            .append("rect")
            .attr("class", "bar-tooltip-area")
            .attr("x", (_, i) => x(words[i]) || 0)
            .attr("width", x.bandwidth())
            .attr("y", 0)
            .attr("height", innerHeight)
            .attr("fill", "transparent")
            .append("title")
            .text((d, i) => `${words[i]}: ${(d * 100).toFixed(1)}%`);

        // Add percentage labels on top of bars
        g.selectAll(".bar-label")
            .data(scores)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("x", (_, i) => (x(words[i]) || 0) + x.bandwidth() / 2)
            .attr("y", d => y(d) - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .attr("opacity", 0)
            .text(d => `${(d * 100).toFixed(1)}%`)
            .transition()
            .delay(750)
            .duration(300)
            .attr("opacity", d => d > 0.05 ? 1 : 0); // Only show labels for significant values

        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", "#1e293b")
            .text(`BERT Predictions for Masked Word`);

        // Add X axis label
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b")
            .attr("font-size", "12px")
            .text("Predicted Words");

        // Add Y axis label
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b")
            .attr("font-size", "12px")
            .text("Prediction Probability");

    }, [predictions]);

    return (
        <div className="p-5 bg-white rounded-xl shadow-md border border-indigo-100">
            <div className="flex items-center mb-3">
                <Wand2 size={18} className="mr-2 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">Word Masking</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Click on a token to mask it and see BERT's predictions</p>

            <div className="flex flex-wrap gap-2 mb-6">
                {tokens.map((token, index) => (
                    <button
                        key={index}
                        onClick={() => onMaskWord(index)}
                        className={`px-3 py-2 rounded-lg border transition-all ${maskedTokenIndex === index
                                ? 'bg-purple-600 text-white border-purple-700 shadow-md transform scale-105'
                                : 'bg-purple-50 text-purple-800 border-purple-100 hover:bg-purple-100 hover:border-purple-200'
                            }`}
                    >
                        {maskedTokenIndex === index ? '[MASK]' : token.text}
                    </button>
                ))}
            </div>

            {predictions && predictions.length > 0 ? (
                <svg ref={svgRef} width={800} height={400} className="mx-auto" />
            ) : maskedTokenIndex !== null ? (
                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">Loading predictions...</div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">Select a word to mask</div>
                </div>
            )}
        </div>
    );
};

export default WordMasking; 
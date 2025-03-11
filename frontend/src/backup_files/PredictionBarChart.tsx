import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { WordPrediction } from '../types';
import { BarChart } from 'lucide-react';

interface PredictionBarChartProps {
    predictions: WordPrediction[] | null;
    width?: number;
    height?: number;
}

const PredictionBarChart: React.FC<PredictionBarChartProps> = ({
    predictions,
    width = 800,
    height = 400
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    // Render the predictions bar chart
    useEffect(() => {
        if (!svgRef.current || !predictions || predictions.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

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

    }, [predictions, width, height]);

    if (!predictions || predictions.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                    <BarChart size={18} className="mr-2 text-indigo-600" />
                    <h3 className="text-lg font-medium text-gray-900">Prediction Distribution</h3>
                </div>
                <div className="flex items-center justify-center flex-grow bg-gray-50 rounded-lg">
                    <div className="text-gray-500">No predictions available</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center mb-3">
                <BarChart size={18} className="mr-2 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">Prediction Distribution</h3>
            </div>
            <svg ref={svgRef} width={width} height={height} className="mx-auto" />
        </div>
    );
};

export default PredictionBarChart; 
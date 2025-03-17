import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { WordAttentionData } from '../types';

/*
this component is called in VisualizationDisplay.tsx
*/
interface WordAttentionBarChartProps {
  data: WordAttentionData;
  width: number;
  height: number;
}

const WordAttentionBarChart: React.FC<WordAttentionBarChartProps> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.targetWords.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Adjusted margins for horizontal layout
    const margin = { top: 40, right: 120, bottom: 40, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create data with indices for sorting
    const indexedData = data.attentionValues.map((value, i) => ({
      value: Math.max(value, 0.00001), // Ensure minimum value for log scale
      word: data.targetWords[i],
      index: i
    }));

    // Sort by attention value (descending)
    indexedData.sort((a, b) => b.value - a.value);

    // Extract sorted arrays
    const sortedWords = indexedData.map(d => d.word);
    const sortedValues = indexedData.map(d => d.value);
    const originalIndices = indexedData.map(d => d.index);

    // For horizontal bars, y is the category (token) and x is the value (attention)
    const y = d3.scaleBand()
      .domain(sortedWords)
      .range([0, innerHeight])
      .padding(0.3); // More padding for better readability

    // X scale for values (horizontal bars)
    const maxValue = d3.max(sortedValues) || 1;
    const x = d3.scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([0, innerWidth]);

    // Color scale with more vibrant colors
    const colorScale = d3.scaleOrdinal(d3.schemeSet2)
      .domain(originalIndices.map(String));

    // Add Y axis (categories/tokens)
    g.append("g")
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#e2e8f0"))
      .call(g => g.selectAll(".tick text")
        .attr("font-size", "11px")
        .style("fill", "#475569"));

    // Add X axis (values)
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x)
        .tickFormat(d => `${(d as number * 100).toFixed(d as number >= 0.01 ? 0 : 1)}%`)
        .ticks(5))
      .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#e2e8f0"));

    // Add vertical grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(x)
        .tickSize(innerHeight)
        .tickFormat(() => "")
        .ticks(5)
      )
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-dasharray", "2,2")
      )
      .call(g => g.select(".domain").remove())
      .attr("transform", "translate(0,0)");

    // Calculate a minimum visible bar width
    const MIN_BAR_WIDTH = 3;

    // Add bars with animation
    g.selectAll(".bar")
      .data(sortedValues)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (_, i) => y(sortedWords[i]) || 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("fill", (_, i) => colorScale(originalIndices[i].toString()))
      .attr("rx", 3)
      .attr("ry", 3)
      .transition()
      .duration(750)
      .attr("width", d => Math.max(x(d), MIN_BAR_WIDTH));

    // Add bar outlines
    g.selectAll(".bar-outline")
      .data(sortedValues)
      .enter()
      .append("rect")
      .attr("class", "bar-outline")
      .attr("y", (_, i) => y(sortedWords[i]) || 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", d => Math.max(x(d), MIN_BAR_WIDTH))
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("rx", 3)
      .attr("ry", 3);

    // Add tooltips with more detail
    g.selectAll(".bar-tooltip-area")
      .data(sortedValues)
      .enter()
      .append("rect")
      .attr("class", "bar-tooltip-area")
      .attr("y", (_, i) => y(sortedWords[i]) || 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", innerWidth)
      .attr("fill", "transparent")
      .append("title")
      .text((d, i) => {
        const percentage = d * 100;
        let formattedPercentage;
        if (percentage >= 1) {
          formattedPercentage = percentage.toFixed(1);
        } else if (percentage >= 0.1) {
          formattedPercentage = percentage.toFixed(2);
        } else {
          formattedPercentage = percentage.toFixed(3);
        }
        return `${data.sourceWord} → ${sortedWords[i]}: ${formattedPercentage}%`;
      });

    // Add percentage labels inside or next to bars
    g.selectAll(".bar-label")
      .data(sortedValues)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("y", (_, i) => (y(sortedWords[i]) || 0) + y.bandwidth() / 2)
      .attr("x", d => {
        const barWidth = Math.max(x(d), MIN_BAR_WIDTH);
        // Place labels inside or outside bar based on width
        return barWidth > 40 ? barWidth - 5 : barWidth + 5;
      })
      .attr("dy", "0.35em") // Vertical centering
      .attr("text-anchor", d => x(d) > 40 ? "end" : "start") // Text alignment based on position
      .attr("font-size", "10px")
      .attr("fill", d => x(d) > 40 ? "white" : "#1e40af") // Text color based on position
      .attr("font-weight", "bold")
      .attr("opacity", 0)
      .text(d => {
        // Format percentages with appropriate precision
        if (d >= 0.01) {
          return `${(d * 100).toFixed(1)}%`; // ≥ 1%: 1 decimal place
        } else if (d >= 0.001) {
          return `${(d * 100).toFixed(2)}%`; // 0.1% to 0.99%: 2 decimal places
        } else if (d > 0) {
          return `${(d * 100).toFixed(3)}%`; // Very small but non-zero: 3 decimal places
        } else {
          return "0%"; // Zero
        }
      })
      .transition()
      .delay(750)
      .duration(300)
      .attr("opacity", 1);

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text(`Attention from "${data.sourceWord}" to other tokens`);

    // Add X axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "12px")
      .text("Attention Percentage");

  }, [data, width, height]);

  return (
    <svg ref={svgRef} width={width} height={height} className="mx-auto" />
  );
};

export default WordAttentionBarChart;
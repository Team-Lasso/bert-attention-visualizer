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

    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create data with indices for sorting
    const indexedData = data.attentionValues.map((value, i) => ({
      value,
      word: data.targetWords[i],
      index: i
    }));

    // Sort by attention value (descending)
    indexedData.sort((a, b) => b.value - a.value);

    // Extract sorted arrays
    const sortedWords = indexedData.map(d => d.word);
    const sortedValues = indexedData.map(d => d.value);
    const originalIndices = indexedData.map(d => d.index);

    // X scale
    const x = d3.scaleBand()
      .domain(sortedWords)
      .range([0, innerWidth])
      .padding(0.2);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(sortedValues) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Color scale - use a gradient based on original token index for visual consistency
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(originalIndices.map(String));

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
      .data(sortedValues)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (_, i) => x(sortedWords[i]) || 0)
      .attr("width", x.bandwidth())
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("fill", (_, i) => colorScale(originalIndices[i].toString()))
      .attr("rx", 2)
      .attr("ry", 2)
      .transition()
      .duration(750)
      .attr("y", d => y(d))
      .attr("height", d => innerHeight - y(d));

    // Add bar outlines
    g.selectAll(".bar-outline")
      .data(sortedValues)
      .enter()
      .append("rect")
      .attr("class", "bar-outline")
      .attr("x", (_, i) => x(sortedWords[i]) || 0)
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
      .data(sortedValues)
      .enter()
      .append("rect")
      .attr("class", "bar-tooltip-area")
      .attr("x", (_, i) => x(sortedWords[i]) || 0)
      .attr("width", x.bandwidth())
      .attr("y", 0)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .append("title")
      .text((d, i) => `${data.sourceWord} → ${sortedWords[i]}: ${(d * 100).toFixed(1)}%`);

    // Add white background for small value labels to improve readability
    // Create backgrounds first so they appear behind the text
    g.selectAll(".bar-label-bg")
      .data(sortedValues)
      .enter()
      .append("rect")
      .attr("class", "bar-label-bg")
      .attr("x", (d, i) => {
        // Only create backgrounds for very small bars
        const barHeight = innerHeight - y(d);
        if (barHeight <= 20 && d > 0.0005) {
          const labelWidth = d >= 0.01 ? 32 : (d >= 0.001 ? 38 : 44); // Estimate width based on decimal places
          return (x(sortedWords[i]) || 0) + x.bandwidth() / 2 - labelWidth / 2;
        }
        return 0;
      })
      .attr("y", (d) => {
        const barHeight = innerHeight - y(d);
        if (barHeight <= 20 && d > 0.0005) {
          return y(d) - 15;
        }
        return 0;
      })
      .attr("width", (d) => {
        const barHeight = innerHeight - y(d);
        if (barHeight <= 20 && d > 0.0005) {
          return d >= 0.01 ? 32 : (d >= 0.001 ? 38 : 44); // Estimate width based on decimal places
        }
        return 0;
      })
      .attr("height", (d) => {
        const barHeight = innerHeight - y(d);
        return (barHeight <= 20 && d > 0.0005) ? 16 : 0;
      })
      .attr("fill", "#f8fafc") // Light blue-gray background (more visible than plain white)
      .attr("opacity", 0.95)  // Higher opacity for better contrast
      .attr("rx", 2)
      .attr("stroke", "#cbd5e1") // Add a subtle border
      .attr("stroke-width", 0.5);

    // Add percentage labels on top of bars (after backgrounds)
    g.selectAll(".bar-label")
      .data(sortedValues)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", (_, i) => (x(sortedWords[i]) || 0) + x.bandwidth() / 2)
      .attr("y", d => {
        // Position labels either on top of the bar or inside it, depending on bar height
        const barHeight = innerHeight - y(d);
        const yPosition = barHeight > 20 ? y(d) + 15 : y(d) - 5; // Inside if tall enough, otherwise above
        return yPosition;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", d => {
        // Use white text for tall bars, dark blue for small values (better contrast)
        const barHeight = innerHeight - y(d);
        return barHeight > 20 ? "white" : "#1e40af"; // Dark blue for small values
      })
      .attr("font-weight", d => {
        // Make small value text bold for better visibility
        const barHeight = innerHeight - y(d);
        return barHeight <= 20 ? "bold" : "normal";
      })
      .attr("opacity", 0)
      .text(d => {
        // Format percentages: use appropriate precision based on value
        if (d >= 0.01) {
          return `${(d * 100).toFixed(1)}%`; // 1% or above: 1 decimal place
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
      // Show all labels except those for extremely small values
      .attr("opacity", d => d > 0.0005 ? 1 : 0);

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
      .attr("y", innerHeight + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "12px")
      .text("Target Tokens");

    // Add Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
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
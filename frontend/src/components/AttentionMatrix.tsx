import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AttentionHead, Token } from '../types';

interface AttentionMatrixProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
}

const AttentionMatrix: React.FC<AttentionMatrixProps> = ({ tokens, head, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 20, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const cellSize = Math.min(
      innerWidth / tokens.length,
      innerHeight / tokens.length
    );
    
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Color scale for attention weights - using a more vibrant blue gradient
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(head.attention.flat()) || 1]);

    // Create the heatmap cells with animation
    tokens.forEach((sourceToken, i) => {
      tokens.forEach((targetToken, j) => {
        // Calculate percentage for display
        const percentage = (head.attention[i][j] * 100).toFixed(1);
        
        // Add cell with transition
        const cell = g.append("rect")
          .attr("x", j * cellSize)
          .attr("y", i * cellSize)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", "#f8fafc") // Start with light color
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("rx", 1)
          .attr("ry", 1);
          
        // Animate fill color
        cell.transition()
          .duration(500)
          .delay(i * 20 + j * 20) // Stagger the animations
          .attr("fill", colorScale(head.attention[i][j]));
          
        // Add tooltip
        cell.append("title")
          .text(`${sourceToken.text} → ${targetToken.text}: ${percentage}%`);
          
        // Add percentage text for cells that have significant attention (> 10%)
        if (head.attention[i][j] > 0.1 && cellSize > 25) {
          g.append("text")
            .attr("x", j * cellSize + cellSize / 2)
            .attr("y", i * cellSize + cellSize / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .attr("fill", head.attention[i][j] > 0.5 ? "white" : "black")
            .attr("opacity", 0) // Start invisible
            .text(`${percentage}%`)
            .transition()
            .duration(500)
            .delay(i * 20 + j * 20 + 300) // Appear after cell coloring
            .attr("opacity", 1);
        }
      });
    });

    // Add x-axis labels (target tokens) with better styling
    g.selectAll(".x-label")
      .data(tokens)
      .enter()
      .append("text")
      .attr("class", "x-label")
      .attr("x", (d, i) => i * cellSize + cellSize / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#475569")
      .text(d => d.text);

    // Add y-axis labels (source tokens) with better styling
    g.selectAll(".y-label")
      .data(tokens)
      .enter()
      .append("text")
      .attr("class", "y-label")
      .attr("x", -10)
      .attr("y", (d, i) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#475569")
      .text(d => d.text);

    // Add title with better styling
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text(`Head ${head.headIndex + 1} Attention Matrix`);

    // Add axis titles
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text("Target Tokens");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text("Source Tokens");

    // Add color legend
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = width - margin.right - legendWidth;
    const legendY = 15;

    // Create gradient for legend
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "attention-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    linearGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", colorScale(0));

    linearGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colorScale(1));

    // Add legend rectangle
    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#attention-gradient)")
      .attr("rx", 2)
      .attr("ry", 2);

    // Add legend labels
    svg.append("text")
      .attr("x", legendX)
      .attr("y", legendY - 5)
      .attr("text-anchor", "start")
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .text("Low Attention");

    svg.append("text")
      .attr("x", legendX + legendWidth)
      .attr("y", legendY - 5)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .text("High Attention");

  }, [tokens, head, width, height]);

  return <svg ref={svgRef} width={width} height={height} className="mx-auto" />;
};

export default AttentionMatrix;
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AttentionHead, Token } from '../types';

interface AttentionMatrixProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
  selectedTokenIndex: number | null;
}

const AttentionMatrix: React.FC<AttentionMatrixProps> = ({
  tokens,
  head,
  width,
  height,
  selectedTokenIndex
}) => {
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

    // Add background for better visibility
    g.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("width", innerWidth + 10)
      .attr("height", innerHeight + 10)
      .attr("fill", "#f8fafc")
      .attr("rx", 8)
      .attr("ry", 8);

    // Create the heatmap cells with animation
    tokens.forEach((sourceToken, i) => {
      tokens.forEach((targetToken, j) => {
        // Calculate percentage for display
        const percentage = (head.attention[i][j] * 100).toFixed(1);

        // Determine if cell should be highlighted based on selection
        const isHighlighted =
          selectedTokenIndex === i || // Row highlighted
          selectedTokenIndex === j;    // Column highlighted

        // Calculate enhanced color based on selection
        let cellColor = colorScale(head.attention[i][j]);
        if (selectedTokenIndex === i && selectedTokenIndex === j) {
          // Self-attention of selected token
          cellColor = '#ef4444'; // Red for self-attention of selected token
        } else if (selectedTokenIndex === i) {
          // From selected token to others - use orange/amber
          cellColor = d3.interpolateRgb('#f97316', '#0ea5e9')(head.attention[i][j]);
        } else if (selectedTokenIndex === j) {
          // From others to selected token - use green
          cellColor = d3.interpolateRgb('#10b981', '#0ea5e9')(head.attention[i][j]);
        }

        // Add cell with transition
        const cell = g.append("rect")
          .attr("x", j * cellSize)
          .attr("y", i * cellSize)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", "#f8fafc") // Start with light color
          .attr("stroke", isHighlighted ? "#3b82f6" : "#fff")
          .attr("stroke-width", isHighlighted ? 2 : 1)
          .attr("rx", 2)
          .attr("ry", 2)
          .attr("class", "matrix-cell")
          .attr("data-source", i)
          .attr("data-target", j)
          .style("cursor", "pointer");

        // Animate fill color
        cell.transition()
          .duration(500)
          .delay(i * 20 + j * 20) // Stagger the animations
          .attr("fill", cellColor);

        // Add tooltip
        cell.append("title")
          .text(`${sourceToken.text} → ${targetToken.text}: ${percentage}%`);

        // Add percentage text for cells that have significant attention (> 10%)
        // or for cells associated with the selected token
        if ((head.attention[i][j] > 0.1 || isHighlighted) && cellSize > 25) {
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

        // Add click event to cells
        cell.on("click", () => {
          // Get row index (source token)
          const sourceIndex = i;
          // Create custom event for token selection
          const selectionEvent = new CustomEvent('token-selection-change', {
            detail: { tokenIndex: sourceIndex === selectedTokenIndex ? null : sourceIndex }
          });
          // Dispatch the event
          window.dispatchEvent(selectionEvent);
        });
      });
    });

    // Add x-axis labels (target tokens) with better styling and highlight
    const xLabels = g.selectAll(".x-label")
      .data(tokens)
      .enter()
      .append("text")
      .attr("class", "x-label")
      .attr("x", (d, i) => i * cellSize + cellSize / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", (d, i) => i === selectedTokenIndex ? "#3b82f6" : "#475569")
      .attr("font-weight", (d, i) => i === selectedTokenIndex ? "bold" : "normal")
      .text(d => d.text)
      .style("cursor", "pointer");

    // Add click event to x-axis labels
    xLabels.on("click", function (this: SVGTextElement, _event: Event, d: Token) {
      const index = tokens.findIndex(token => token === d);
      const selectionEvent = new CustomEvent('token-selection-change', {
        detail: { tokenIndex: index === selectedTokenIndex ? null : index }
      });
      window.dispatchEvent(selectionEvent);
    });

    // Add y-axis labels (source tokens) with better styling and highlight
    const yLabels = g.selectAll(".y-label")
      .data(tokens)
      .enter()
      .append("text")
      .attr("class", "y-label")
      .attr("x", -10)
      .attr("y", (d, i) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "12px")
      .attr("fill", (d, i) => i === selectedTokenIndex ? "#3b82f6" : "#475569")
      .attr("font-weight", (d, i) => i === selectedTokenIndex ? "bold" : "normal")
      .text(d => d.text)
      .style("cursor", "pointer");

    // Add click event to y-axis labels
    yLabels.on("click", function (this: SVGTextElement, _event: Event, d: Token) {
      const index = tokens.findIndex(token => token === d);
      const selectionEvent = new CustomEvent('token-selection-change', {
        detail: { tokenIndex: index === selectedTokenIndex ? null : index }
      });
      window.dispatchEvent(selectionEvent);
    });

    // Add highlighting rectangles for selected token
    if (selectedTokenIndex !== null) {
      // Highlight row
      g.append("rect")
        .attr("x", -5)
        .attr("y", selectedTokenIndex * cellSize)
        .attr("width", tokens.length * cellSize + 5)
        .attr("height", cellSize)
        .attr("fill", "rgba(59, 130, 246, 0.1)")
        .attr("stroke", "none");

      // Highlight column
      g.append("rect")
        .attr("x", selectedTokenIndex * cellSize)
        .attr("y", -5)
        .attr("width", cellSize)
        .attr("height", tokens.length * cellSize + 5)
        .attr("fill", "rgba(59, 130, 246, 0.1)")
        .attr("stroke", "none");
    }

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

    // Add instructions when no token is selected
    if (selectedTokenIndex === null) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#64748b")
        .text("Click on any token or cell to highlight attention patterns");
    } else {
      // Show selected token info
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#3b82f6")
        .attr("font-weight", "medium")
        .text(`Selected: "${tokens[selectedTokenIndex].text}"`);
    }

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

    // If selected token, add legend for color scheme
    if (selectedTokenIndex !== null) {
      // Add special color legend for selection
      const selLegendY = legendY + 30;

      // Row selection - from selected to others
      svg.append("rect")
        .attr("x", legendX)
        .attr("y", selLegendY)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d3.interpolateRgb('#f97316', '#0ea5e9')(0.7))
        .attr("rx", 2);

      svg.append("text")
        .attr("x", legendX + 20)
        .attr("y", selLegendY + 10)
        .attr("alignment-baseline", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#64748b")
        .text(`From "${tokens[selectedTokenIndex].text}" to other tokens`);

      // Column selection - from others to selected
      svg.append("rect")
        .attr("x", legendX)
        .attr("y", selLegendY + 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d3.interpolateRgb('#10b981', '#0ea5e9')(0.7))
        .attr("rx", 2);

      svg.append("text")
        .attr("x", legendX + 20)
        .attr("y", selLegendY + 30)
        .attr("alignment-baseline", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#64748b")
        .text(`From other tokens to "${tokens[selectedTokenIndex].text}"`);

      // Self-attention
      svg.append("rect")
        .attr("x", legendX)
        .attr("y", selLegendY + 40)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "#ef4444")
        .attr("rx", 2);

      svg.append("text")
        .attr("x", legendX + 20)
        .attr("y", selLegendY + 50)
        .attr("alignment-baseline", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#64748b")
        .text(`Self-attention of "${tokens[selectedTokenIndex].text}"`);
    }

  }, [tokens, head, width, height, selectedTokenIndex]);

  return <svg ref={svgRef} width={width} height={height} className="mx-auto" />;
};

export default AttentionMatrix;
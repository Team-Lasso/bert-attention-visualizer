import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AttentionHead, Token } from '../types';

/*
被VisualizationDisplay.tsx调用
*/
interface AttentionMatrixProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
  selectedTokenIndex: number | null;
}

/**
 * Normalizes attention values to sum to 1 (100%) for each row
 */
const normalizeAttentionValues = (attentionMatrix: number[][]): number[][] => {
  console.log("Before normalization - row sums:", attentionMatrix.map(row =>
    row.reduce((acc, val) => acc + val, 0).toFixed(2)
  ));

  const normalized = attentionMatrix.map(row => {
    const sum = row.reduce((acc, val) => acc + val, 0);
    // If sum is 0, avoid division by zero
    if (sum === 0) return row.map(() => 0);
    // Normalize each value so the row sums to 1 (100%)
    return row.map(val => val / sum);
  });

  console.log("After normalization - row sums:", normalized.map(row =>
    row.reduce((acc, val) => acc + val, 0).toFixed(2)
  ));

  return normalized;
};

// Helper function to ensure percentages sum to 100%
const formatPercentagesWithCorrectSum = (row: number[]): string[] => {
  // A little extra logging to see what's happening
  console.log("Raw row values before percentage calculation:",
    row.map(v => v.toFixed(4)).join(", "),
    "Sum:", row.reduce((sum, v) => sum + v, 0).toFixed(4)
  );

  // Step 1: Calculate the exact percentages
  const exactPercentages = row.map(val => val * 100);

  // Step 2: Floor all values to get the integer part
  const flooredValues = exactPercentages.map(val => Math.floor(val));

  // Step 3: Calculate how much we're off by due to rounding
  const totalFloored = flooredValues.reduce((sum, val) => sum + val, 0);
  const remainingPercent = 100 - totalFloored;

  // Log the calculation
  console.log("After floor:", flooredValues.join(", "),
    "Sum:", totalFloored,
    "Remaining:", remainingPercent
  );

  // Step 4: Get the decimal parts to determine which values to round up
  const decimalParts = exactPercentages.map((val, i) => ({
    index: i,
    decimal: val - flooredValues[i]
  }));

  // Step 5: Sort by decimal part to distribute the remaining percentage
  decimalParts.sort((a, b) => b.decimal - a.decimal);

  // Step 6: Create the final percentages
  const finalPercentages = [...flooredValues];
  for (let i = 0; i < remainingPercent; i++) {
    if (i < decimalParts.length) {
      finalPercentages[decimalParts[i].index]++;
    }
  }

  // Final verification
  const total = finalPercentages.reduce((sum, val) => sum + val, 0);
  console.log("Final percentages:", finalPercentages.join(", "),
    "Sum:", total,
    total === 100 ? "✓" : "❌"
  );

  // Step 7: Format as percentage strings
  return finalPercentages.map(val => `${val}%`);
};

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

    // Log tokens to see what we're displaying
    console.log("Tokens to display:", tokens.map(t => ({
      text: t.text,
      index: t.index
    })));
    console.log("Total tokens:", tokens.length);

    // Check if we have more tokens than are displayed in the heatmap
    const firstRowValues = head.attention[0];
    if (firstRowValues.length !== tokens.length) {
      console.warn(`Attention matrix size mismatch: first row has ${firstRowValues.length} values but we have ${tokens.length} tokens`);
    }

    const margin = { top: 50, right: 20, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Normalize the attention matrix so each row sums to 100%
    const normalizedAttention = normalizeAttentionValues(head.attention);

    // Verify rows sum to 100% (approximately 1.0)
    const rowSums = normalizedAttention.map(row =>
      row.reduce((sum, val) => sum + val, 0)
    );
    console.log("Row sums in render (should all be close to 1.0):",
      rowSums.map(val => val.toFixed(2))
    );

    // Double check: compare original to normalized values for first row
    if (normalizedAttention.length > 0 && head.attention.length > 0) {
      console.log("Original first row:", head.attention[0].map(v => (v * 100).toFixed(0) + "%"));
      console.log("Normalized first row:", normalizedAttention[0].map(v => (v * 100).toFixed(0) + "%"));
    }

    // IMPORTANT: Check if we have a mismatch between tokens and attention matrix size
    // This could happen if the backend includes special tokens that aren't shown in the UI
    const matrixSize = normalizedAttention[0]?.length || 0;
    const visibleTokenCount = Math.min(tokens.length, matrixSize);

    if (matrixSize !== tokens.length) {
      console.warn(`Size mismatch: Attention matrix has ${matrixSize} columns but there are ${tokens.length} tokens. Using ${visibleTokenCount} tokens for visualization.`);
      // We'll use only the visible tokens for rendering, but this could affect accuracy
    }

    // Calculate cell size based on visible token count
    const cellSize = Math.min(
      innerWidth / visibleTokenCount,
      innerHeight / visibleTokenCount
    );

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Color scale for attention weights - using a more vibrant blue gradient
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(normalizedAttention.flat()) || 1]);

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
    for (let i = 0; i < visibleTokenCount; i++) {
      const sourceToken = tokens[i];
      // Pre-calculate all percentages for this row to ensure they sum to 100%
      const visibleRowValues = normalizedAttention[i].slice(0, visibleTokenCount);
      // Re-normalize the visible row to ensure it sums to 1.0
      const sum = visibleRowValues.reduce((acc, val) => acc + val, 0);
      const normalizedVisibleRow = sum > 0
        ? visibleRowValues.map(val => val / sum)
        : visibleRowValues;

      const rowPercentages = formatPercentagesWithCorrectSum(normalizedVisibleRow);

      for (let j = 0; j < visibleTokenCount; j++) {
        const targetToken = tokens[j];
        // Use the pre-calculated percentage that ensures row sums to 100%
        const percentage = rowPercentages[j];

        // Determine if cell should be highlighted based on selection
        const isHighlighted =
          selectedTokenIndex === i || // Row highlighted
          selectedTokenIndex === j;    // Column highlighted

        // Calculate enhanced color based on selection
        let cellColor = colorScale(normalizedAttention[i][j]);
        if (selectedTokenIndex === i && selectedTokenIndex === j) {
          // Self-attention of selected token
          cellColor = '#ef4444'; // Red for self-attention of selected token
        } else if (selectedTokenIndex === i) {
          // From selected token to others - use orange/amber
          cellColor = d3.interpolateRgb('#f97316', '#0ea5e9')(normalizedAttention[i][j]);
        } else if (selectedTokenIndex === j) {
          // From others to selected token - use green
          cellColor = d3.interpolateRgb('#10b981', '#0ea5e9')(normalizedAttention[i][j]);
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
          .text(`${sourceToken.text} → ${targetToken.text}: ${percentage}`);

        // Add percentage text for all cells where there's enough space
        if (cellSize > 20) {
          // Determine font size based on cell size
          const fontSize = Math.min(10, cellSize / 3);

          // Determine opacity based on value to slightly fade very low values
          // but still keep them visible (minimum 0.7 opacity)
          const textOpacity = Math.max(0.7, normalizedAttention[i][j] * 2);

          // Create percentage text with improved readability
          const textElement = g.append("text")
            .attr("x", j * cellSize + cellSize / 2)
            .attr("y", i * cellSize + cellSize / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", `${fontSize}px`)
            .attr("font-weight", "bold")
            .attr("fill", normalizedAttention[i][j] > 0.5 ? "white" : "black")
            .attr("stroke", normalizedAttention[i][j] > 0.5 ? "none" : "white") // Add stroke for better contrast
            .attr("stroke-width", "0.5px")
            .attr("paint-order", "stroke") // Make the stroke appear behind the text
            .attr("opacity", 0) // Start invisible
            .text(percentage);

          // Animate appearance
          textElement.transition()
            .duration(500)
            .delay(i * 20 + j * 20 + 300) // Appear after cell coloring
            .attr("opacity", textOpacity);
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
      }
    }

    // Add x-axis labels (target tokens) with better styling and highlight
    const xLabels = g.selectAll(".x-label")
      .data(tokens.slice(0, visibleTokenCount))
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
      .data(tokens.slice(0, visibleTokenCount))
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
    if (selectedTokenIndex !== null && selectedTokenIndex < visibleTokenCount) {
      // Highlight row
      g.append("rect")
        .attr("x", -5)
        .attr("y", selectedTokenIndex * cellSize)
        .attr("width", visibleTokenCount * cellSize + 5)
        .attr("height", cellSize)
        .attr("fill", "rgba(59, 130, 246, 0.1)")
        .attr("stroke", "none");

      // Highlight column
      g.append("rect")
        .attr("x", selectedTokenIndex * cellSize)
        .attr("y", -5)
        .attr("width", cellSize)
        .attr("height", visibleTokenCount * cellSize + 5)
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
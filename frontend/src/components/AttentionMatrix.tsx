import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AttentionHead, Token } from '../types';

interface AttentionMatrixProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
  selectedTokenIndex: number | null;
  skipTitle?: boolean;
  showPercentages?: boolean;
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
  selectedTokenIndex,
  skipTitle = false,
  showPercentages = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // IMPORTANT: Check if we have a mismatch between tokens and attention matrix size
    // This could happen if the backend includes special tokens that aren't shown in the UI
    const matrixSize = head.attention[0]?.length || 0;

    if (matrixSize !== tokens.length) {
      console.warn(`Attention matrix size mismatch: matrix has ${matrixSize} values but we have ${tokens.length} tokens`);
    }

    // Calculate base dimensions
    const providedWidth = width;
    const providedHeight = height;

    // Dynamically calculate matrix dimensions based on token count
    const tokenCount = tokens.length;

    // Calculate scaling factor - reduce size as token count increases, but not too much
    const optimalTokensForFullSize = 15; // Number of tokens at which we use full size
    const tokenCountFactor = tokenCount <= optimalTokensForFullSize ? 1 :
      (Math.log10(tokenCount) / Math.log10(optimalTokensForFullSize));
    const scaleFactor = Math.max(0.6, 1 - (tokenCountFactor * 0.25)); // Less aggressive scaling

    // Adjust margin based on token count and size
    const baseMargin = { top: 100, right: 30, bottom: 70, left: 100 }; // Increased left margin for angled labels
    // For larger token counts, we need more space for labels
    const margin = {
      top: baseMargin.top,
      right: baseMargin.right + (tokenCount > optimalTokensForFullSize ? 30 : 0),
      bottom: baseMargin.bottom + (tokenCount > optimalTokensForFullSize ? 30 : 0),
      left: baseMargin.left + (tokenCount > optimalTokensForFullSize ? 30 : 0)
    };

    // Determine if we need a larger matrix for many tokens
    // For many tokens, expand the matrix size but limit to some reasonable maximum
    const maxWidth = Math.min(1800, window.innerWidth * 0.98); // Increased maximum width
    const maxHeight = window.innerHeight * 0.95; // Increased maximum height

    // Calculate the dimensions needed for the visualization, giving more space per token
    const calculatedWidth = Math.min(maxWidth, Math.max(providedWidth, tokenCount * 50 * scaleFactor)); // Increased size per token
    const calculatedHeight = Math.min(maxHeight, Math.max(providedHeight, tokenCount * 50 * scaleFactor)); // Increased size per token

    // Set the dimensions of the SVG
    svg.attr("width", calculatedWidth)
      .attr("height", calculatedHeight);

    // Set container dimensions to match
    container.style.width = `${calculatedWidth}px`;
    container.style.height = `${calculatedHeight}px`;

    const innerWidth = calculatedWidth - margin.left - margin.right;
    const innerHeight = calculatedHeight - margin.top - margin.bottom;

    // Normalize the attention matrix so each row sums to 100%
    const normalizedAttention = normalizeAttentionValues(head.attention);

    // Function to safely access attention values, preventing out-of-bounds errors
    const getSafeAttentionValue = (sourceIdx: number, targetIdx: number): number => {
      if (sourceIdx < normalizedAttention.length &&
        normalizedAttention[sourceIdx] &&
        targetIdx < normalizedAttention[sourceIdx].length) {
        return normalizedAttention[sourceIdx][targetIdx];
      }
      return 0; // Default to 0 for out-of-bounds indices
    };

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

    // Calculate cell size based on available space and token count
    const cellSize = Math.min(
      innerWidth / tokenCount,
      innerHeight / tokenCount
    );

    // Ensure minimum cell size
    const minimumCellSize = Math.max(cellSize, 20); // Minimum cell size of 20px

    // Create main visualization group
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

    // Calculate font size based on cell size
    const fontSize = Math.min(12, Math.max(8, minimumCellSize / 3)); // Increased min font size
    const labelFontSize = Math.min(14, Math.max(10, 14 * scaleFactor)); // Increased label font size

    // Create the heatmap cells with animation
    for (let i = 0; i < tokenCount; i++) {
      const sourceToken = tokens[i];
      // Pre-calculate all percentages for this row to ensure they sum to 100%
      // Safely get row values, avoiding out-of-bounds issues
      const visibleRowValues = Array(tokenCount).fill(0).map((_, j) => getSafeAttentionValue(i, j));

      // Re-normalize the visible row to ensure it sums to 1.0
      const sum = visibleRowValues.reduce((acc, val) => acc + val, 0);
      const normalizedVisibleRow = sum > 0
        ? visibleRowValues.map(val => val / sum)
        : visibleRowValues;

      const rowPercentages = formatPercentagesWithCorrectSum(normalizedVisibleRow);

      for (let j = 0; j < tokenCount; j++) {
        const targetToken = tokens[j];
        // Use the pre-calculated percentage that ensures row sums to 100%
        const percentage = rowPercentages[j];

        // Calculate cell color - use the standard color scale for all cells
        const cellColor = colorScale(normalizedAttention[i][j]);

        // Add cell with transition
        const cell = g.append("rect")
          .attr("x", j * cellSize)
          .attr("y", i * cellSize)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", "#f8fafc") // Start with light color
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
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

        // Add percentage text for all cells, adapting size for readability
        // Only show percentages if showPercentages is true
        if (showPercentages) {
          // Use a more aggressive opacity for better visibility
          const textOpacity = Math.max(0.9, normalizedAttention[i][j] * 2);

          // Dynamically adjust font size based on cell size for very small cells
          const dynamicFontSize = Math.min(fontSize, Math.max(5, cellSize / 3.5));

          // Improve contrast calculation for text color - use an even lower threshold
          // For medium to dark cells, use white text with stronger opacity
          const textColor = normalizedAttention[i][j] > 0.25 ? "white" : "black";

          // Create percentage text with improved readability
          const textElement = g.append("text")
            .attr("x", j * cellSize + cellSize / 2)
            .attr("y", i * cellSize + cellSize / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", `${dynamicFontSize}px`)
            .attr("font-weight", "bold")
            .attr("fill", textColor)
            .attr("paint-order", "stroke") // Make the stroke appear behind the text
            .attr("opacity", 0); // Start invisible

          // Add stroke/outline for better contrast based on background
          if (normalizedAttention[i][j] > 0.25) {
            // For darker cells, add a dark outline around white text
            textElement.attr("stroke", "#00008B")
              .attr("stroke-width", "0.7px");
          } else {
            // For lighter cells, add a white outline around black text
            textElement.attr("stroke", "white")
              .attr("stroke-width", "1px");
          }

          // Set the text content
          textElement.text(cellSize < 10 ? rowPercentages[j].replace('%', '') : percentage);

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

    // Handle label display based on token count
    // Always show all labels regardless of token count

    // Add x-axis labels (target tokens) with better styling and highlight
    const xLabels = g.selectAll(".x-label")
      .data(tokens)
      .enter()
      .append("text")
      .attr("class", "x-label")
      .attr("x", (d, i) => i * cellSize + cellSize / 2)
      .attr("y", -15) // Moved further up
      .attr("text-anchor", "middle") // Back to middle anchor
      .attr("dominant-baseline", "central") // Added for vertical centering
      .attr("font-size", `${labelFontSize}px`)
      .attr("fill", (d, i) => i === selectedTokenIndex ? "#3b82f6" : "#475569")
      .attr("font-weight", (d, i) => i === selectedTokenIndex ? "bold" : "normal")
      .attr("transform", (d, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -15)`) // Adjusted rotation
      .text(d => d.text)
      .style("cursor", "pointer");

    // Add tooltip for x-axis labels
    xLabels.append("title")
      .text(d => d.text);

    // Truncate long token texts for x-axis (with adjusted logic for angled text)
    xLabels.each(function () {
      const textElement = d3.select(this);
      let textLength = (textElement.node() as SVGTextElement).getComputedTextLength();
      let text = textElement.text();
      const maxWidth = cellSize * 2.5; // Increased max width for angled labels

      if (textLength > maxWidth && text.length > 3) {
        // Truncate text and add ellipsis if it's too long
        while (textLength > maxWidth && text.length > 3) {
          text = text.slice(0, -1);
          textElement.text(text + '...');
          textLength = (textElement.node() as SVGTextElement).getComputedTextLength();
        }
      }
    });

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
      .attr("x", -10) // Adjusted position
      .attr("y", (d, i) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", `${labelFontSize}px`)
      .attr("fill", (d, i) => i === selectedTokenIndex ? "#3b82f6" : "#475569")
      .attr("font-weight", (d, i) => i === selectedTokenIndex ? "bold" : "normal")
      .attr("transform", (d, i) => `rotate(0, -10, ${i * cellSize + cellSize / 2})`) // Removed rotation for y-axis
      .text(d => d.text)
      .style("cursor", "pointer");

    // Add tooltip for y-axis labels
    yLabels.append("title")
      .text(d => d.text);

    // Truncate long token texts for y-axis
    yLabels.each(function () {
      const textElement = d3.select(this);
      let textLength = (textElement.node() as SVGTextElement).getComputedTextLength();
      let text = textElement.text();
      const maxWidth = margin.left - 35; // Increased space for y-axis labels

      if (textLength > maxWidth && text.length > 3) {
        // Truncate text and add ellipsis if it's too long
        while (textLength > maxWidth && text.length > 3) {
          text = text.slice(0, -1);
          textElement.text(text + '...');
          textLength = (textElement.node() as SVGTextElement).getComputedTextLength();
        }
      }
    });

    // Add click event to y-axis labels
    yLabels.on("click", function (this: SVGTextElement, _event: Event, d: Token) {
      const index = tokens.findIndex(token => token === d);
      const selectionEvent = new CustomEvent('token-selection-change', {
        detail: { tokenIndex: index === selectedTokenIndex ? null : index }
      });
      window.dispatchEvent(selectionEvent);
    });

    // Add title with better styling
    if (!skipTitle) {
      svg.append("text")
        .attr("x", calculatedWidth / 2)
        .attr("y", 30) // Moved title down
        .attr("text-anchor", "middle")
        .attr("font-size", "16px") // Increased font size
        .attr("font-weight", "bold")
        .attr("fill", "#1e293b")
        .text(head.headIndex === -1
          ? "Average Attention Matrix"
          : `Head ${head.headIndex + 1} Attention Matrix`);
    }

    // Add axis titles
    svg.append("text")
      .attr("x", calculatedWidth / 2)
      .attr("y", calculatedHeight - 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px") // Increased font size
      .attr("fill", "#64748b")
      .text("Target Tokens");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -calculatedHeight / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px") // Increased font size
      .attr("fill", "#64748b")
      .text("Source Tokens");

    // Add instructions when no token is selected
    if (selectedTokenIndex === null) {
      svg.append("text")
        .attr("x", calculatedWidth / 2)
        .attr("y", calculatedHeight - 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#64748b")
        .text("Click on any token or cell to highlight attention patterns");
    } else {
      // Show selected token info
      svg.append("text")
        .attr("x", calculatedWidth / 2)
        .attr("y", calculatedHeight - 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#3b82f6")
        .attr("font-weight", "medium")
        .text(`Selected: "${tokens[selectedTokenIndex].text}"`);
    }

    // Add token count indicator when many tokens are present
    if (tokenCount > 10) {
      const tokenCountInfo = document.createElement('div');
      tokenCountInfo.className = 'absolute top-2 right-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs';
      tokenCountInfo.textContent = `${tokenCount} tokens`;
      container.appendChild(tokenCountInfo);
    }

    // Add color legend
    const legendWidth = Math.min(200, calculatedWidth * 0.3);
    const legendHeight = 15;
    const legendX = calculatedWidth - margin.right - legendWidth;
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

  }, [tokens, head, width, height, selectedTokenIndex, skipTitle, showPercentages]);

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="mx-auto" />
    </div>
  );
};

export default AttentionMatrix;
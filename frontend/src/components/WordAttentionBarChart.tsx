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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guard against invalid data
    if (!svgRef.current || !containerRef.current) return;
    if (!data || !data.targetWords || !data.attentionValues || data.targetWords.length === 0) {
      // If data is empty or invalid, just clear the chart and return
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      return;
    }

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    svg.selectAll("*").remove();

    // Calculate the base dimensions to use
    const providedWidth = width;
    const providedHeight = height;

    // Determine if we need to resize based on token count
    const tokenCount = data.targetWords.length;
    const optimalBarHeight = 30; // Optimal height for each bar
    const minBarHeight = 15; // Minimum height for each bar

    // Calculate the required height for all bars
    const requiredHeight = tokenCount * optimalBarHeight + 80; // Add extra spacing for headers/margins

    // Determine if we need to expand the size
    const maxHeight = Math.min(800, window.innerHeight * 0.8); // Maximum reasonable height
    const calculatedHeight = Math.min(maxHeight, Math.max(providedHeight, requiredHeight));

    // Calculate bar height based on available space
    const availableHeightForBars = calculatedHeight - 80; // Accounting for margins and headers
    const barHeight = Math.max(minBarHeight, availableHeightForBars / tokenCount);

    // Set dimensions of the chart
    svg.attr("width", providedWidth)
      .attr("height", calculatedHeight);

    // Set container dimensions
    container.style.width = `${providedWidth}px`;
    container.style.height = `${calculatedHeight}px`;

    // Adjusted margins for horizontal layout
    const margin = { top: 40, right: 120, bottom: 40, left: 80 };
    const innerWidth = providedWidth - margin.left - margin.right;
    const innerHeight = calculatedHeight - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Enhanced color palette with more distinct colors
    const colorPalette = [
      // Blue shades
      '#3498db', '#2980b9', '#1a5276', '#5dade2', '#85c1e9',
      // Red/orange shades
      '#e74c3c', '#c0392b', '#d35400', '#f39c12', '#f5b041',
      // Green shades
      '#2ecc71', '#27ae60', '#229954', '#58d68d', '#a9dfbf',
      // Purple shades
      '#9b59b6', '#8e44ad', '#6c3483', '#bb8fce', '#d2b4de',
      // Teal/turquoise
      '#1abc9c', '#16a085', '#117a65', '#76d7c4', '#a3e4d7',
      // Additional colors
      '#34495e', '#7f8c8d', '#f1c40f', '#28b463', '#dc7633',
      '#af7ac5', '#5499c7', '#48c9b0', '#eb984e', '#884ea0'
    ];

    // MODIFIED: Check if we need to handle stacked data
    // We'll detect if we have multiple values per token by checking if there are duplicate tokens
    const uniqueTokens = new Set(data.targetWords);
    const hasStackedData = uniqueTokens.size < data.targetWords.length;

    if (hasStackedData) {
      // Handle stacked bar chart logic
      renderStackedBarChart();
    } else {
      // Handle regular bar chart
      renderRegularBarChart();
    }

    function renderRegularBarChart() {
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

      // Calculate font size based on bar height
      const fontSize = Math.max(8, Math.min(11, barHeight * 0.4));

      // Handle label truncation for very long words - safeguard against undefined input
      const truncateLabel = (text: string | null | undefined, maxLength: number): string => {
        // Handle null or undefined values
        if (text === null || text === undefined) return '';

        // Convert to string in case it's a number or other type
        const str = String(text);

        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
      };

      // Max label length - dynamically adjust based on chart width
      const maxLabelLength = Math.max(10, Math.floor(margin.left / 8));

      // Add Y axis (categories/tokens)
      g.append("g")
        .call(d3.axisLeft(y)
          .tickFormat(d => truncateLabel(d as string, maxLabelLength)))
        .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
        .call(g => g.selectAll(".tick line").attr("stroke", "#e2e8f0"))
        .call(g => g.selectAll(".tick text")
          .attr("font-size", `${fontSize}px`)
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

      // Assign each rectangle a static color based on its position
      // This avoids the complex d3 accessor pattern with typing issues
      const bars = g.selectAll(".bar")
        .data(sortedValues)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (_, i) => y(sortedWords[i]) || 0)
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .attr("rx", 3)
        .attr("ry", 3);

      // Set colors directly in a separate step to avoid TypeScript errors
      bars.each(function (_, i) {
        d3.select(this).attr("fill", colorPalette[originalIndices[i] % colorPalette.length]);
      });

      // Animate the bars
      bars.transition()
        .duration(750)
        .attr("width", d => Math.max(x(d), MIN_BAR_WIDTH));

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

      // Always show labels, but adapt them for small sizes
      // Calculate minimum font size based on bar height, with a lower limit
      const labelFontSize = Math.max(6, Math.min(10, barHeight * 0.4));

      // Add percentage labels inside or next to bars with improved positioning
      g.selectAll(".bar-label")
        .data(sortedValues)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("y", (_, i) => (y(sortedWords[i]) || 0) + y.bandwidth() / 2)
        .attr("x", d => {
          const barWidth = Math.max(x(d), MIN_BAR_WIDTH);
          // Use a more generous threshold to prevent overlap
          return barWidth > 60 ? barWidth - 10 : barWidth + 8;
        })
        .attr("dy", "0.35em") // Vertical centering
        .attr("text-anchor", d => x(d) > 60 ? "end" : "start") // Text alignment based on position
        .attr("font-size", `${labelFontSize}px`)
        .attr("fill", d => x(d) > 60 ? "white" : "#1e40af") // Text color based on position
        .attr("paint-order", "stroke") // Add stroke for better text readability
        .attr("stroke", d => x(d) > 60 ? "none" : "white") // Only add stroke for external labels
        .attr("stroke-width", "0.5px")
        .attr("font-weight", "bold")
        .attr("opacity", 0)
        .text(d => {
          // For very small bars, use more compact format
          if (barHeight < 10) {
            return d >= 0.01 ? `${Math.round(d * 100)}` : `<1`; // No % sign for small bars, just the number
          }

          // For normal sized bars, use standard format with % sign
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
    }

    function renderStackedBarChart() {
      // Process data to create stacked format
      // Group by token name first
      const tokenGroups = new Map<string, { word: string, values: number[], originalIndices: number[] }>();

      data.targetWords.forEach((word, index) => {
        if (!tokenGroups.has(word)) {
          tokenGroups.set(word, {
            word,
            values: [],
            originalIndices: []
          });
        }
        const group = tokenGroups.get(word)!;
        group.values.push(data.attentionValues[index]);
        group.originalIndices.push(index);
      });

      // Convert to array and sort by total value
      const groupedData = Array.from(tokenGroups.values())
        .map(group => ({
          word: group.word,
          values: group.values,
          originalIndices: group.originalIndices,
          total: group.values.reduce((a, b) => a + b, 0)
        }))
        .sort((a, b) => b.total - a.total);

      // Extract the unique tokens in order
      const uniqueTokens = groupedData.map(d => d.word);

      // For horizontal bars, y is the category (token) and x is the value (attention)
      const y = d3.scaleBand()
        .domain(uniqueTokens)
        .range([0, innerHeight])
        .padding(0.3); // More padding for better readability

      // X scale for values (horizontal bars)
      const maxTotalValue = d3.max(groupedData, d => d.total) || 1;
      const x = d3.scaleLinear()
        .domain([0, maxTotalValue])
        .nice()
        .range([0, innerWidth]);

      // Calculate font size based on bar height
      const fontSize = Math.max(8, Math.min(11, barHeight * 0.4));

      // Handle label truncation for very long words
      const truncateLabel = (text: string | null | undefined, maxLength: number): string => {
        if (text === null || text === undefined) return '';
        const str = String(text);
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
      };

      // Max label length - dynamically adjust based on chart width
      const maxLabelLength = Math.max(10, Math.floor(margin.left / 8));

      // Add Y axis (categories/tokens)
      g.append("g")
        .call(d3.axisLeft(y)
          .tickFormat(d => truncateLabel(d as string, maxLabelLength)))
        .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
        .call(g => g.selectAll(".tick line").attr("stroke", "#e2e8f0"))
        .call(g => g.selectAll(".tick text")
          .attr("font-size", `${fontSize}px`)
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

      // Draw stacked bars for each token group
      groupedData.forEach(group => {
        const tokenY = y(group.word) || 0;
        let xOffset = 0; // Keep track of where the next segment starts

        // Draw each segment of the stacked bar
        group.values.forEach((value, i) => {
          const segmentWidth = Math.max(x(value), MIN_BAR_WIDTH);
          const segmentColor = colorPalette[group.originalIndices[i] % colorPalette.length];

          // Draw segment
          const segment = g.append("rect")
            .attr("class", "bar-segment")
            .attr("y", tokenY)
            .attr("height", y.bandwidth())
            .attr("x", xOffset)
            .attr("width", 0) // Start at 0 for animation
            .attr("fill", segmentColor)
            .attr("rx", 2)
            .attr("ry", 2);

          // Add thin white separator between segments
          if (i > 0) {
            g.append("rect")
              .attr("class", "segment-separator")
              .attr("y", tokenY)
              .attr("height", y.bandwidth())
              .attr("x", xOffset - 1)
              .attr("width", 2)
              .attr("fill", "white")
              .attr("opacity", 0.9);
          }

          // Animate width
          segment.transition()
            .duration(750)
            .attr("width", segmentWidth);

          // Add percentage label for each segment if large enough
          if (value > 0.01 || (value > 0.001 && segmentWidth > 25)) {
            const percentageText = value >= 0.01
              ? `${(value * 100).toFixed(1)}%`
              : `${(value * 100).toFixed(2)}%`;

            const label = g.append("text")
              .attr("class", "segment-label")
              .attr("y", tokenY + y.bandwidth() / 2)
              .attr("x", xOffset + segmentWidth / 2)
              .attr("text-anchor", "middle")
              .attr("dy", "0.35em")
              .attr("font-size", `${fontSize}px`)
              .attr("fill", getContrastTextColor(segmentColor))
              .attr("font-weight", "bold")
              .attr("opacity", 0)
              .text(percentageText);

            // Animate label
            label.transition()
              .delay(750)
              .duration(300)
              .attr("opacity", 1);
          }

          // Update x offset for next segment
          xOffset += segmentWidth;
        });
      });
    }

    // Helper function to determine text color for optimal contrast
    function getContrastTextColor(hexColor: string): string {
      // Simple implementation - convert to RGB and check luminance
      const r = parseInt(hexColor.substring(1, 3), 16);
      const g = parseInt(hexColor.substring(3, 5), 16);
      const b = parseInt(hexColor.substring(5, 7), 16);

      // Calculate luminance - simplified formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Use white text for dark backgrounds, black text for light backgrounds
      return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    // Add title
    svg.append("text")
      .attr("x", providedWidth / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text(`Attention from "${data.sourceWord}" to other subword tokens`);

    // Add X axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "12px")
      .text("Attention Percentage");

    // Add token count indicator when many tokens are present
    if (tokenCount > 10) {
      const tokenCountInfo = document.createElement('div');
      tokenCountInfo.className = 'absolute top-2 right-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs';
      tokenCountInfo.textContent = `${tokenCount} tokens`;
      container.appendChild(tokenCountInfo);
    }

  }, [data, width, height]);

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="mx-auto" />
    </div>
  );
};

export default WordAttentionBarChart;
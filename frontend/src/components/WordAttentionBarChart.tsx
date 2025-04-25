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

    // Additional validation - remove undefined tokens and normalize remaining values
    const validatedData = {
      ...data,
      sourceWord: data.sourceWord || '[UNKNOWN]',
      // Filter out any undefined or null tokens along with their attention values
      targetWords: [],
      attentionValues: []
    };

    // Copy only the valid token/value pairs
    data.targetWords.forEach((word, index) => {
      if (word !== undefined && word !== null && word !== 'undefined') {
        validatedData.targetWords.push(word);
        validatedData.attentionValues.push(data.attentionValues[index]);
      }
    });

    // Log warnings if we had to filter any data
    if (data.sourceWord === undefined || data.sourceWord === null) {
      console.warn('WordAttentionBarChart: sourceWord was undefined, replaced with [UNKNOWN]');
    }

    const filteredTokenCount = data.targetWords.length - validatedData.targetWords.length;
    if (filteredTokenCount > 0) {
      console.warn(`WordAttentionBarChart: ${filteredTokenCount} undefined or null tokens were filtered out`);
    }

    // Re-normalize the attention values to ensure they sum to 100%
    if (validatedData.attentionValues.length > 0) {
      const totalAttention = validatedData.attentionValues.reduce((sum, val) => sum + val, 0);

      // Only normalize if needed (sum not approximately 1.0)
      if (Math.abs(totalAttention - 1.0) > 0.001) {
        console.warn(`WordAttentionBarChart: Re-normalizing attention values (original sum: ${(totalAttention * 100).toFixed(1)}%)`);
        validatedData.attentionValues = validatedData.attentionValues.map(val => val / totalAttention);
      }
    }

    // Use validated data from here on
    const validData = validatedData;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    svg.selectAll("*").remove();

    // Calculate the base dimensions to use
    const providedWidth = width;
    const providedHeight = height;

    // Determine if we need to resize based on token count
    const tokenCount = validData.targetWords.length;
    const optimalBarHeight = 38; // INCREASED optimal height for each bar (was 30)
    const minBarHeight = 22; // INCREASED minimum height for each bar (was 15)

    // Calculate the required height for all bars
    const requiredHeight = tokenCount * optimalBarHeight + 100; // INCREASED extra spacing (was 80)

    // Determine if we need to expand the size
    const maxHeight = Math.min(900, window.innerHeight * 0.8); // INCREASED maximum height (was 800)
    const calculatedHeight = Math.min(maxHeight, Math.max(providedHeight, requiredHeight));

    // Calculate bar height based on available space
    const availableHeightForBars = calculatedHeight - 100; // INCREASED spacing for margins/headers (was 80)
    const barHeight = Math.max(minBarHeight, availableHeightForBars / tokenCount);

    // Set dimensions of the chart
    svg.attr("width", providedWidth)
      .attr("height", calculatedHeight);

    // Set container dimensions
    container.style.width = `${providedWidth}px`;
    container.style.height = `${calculatedHeight}px`;

    // Adjusted margins for horizontal layout - INCREASE right margin again
    const margin = { top: 40, right: 180, bottom: 40, left: 100 };
    const innerWidth = providedWidth - margin.left - margin.right;
    const innerHeight = calculatedHeight - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Enhanced color palette with more distinct colors - EXPANDED with additional color groups
    const colorPalette = [
      // Blue shades
      '#3498db', '#2980b9', '#1a5276', '#5dade2', '#85c1e9', '#2e86c1', '#21618c', '#0b4c8a',
      // Red/orange shades
      '#e74c3c', '#c0392b', '#d35400', '#f39c12', '#f5b041', '#cb4335', '#a93226', '#e67e22', '#f4d03f',
      // Green shades
      '#2ecc71', '#27ae60', '#229954', '#58d68d', '#a9dfbf', '#239b56', '#145a32', '#7dcea0', '#186a3b',
      // Purple shades
      '#9b59b6', '#8e44ad', '#6c3483', '#bb8fce', '#d2b4de', '#7d3c98', '#5b2c6f', '#a569bd', '#c39bd3',
      // Teal/turquoise
      '#1abc9c', '#16a085', '#117a65', '#76d7c4', '#a3e4d7', '#45b39d', '#138d75', '#0e6655', '#73c6b6',
      // Pink/Magenta shades
      '#e84393', '#fd79a8', '#f8a5c2', '#f78fb3', '#c2185b', '#880e4f', '#e91e63', '#f06292', '#ad1457',
      // Brown/Amber shades
      '#d35400', '#a04000', '#873600', '#ba4a00', '#e67e22', '#f39c12', '#b9770e', '#9a7d0a', '#7d6608',
      // Gray/Slate shades
      '#34495e', '#5d6d7e', '#85929e', '#283747', '#212f3d', '#1c2833', '#566573', '#707b7c', '#909497',
      // Indigo/Violet shades
      '#3f51b5', '#303f9f', '#5c6bc0', '#7986cb', '#9fa8da', '#512da8', '#673ab7', '#7e57c2', '#9575cd',
      // Additional varied colors
      '#f1c40f', '#28b463', '#dc7633', '#af7ac5', '#5499c7', '#48c9b0', '#eb984e', '#884ea0', '#f7dc6f',
      '#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#1abc9c', '#f39c12', '#34495e', '#7f8c8d', '#8e44ad',
      '#16a085', '#d35400', '#27ae60', '#8e44ad', '#2c3e50', '#e67e22', '#2980b9', '#c0392b', '#229954'
    ];

    // MODIFIED: Check if we need to handle stacked data
    // We'll detect if we have multiple values per token by checking if there are duplicate tokens
    const uniqueTokens = new Set(validData.targetWords);
    const hasStackedData = uniqueTokens.size < validData.targetWords.length;

    // Instead of using stacked bars for duplicate tokens, we'll make each token unique
    // by adding its position index when needed
    const uniqueTokenData = {
      ...validData,
      targetWords: validData.targetWords.map((word, index) => {
        // Add position index to all tokens
        return `${word} (${index})`;
      })
    };

    // Always use regular bar chart with our modified data that makes each token unique
    renderRegularBarChart(uniqueTokenData);

    function renderRegularBarChart(data = validData) {
      // Create data with indices for sorting
      const indexedData = data.attentionValues.map((value, i) => ({
        value: Math.max(value, 0.00001), // Ensure minimum value for log scale
        word: data.targetWords[i] || '[UNKNOWN]', // Ensure word is never undefined
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
        .padding(0.4); // INCREASED padding for better spacing between bars (was 0.3)

      // X scale for values (horizontal bars)
      const maxValue = d3.max(sortedValues) || 1;
      const x = d3.scaleLinear()
        .domain([0, maxValue])
        .nice()
        .range([0, innerWidth]);

      // Calculate font size based on bar height
      const fontSize = Math.max(9, Math.min(12, barHeight * 0.4)); // INCREASED font size (was 8-11)

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
      const maxLabelLength = Math.max(12, Math.floor(margin.left / 7)); // INCREASED from 10/8

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
          const targetWord = sortedWords[i] === '[UNKNOWN]' ? 'Unknown token' : sortedWords[i];
          return `${validData.sourceWord} → ${targetWord}: ${formattedPercentage}%`;
        });

      // Calculate minimum font size based on bar height, with a lower limit
      const labelFontSize = Math.max(9, Math.min(11, barHeight * 0.4)); // INCREASED minimum font size (was 6-10)

      // Add percentage labels inside or next to bars with improved positioning
      g.selectAll(".bar-label")
        .data(sortedValues)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("y", (_, i) => (y(sortedWords[i]) || 0) + y.bandwidth() / 2)
        .attr("x", d => {
          const barWidth = Math.max(x(d), MIN_BAR_WIDTH);
          // FIXED positioning logic to prevent overlap at threshold boundaries
          // Use a clearer threshold with a buffer zone
          if (barWidth > 75) {
            // For definitely long bars, position label well inside but not too close to the edge
            return Math.min(barWidth - 30, innerWidth - 30);
          } else if (barWidth < 55) {
            // For definitely short bars, position label clearly outside
            return barWidth + 15;
          } else {
            // For bars in the "gray zone", position based on exact size
            // to prevent threshold-related positioning issues
            return barWidth > 65 ? Math.min(barWidth - 25, innerWidth - 30) : barWidth + 15;
          }
        })
        .attr("dy", "0.35em") // Vertical centering
        .attr("text-anchor", d => {
          const barWidth = Math.max(x(d), MIN_BAR_WIDTH);
          // Match the same thresholds used for x positioning
          return barWidth > 65 ? "end" : "start";
        })
        .attr("font-size", `${labelFontSize}px`)
        .attr("fill", d => {
          const barWidth = Math.max(x(d), MIN_BAR_WIDTH);
          // Match the same thresholds used for x positioning
          return barWidth > 65 ? "white" : "#1e40af";
        })
        .attr("paint-order", "stroke") // Add stroke for better text readability
        .attr("stroke", d => {
          const barWidth = Math.max(x(d), MIN_BAR_WIDTH);
          // Match the same thresholds used for x positioning
          return barWidth > 65 ? "none" : "white";
        })
        .attr("stroke-width", "0.7px")
        .attr("font-weight", "bold")
        .attr("opacity", 0)
        .text(d => {
          // For very small bars, use more compact format
          if (barHeight < 15) {
            return d >= 0.01 ? `${Math.round(d * 100)}` : `<1`;
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

    // Original renderStackedBarChart function can stay but won't be used
    function renderStackedBarChart() {
      // Process data to create stacked format
      // Group by token name first
      const tokenGroups = new Map<string, { word: string, values: number[], originalIndices: number[] }>();

      validData.targetWords.forEach((word, index) => {
        // Ensure word is never undefined
        const safeWord = word || '[UNKNOWN]';

        if (!tokenGroups.has(safeWord)) {
          tokenGroups.set(safeWord, {
            word: safeWord,
            values: [],
            originalIndices: []
          });
        }
        const group = tokenGroups.get(safeWord)!;
        group.values.push(validData.attentionValues[index]);
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
        .padding(0.4); // INCREASED padding for better spacing between bars (was 0.3)

      // X scale for values (horizontal bars)
      const maxTotalValue = d3.max(groupedData, d => d.total) || 1;
      const x = d3.scaleLinear()
        .domain([0, maxTotalValue])
        .nice()
        .range([0, innerWidth]);

      // Calculate font size based on bar height
      const fontSize = Math.max(9, Math.min(12, barHeight * 0.4)); // INCREASED font size

      // Handle label truncation for very long words
      const truncateLabel = (text: string | null | undefined, maxLength: number): string => {
        if (text === null || text === undefined) return '';
        const str = String(text);
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
      };

      // Max label length - dynamically adjust based on chart width
      const maxLabelLength = Math.max(12, Math.floor(margin.left / 7)); // INCREASED from 10/8

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
          // IMPROVED: More selective about which segments get labels to prevent overlap
          if ((value > 0.01 && segmentWidth > 40) || (value > 0.001 && segmentWidth > 50)) {
            const percentageText = value >= 0.1
              ? `${(value * 100).toFixed(1)}%` // ≥ 10%: 1 decimal
              : value >= 0.01
                ? `${(value * 100).toFixed(1)}%` // 1-9.9%: 1 decimal
                : `${(value * 100).toFixed(2)}%`; // < 1%: 2 decimals

            const labelFontSize = Math.max(9, Math.min(11, barHeight * 0.4)); // INCREASED font size

            const label = g.append("text")
              .attr("class", "segment-label")
              .attr("y", tokenY + y.bandwidth() / 2)
              .attr("x", xOffset + segmentWidth / 2)
              .attr("text-anchor", "middle")
              .attr("dy", "0.35em")
              .attr("font-size", `${labelFontSize}px`) // Use improved font size
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

    // Add title - IMPROVED: Increased spacing from top
    svg.append("text")
      .attr("x", providedWidth / 2)
      .attr("y", 25) // INCREASED from 20 for better spacing
      .attr("text-anchor", "middle")
      .attr("font-size", "16px") // INCREASED from 14px for better readability
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text(`Attention from "${validData.sourceWord}" to other subword tokens`);

    // Add X axis label - IMPROVED: Better positioning
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "13px") // INCREASED from 12px
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
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { AttentionHead, Token } from "../types";

/*
this component is called in VisualizationDisplay.tsx
*/
interface ParallelViewProps {
  tokens: Token[];
  head: AttentionHead;
  width: number;
  height: number;
  selectedTokenIndex: number | null;
}

const ParallelView: React.FC<ParallelViewProps> = ({
  tokens,
  head,
  width,
  height,
  selectedTokenIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    // Force a re-render after initial render to make sure DOM elements are available
    if (!rendered) {
      setRendered(true);
      return;
    }

    if (!containerRef.current || !svgRef.current) return;

    // Clear previous renders
    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    // Clear existing content except the SVG
    Array.from(container.children).forEach((child) => {
      if (child !== svgRef.current) {
        container.removeChild(child);
      }
    });

    // IMPORTANT: Check if we have a mismatch between tokens and attention matrix size
    // This could happen if the backend includes special tokens that aren't shown in the UI
    const matrixSize = head.attention[0]?.length || 0;

    if (matrixSize !== tokens.length) {
      console.warn(
        `Size mismatch in ParallelView: Attention matrix has ${matrixSize} columns but there are ${tokens.length} tokens.`
      );
    }

    // Function to safely access attention values, preventing out-of-bounds errors
    const getSafeAttentionValue = (
      sourceIdx: number,
      targetIdx: number
    ): number => {
      if (sourceIdx < head.attention.length && targetIdx < matrixSize) {
        return head.attention[sourceIdx][targetIdx];
      }
      return 0; // Default to 0 for out-of-bounds indices
    };

    // Base container dimensions
    const providedWidth = width;
    const providedHeight = height;

    // Calculate dynamic size based on token count
    const minTokenHeight = 35; // Further increased minimum height
    const minTokenGap = 8; // Further increased minimum gap
    const minTokenWidth = 150; // Further increased minimum width

    // Base sizes for reference - increasing these values makes all tokens larger
    const baseTokenWidth = 220; // Significantly larger token width
    const baseTokenHeight = 50; // Significantly larger token height
    const baseTokenGap = 16; // Increased gap for better spacing

    // Adaptive scaling - gradually reduce size as token count increases
    // Use a logarithmic scale to handle very large token counts while keeping tokens readable
    const tokenCountFactor =
      tokens.length <= 10 ? 1 : Math.log10(tokens.length) / Math.log10(50);
    const scaleFactor = Math.max(0.5, 1 - tokenCountFactor * 0.5);

    // Calculate token dimensions
    const tokenWidth = Math.max(minTokenWidth, baseTokenWidth * scaleFactor);
    const percentageColumnWidth = Math.max(100, 100 * scaleFactor);
    const tokenHeight = Math.max(minTokenHeight, baseTokenHeight * scaleFactor);
    const tokenGap = Math.max(minTokenGap, baseTokenGap * scaleFactor);
    const totalTokenHeight = tokenHeight + tokenGap;

    // Total required height for all tokens
    const totalRequiredHeight = tokens.length * totalTokenHeight + 80; // Add extra padding

    // Dynamically adjust the container height to fit all tokens if possible
    // Use the provided height as a minimum, but expand if needed to fit all tokens
    // NEW: If we have fewer tokens, shrink the container to fit
    const minHeightBasedOnTokens = Math.min(
      providedHeight,
      totalRequiredHeight
    );
    const containerHeight =
      tokens.length <= 10
        ? minHeightBasedOnTokens // For few tokens, use the smaller calculated height
        : Math.max(providedHeight - 50, totalRequiredHeight); // For many tokens, expand as needed

    // If the container becomes too tall, enable scrolling
    const maxHeight = window.innerHeight * 0.8; // Max 80% of viewport height
    const needsScroll = containerHeight > maxHeight;

    // Create content area - dynamically sized or scrollable
    const contentArea = document.createElement("div");
    contentArea.className = "relative w-full";

    if (needsScroll) {
      contentArea.style.height = `${maxHeight}px`;
      contentArea.style.overflowY = "auto";
      contentArea.style.overflowX = "hidden";
      contentArea.style.paddingRight = "5px"; // Account for scrollbar
    } else {
      contentArea.style.height = `${containerHeight}px`;
    }

    // Set container dimensions - dynamically sized based on content
    container.style.height = needsScroll
      ? `${maxHeight + 50}px`
      : `${containerHeight + 50}px`;

    // Apply compact styling for small token counts
    if (tokens.length <= 10) {
      container.style.marginBottom = "0";
      container.style.paddingBottom = "0";
    }

    const containerWidth = providedWidth;

    // Adjust between column gap based on available space
    const betweenColumnGap = Math.max(200, 120 * scaleFactor); // Increased minimum gap to 50px and base value to 120

    // Total content width
    const totalContentWidth =
      tokenWidth * 2 + percentageColumnWidth + betweenColumnGap * 2;

    // Calculate left offset to center the entire layout
    const leftOffset = Math.max(0, (containerWidth - totalContentWidth) / 2);

    // Calculate column positions with proper centering
    const sourceColX = leftOffset;
    const targetColX = sourceColX + tokenWidth + betweenColumnGap;
    const percentageColX = targetColX + tokenWidth + 30; // Fixed smaller gap of 30px instead of betweenColumnGap/2

    // Create main layout
    const mainLayout = document.createElement("div");
    mainLayout.className = "flex flex-col w-full";
    container.appendChild(mainLayout);

    // Create header
    const header = document.createElement("div");
    header.className = "flex w-full mb-8 px-2"; // Increased bottom margin
    header.style.paddingLeft = `${leftOffset}px`; // Align headers with columns

    const sourceHeader = document.createElement("div");
    sourceHeader.className = "font-bold text-slate-700 text-xl"; // Increased font size
    sourceHeader.style.width = `${tokenWidth}px`;
    sourceHeader.style.textAlign = "center";
    sourceHeader.textContent = "Source Tokens";

    const targetHeader = document.createElement("div");
    targetHeader.className = "font-bold text-slate-700 text-xl"; // Increased font size
    targetHeader.style.width = `${tokenWidth}px`;
    targetHeader.style.textAlign = "center";
    targetHeader.style.marginLeft = `${betweenColumnGap}px`;
    targetHeader.textContent = "Target Tokens";

    const percentageHeader = document.createElement("div");
    percentageHeader.className = "font-bold text-slate-700 text-xl"; // Increased font size
    percentageHeader.style.width = `${percentageColumnWidth}px`;
    percentageHeader.style.textAlign = "center";
    percentageHeader.style.marginLeft = `${25}px`; //! chen chenged this, now is a fixed value, maybe wrong
    percentageHeader.textContent = "Attention";

    header.appendChild(sourceHeader);
    header.appendChild(targetHeader);
    header.appendChild(percentageHeader);
    mainLayout.appendChild(header);

    // Create content container
    mainLayout.appendChild(contentArea);

    // Create inner content div for scroll support
    const innerContent = document.createElement("div");
    innerContent.className = "relative w-full";
    innerContent.style.height = `${totalRequiredHeight}px`;
    contentArea.appendChild(innerContent);

    // Position SVG as the background for connections
    svgRef.current.style.position = "absolute";
    svgRef.current.style.top = "0";
    svgRef.current.style.left = "0";
    svgRef.current.style.width = `${containerWidth}px`;
    svgRef.current.style.height = `${totalRequiredHeight}px`;
    innerContent.appendChild(svgRef.current);

    // Set SVG dimensions properly with D3
    svg.attr("width", containerWidth).attr("height", totalRequiredHeight);

    // Create token columns
    const sourceColumn = document.createElement("div");
    sourceColumn.className = "absolute top-0";
    sourceColumn.style.width = `${tokenWidth}px`;
    sourceColumn.style.left = `${sourceColX}px`;

    const targetColumn = document.createElement("div");
    targetColumn.className = "absolute top-0";
    targetColumn.style.width = `${tokenWidth}px`;
    targetColumn.style.left = `${targetColX}px`;

    const percentageColumn = document.createElement("div");
    percentageColumn.className = "absolute top-0";
    percentageColumn.style.width = `${percentageColumnWidth}px`;
    percentageColumn.style.left = `${percentageColX}px`;

    innerContent.appendChild(sourceColumn);
    innerContent.appendChild(targetColumn);
    innerContent.appendChild(percentageColumn);

    // Style for improved appearance
    header.style.display = "flex";
    header.style.width = "100%";

    // Create expanded color palette with more vibrant and distinct colors
    const colors = [
      // Primary blue spectrum
      "#3498db",
      "#2980b9",
      "#1a5276",
      "#5dade2",
      "#85c1e9",
      // Red spectrum
      "#e74c3c",
      "#c0392b",
      "#922b21",
      "#f1948a",
      "#fadbd8",
      // Green spectrum
      "#2ecc71",
      "#27ae60",
      "#229954",
      "#58d68d",
      "#a9dfbf",
      // Orange spectrum
      "#f39c12",
      "#d35400",
      "#a04000",
      "#f5b041",
      "#fad7a0",
      // Purple spectrum
      "#9b59b6",
      "#8e44ad",
      "#6c3483",
      "#bb8fce",
      "#d2b4de",
      // Teal and turquoise
      "#1abc9c",
      "#16a085",
      "#117a65",
      "#76d7c4",
      "#a3e4d7",
      // Mixed colors
      "#34495e",
      "#95a5a6",
      "#7f8c8d",
      "#f1c40f",
      "#28b463",
      "#dc7633",
      "#af7ac5",
      "#5499c7",
      "#48c9b0",
      "#eb984e",
      "#884ea0",
      "#2471a3",
      "#0e6655",
      "#ba4a00",
      "#2e4053",
    ];

    // Store token elements for precise positioning
    const sourceTokenElements: HTMLElement[] = [];
    const targetTokenElements: HTMLElement[] = [];
    const percentageElements: Map<string, HTMLElement> = new Map(); // Store percentage elements for each connection

    // Create tokens with exact positioning - use all tokens
    tokens.forEach((token, i) => {
      const color = colors[i % colors.length];
      const topPosition = i * totalTokenHeight;

      // Source token
      const sourceTokenWrap = document.createElement("div");
      sourceTokenWrap.className = "absolute w-full";
      sourceTokenWrap.style.top = `${topPosition}px`;
      sourceColumn.appendChild(sourceTokenWrap);

      const sourceToken = document.createElement("div");
      sourceToken.className =
        "rounded-md flex items-center justify-center font-medium text-white cursor-pointer transition-all";
      sourceToken.style.height = `${tokenHeight}px`;
      sourceToken.style.backgroundColor = color;
      sourceToken.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      sourceToken.textContent = token.text;
      sourceToken.dataset.index = i.toString();
      sourceTokenWrap.appendChild(sourceToken);
      sourceTokenElements.push(sourceToken);

      // Adjust font size based on token length and available width
      const fontSize = Math.min(18, Math.max(12, 18 * scaleFactor)); // Further increased font size range
      sourceToken.style.fontSize = `${fontSize}px`;

      // Add text truncation for very long tokens
      sourceToken.style.overflow = "hidden";
      sourceToken.style.textOverflow = "ellipsis";
      sourceToken.style.whiteSpace = "nowrap";
      sourceToken.style.padding = "0 12px"; // Increased padding for better text display

      // Add enhanced selection effect
      if (selectedTokenIndex === i) {
        sourceToken.style.boxShadow =
          "0 0 0 3px #3b82f6, 0 2px 4px rgba(0,0,0,0.1)";
        sourceToken.style.transform = "scale(1.05)";
        sourceToken.style.position = "relative";
        sourceToken.style.zIndex = "10";

        // Add indicator icon for the selected token
        const indicator = document.createElement("div");
        indicator.className =
          "absolute -right-2 -top-2 bg-indigo-600 rounded-full w-6 h-6 flex items-center justify-center";
        indicator.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        sourceToken.appendChild(indicator);

        // Auto-scroll to the selected token if needed
        if (needsScroll) {
          const scrollPos =
            topPosition - contentArea.clientHeight / 2 + tokenHeight / 2;
          contentArea.scrollTop = Math.max(0, scrollPos);
        }
      }

      // Add hover effect to all source tokens
      sourceToken.onmouseover = () => {
        if (selectedTokenIndex !== i) {
          sourceToken.style.transform = "scale(1.03)";
          sourceToken.style.boxShadow =
            "0 0 0 1px #e2e8f0, 0 4px 6px rgba(0,0,0,0.1)";
        }
      };

      sourceToken.onmouseout = () => {
        if (selectedTokenIndex !== i) {
          sourceToken.style.transform = "scale(1)";
          sourceToken.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        }
      };

      // Target token with the same position
      const targetTokenWrap = document.createElement("div");
      targetTokenWrap.className = "absolute w-full";
      targetTokenWrap.style.top = `${topPosition}px`;
      targetColumn.appendChild(targetTokenWrap);

      const targetToken = document.createElement("div");
      targetToken.className =
        "rounded-md flex items-center justify-center font-medium text-white";
      targetToken.style.height = `${tokenHeight}px`;
      targetToken.style.backgroundColor = color;
      targetToken.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      targetToken.textContent = token.text;
      targetToken.style.fontSize = `${fontSize}px`; // Apply same font size

      // Add text truncation for very long tokens
      targetToken.style.overflow = "hidden";
      targetToken.style.textOverflow = "ellipsis";
      targetToken.style.whiteSpace = "nowrap";
      targetToken.style.padding = "0 12px"; // Increased padding

      targetTokenWrap.appendChild(targetToken);
      targetTokenElements.push(targetToken);

      // Percentage placeholder for each target token row
      const percentageWrap = document.createElement("div");
      percentageWrap.className = "absolute w-full";
      percentageWrap.style.top = `${topPosition}px`;
      percentageColumn.appendChild(percentageWrap);

      // Create a div to hold percentage values
      const percentageDiv = document.createElement("div");
      percentageDiv.className = "flex items-center justify-start h-full";
      percentageDiv.style.height = `${tokenHeight}px`;
      percentageWrap.appendChild(percentageDiv);

      // Store the reference to this div for later use
      percentageElements.set(`target-${i}`, percentageDiv);

      // Click handler for source tokens
      sourceToken.addEventListener("click", () => {
        const tokenIndex = parseInt(sourceToken.dataset.index || "0");
        const event = new CustomEvent("token-select", {
          detail: {
            tokenIndex: tokenIndex === selectedTokenIndex ? null : tokenIndex,
          },
        });
        container.dispatchEvent(event);
      });
    });

    // Draw connections layer
    const connectionsGroup = svg.append("g").attr("class", "connections");

    // Helper function to get token position
    const getTokenPosition = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const containerRect = innerContent.getBoundingClientRect();
      return {
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        top: rect.top - containerRect.top,
        bottom: rect.bottom - containerRect.top,
        centerY: rect.top + rect.height / 2 - containerRect.top,
      };
    };

    // Draw attention connections with exact alignment
    if (tokens.length > 0) {
      setTimeout(() => {
        // Clear any existing percentage values
        percentageElements.forEach((element) => {
          element.innerHTML = "";
        });

        if (selectedTokenIndex !== null && selectedTokenIndex < tokens.length) {
          // Selected token to all targets
          const sourceToken = sourceTokenElements[selectedTokenIndex];
          const sourcePos = getTokenPosition(sourceToken);

          // Get attention values for all target tokens that exist in the matrix
          const attentionValues = tokens
            .map((_, targetIdx) => {
              // Ensure target index is within the attention matrix bounds
              const value = getSafeAttentionValue(
                selectedTokenIndex,
                targetIdx
              );

              return {
                targetIdx,
                value,
              };
            })
            .filter((item) => item.value > 0.00001); // Filter out very small values

          // Ensure percentages sum to 100% - normalize the values
          const totalAttention = attentionValues.reduce(
            (sum, { value }) => sum + value,
            0
          );
          const normalizedValues = attentionValues.map((item) => ({
            ...item,
            value:
              totalAttention > 0 ? item.value / totalAttention : item.value,
          }));

          // Sort by value in descending order
          normalizedValues.sort((a, b) => b.value - a.value);

          // Draw connections for sorted values
          normalizedValues.forEach(({ targetIdx, value }) => {
            const targetToken = targetTokenElements[targetIdx];
            const targetPos = getTokenPosition(targetToken);

            // Draw connection line
            drawConnection(
              connectionsGroup,
              sourcePos.right, // Start at right edge of source
              sourcePos.centerY,
              targetPos.left, // End at left edge of target
              targetPos.centerY,
              value,
              colors[selectedTokenIndex % colors.length],
              0.8
            );

            // Add percentage to the percentage column
            const percentageElement = percentageElements.get(
              `target-${targetIdx}`
            );
            if (percentageElement) {
              // Format percentage based on value
              const percentageText =
                value >= 0.01
                  ? Math.round(value * 100) + "%" // ≥ 1%: no decimal
                  : value >= 0.001
                  ? (value * 100).toFixed(1) + "%" // 0.1% to 0.9%: 1 decimal
                  : value >= 0.0001
                  ? (value * 100).toFixed(2) + "%" // 0.01% to 0.09%: 2 decimals
                  : (value * 100).toFixed(3) + "%"; // < 0.01%: 3 decimals

              // Create percentage badge with improved styling
              const badge = document.createElement("div");
              badge.className =
                "font-bold text-center transition-all px-3 py-1 rounded-md";
              badge.style.width = "90%";
              badge.style.color = colors[selectedTokenIndex % colors.length];
              badge.style.backgroundColor = `${
                colors[selectedTokenIndex % colors.length]
              }15`; // Very light background of the same color
              badge.style.border = `1px solid ${
                colors[selectedTokenIndex % colors.length]
              }30`;
              badge.style.opacity = Math.min(
                1,
                Math.max(0.85, value * 2)
              ).toString(); // Increased minimum opacity
              badge.style.fontSize = `${Math.max(14, 18 * scaleFactor)}px`; // Larger font size
              badge.textContent = percentageText;

              // Animate appearance
              badge.style.opacity = "0";
              badge.style.transform = "translateX(-10px)";
              badge.style.transition = "all 0.4s ease";

              percentageElement.innerHTML = "";
              percentageElement.appendChild(badge);

              // Trigger animation
              setTimeout(() => {
                badge.style.opacity = Math.min(
                  1,
                  Math.max(0.85, value * 2)
                ).toString();
                badge.style.transform = "translateX(0)";
              }, 50);
            }
          });
        } else if (tokens.length <= 100) {
          // Only show default connections when we have a reasonable number of tokens
          // to avoid overwhelming the visualization
          // For the no-selection state, limit connections to reduce clutter
          tokens.forEach((_, sourceIdx) => {
            // Only process tokens within the valid matrix range
            tokens.forEach((_, targetIdx) => {
              // Safely get attention value, avoiding out-of-bounds access
              const attentionValue = getSafeAttentionValue(
                sourceIdx,
                targetIdx
              );
              // Adjust threshold based on token count
              const threshold =
                tokens.length <= 10 ? 0.01 : (0.01 * 10) / tokens.length;
              if (attentionValue > threshold) {
                const sourceToken = sourceTokenElements[sourceIdx];
                const targetToken = targetTokenElements[targetIdx];
                const sourcePos = getTokenPosition(sourceToken);
                const targetPos = getTokenPosition(targetToken);

                drawConnection(
                  connectionsGroup,
                  sourcePos.right,
                  sourcePos.centerY,
                  targetPos.left,
                  targetPos.centerY,
                  attentionValue,
                  colors[sourceIdx % colors.length],
                  0.5 // Lower opacity for no-selection state
                );
              }
            });
          });
        }
      }, 50); // Small delay to ensure DOM rendering is complete
    }

    // Add instructions in the content area with improved styling
    if (tokens.length > 0 && selectedTokenIndex === null) {
      const instructionOverlay = document.createElement("div");
      instructionOverlay.className =
        "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none";
      instructionOverlay.innerHTML = `
        <div class="bg-white/90 backdrop-blur-sm p-5 rounded-lg shadow-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-indigo-600"><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>
          <div class="text-lg font-medium text-gray-800 mb-1">Click any source token</div>
          <div class="text-sm text-gray-600">to see its attention connections</div>
        </div>
      `;
      innerContent.appendChild(instructionOverlay);
    }

    // Add token count info when many tokens are present
    if (tokens.length > 10) {
      const tokenCountInfo = document.createElement("div");
      tokenCountInfo.className =
        "absolute top-2 right-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs";
      tokenCountInfo.textContent = `${tokens.length} tokens`;
      contentArea.appendChild(tokenCountInfo);
    }

    // Add event listener for token selection
    const handleTokenSelect = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && "tokenIndex" in customEvent.detail) {
        const onTokenSelect = (idx: number | null) => {
          if (selectedTokenIndex !== idx) {
            const event = new CustomEvent("token-selection-change", {
              detail: { tokenIndex: idx },
            });
            window.dispatchEvent(event);
          }
        };

        onTokenSelect(customEvent.detail.tokenIndex);
      }
    };

    container.addEventListener("token-select", handleTokenSelect);

    // Cleanup
    return () => {
      container.removeEventListener("token-select", handleTokenSelect);
    };
  }, [tokens, head, width, height, selectedTokenIndex, rendered]);

  // Draw connection line between tokens
  function drawConnection(
    layer: d3.Selection<SVGGElement, unknown, null, undefined>,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strength: number,
    color: string,
    opacity: number = 0.8
  ) {
    // Create a straight line path
    const path = layer
      .append("path")
      .attr("d", `M${x1},${y1} L${x2},${y2}`) // Straight line
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 0)
      .attr("stroke-opacity", opacity)
      .attr("marker-end", "url(#arrowhead)");

    // Add arrowhead marker
    if (layer.select("defs").empty()) {
      layer
        .append("defs")
        .append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#64748b");
    }

    // Animate path with more conservative line width
    path
      .transition()
      .duration(600)
      .delay(400)
      // Use a more moderate line width for less visual crowding
      .attr("stroke-width", Math.max(1.2, Math.min(5, strength * 8)));
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center relative"
      style={{ width: `${width}px` }}
    >
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ParallelView;

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { AttentionHead, Token } from '../types';

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
  selectedTokenIndex
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
    Array.from(container.children).forEach(child => {
      if (child !== svgRef.current) {
        container.removeChild(child);
      }
    });

    // Main container dimensions
    const containerWidth = width;
    const containerHeight = height - 50; // Space for bottom text

    // Token and column dimensions - adjusted for better spacing
    const tokenWidth = 160; // Slightly narrower tokens for better spacing
    const percentageColumnWidth = 70; // Wider percentage column for better readability
    const tokenHeight = 36; // Slightly smaller height for better vertical spacing
    const tokenGap = 12; // Increased gap between tokens vertically
    const totalTokenHeight = tokenHeight + tokenGap;
    const betweenColumnGap = 60; // Increased gap between columns for less cramping

    // Total content width
    const totalContentWidth = tokenWidth * 2 + percentageColumnWidth + betweenColumnGap * 2;

    // Calculate left offset to center the entire layout
    const leftOffset = Math.max(0, (containerWidth - totalContentWidth) / 2);

    // Calculate column positions with proper centering
    const sourceColX = leftOffset;
    const targetColX = sourceColX + tokenWidth + betweenColumnGap;
    const percentageColX = targetColX + tokenWidth + betweenColumnGap / 2;

    // Create main layout
    const mainLayout = document.createElement('div');
    mainLayout.className = 'flex flex-col w-full';
    container.appendChild(mainLayout);

    // Create header
    const header = document.createElement('div');
    header.className = 'flex w-full mb-6 px-2'; // Increased bottom margin
    header.style.paddingLeft = `${leftOffset}px`; // Align headers with columns

    const sourceHeader = document.createElement('div');
    sourceHeader.className = 'font-bold text-slate-700 text-lg';
    sourceHeader.style.width = `${tokenWidth}px`;
    sourceHeader.style.textAlign = 'center';
    sourceHeader.textContent = 'Source Tokens';

    const targetHeader = document.createElement('div');
    targetHeader.className = 'font-bold text-slate-700 text-lg';
    targetHeader.style.width = `${tokenWidth}px`;
    targetHeader.style.textAlign = 'center';
    targetHeader.style.marginLeft = `${betweenColumnGap}px`;
    targetHeader.textContent = 'Target Tokens';

    const percentageHeader = document.createElement('div');
    percentageHeader.className = 'font-bold text-slate-700 text-lg';
    percentageHeader.style.width = `${percentageColumnWidth}px`;
    percentageHeader.style.textAlign = 'center';
    percentageHeader.style.marginLeft = `${betweenColumnGap / 2}px`;
    percentageHeader.textContent = 'Attention';

    header.appendChild(sourceHeader);
    header.appendChild(targetHeader);
    header.appendChild(percentageHeader);
    mainLayout.appendChild(header);

    // Create content area with tokens
    const contentArea = document.createElement('div');
    contentArea.className = 'relative w-full';
    contentArea.style.height = `${containerHeight}px`;
    mainLayout.appendChild(contentArea);

    // Position SVG as the background for connections
    svgRef.current.style.position = 'absolute';
    svgRef.current.style.top = '0';
    svgRef.current.style.left = '0';
    svgRef.current.style.width = `${containerWidth}px`;
    svgRef.current.style.height = `${containerHeight}px`;
    contentArea.appendChild(svgRef.current);

    // Set SVG dimensions properly with D3
    svg.attr('width', containerWidth)
      .attr('height', containerHeight);

    // Create token columns
    const sourceColumn = document.createElement('div');
    sourceColumn.className = 'absolute top-0';
    sourceColumn.style.width = `${tokenWidth}px`;
    sourceColumn.style.left = `${sourceColX}px`;

    const targetColumn = document.createElement('div');
    targetColumn.className = 'absolute top-0';
    targetColumn.style.width = `${tokenWidth}px`;
    targetColumn.style.left = `${targetColX}px`;

    const percentageColumn = document.createElement('div');
    percentageColumn.className = 'absolute top-0';
    percentageColumn.style.width = `${percentageColumnWidth}px`;
    percentageColumn.style.left = `${percentageColX}px`;

    contentArea.appendChild(sourceColumn);
    contentArea.appendChild(targetColumn);
    contentArea.appendChild(percentageColumn);

    // Style for improved appearance
    header.style.display = 'flex';
    header.style.width = '100%';

    // Create colors
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#95a5a6', '#8e44ad',
      '#16a085', '#c0392b', '#27ae60', '#f1c40f', '#7f8c8d'
    ];

    // Store token elements for precise positioning
    const sourceTokenElements: HTMLElement[] = [];
    const targetTokenElements: HTMLElement[] = [];
    const percentageElements: Map<string, HTMLElement> = new Map(); // Store percentage elements for each connection

    // Create tokens with exact positioning
    tokens.forEach((token, i) => {
      const color = colors[i % colors.length];
      const topPosition = i * totalTokenHeight;

      // Source token
      const sourceTokenWrap = document.createElement('div');
      sourceTokenWrap.className = 'absolute w-full';
      sourceTokenWrap.style.top = `${topPosition}px`;
      sourceColumn.appendChild(sourceTokenWrap);

      const sourceToken = document.createElement('div');
      sourceToken.className = 'rounded-md flex items-center justify-center font-medium text-white cursor-pointer transition-all';
      sourceToken.style.height = `${tokenHeight}px`;
      sourceToken.style.backgroundColor = color;
      sourceToken.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      sourceToken.textContent = token.text;
      sourceToken.dataset.index = i.toString();
      sourceTokenWrap.appendChild(sourceToken);
      sourceTokenElements.push(sourceToken);

      // Add enhanced selection effect
      if (selectedTokenIndex === i) {
        sourceToken.style.boxShadow = '0 0 0 3px #3b82f6, 0 2px 4px rgba(0,0,0,0.1)';
        sourceToken.style.transform = 'scale(1.05)';
        sourceToken.style.position = 'relative';
        sourceToken.style.zIndex = '10';

        // Add indicator icon for the selected token
        const indicator = document.createElement('div');
        indicator.className = 'absolute -right-2 -top-2 bg-indigo-600 rounded-full w-6 h-6 flex items-center justify-center';
        indicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        sourceToken.appendChild(indicator);
      }

      // Add hover effect to all source tokens
      sourceToken.onmouseover = () => {
        if (selectedTokenIndex !== i) {
          sourceToken.style.transform = 'scale(1.03)';
          sourceToken.style.boxShadow = '0 0 0 1px #e2e8f0, 0 4px 6px rgba(0,0,0,0.1)';
        }
      };

      sourceToken.onmouseout = () => {
        if (selectedTokenIndex !== i) {
          sourceToken.style.transform = 'scale(1)';
          sourceToken.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
      };

      // Target token with the same position
      const targetTokenWrap = document.createElement('div');
      targetTokenWrap.className = 'absolute w-full';
      targetTokenWrap.style.top = `${topPosition}px`;
      targetColumn.appendChild(targetTokenWrap);

      const targetToken = document.createElement('div');
      targetToken.className = 'rounded-md flex items-center justify-center font-medium text-white';
      targetToken.style.height = `${tokenHeight}px`;
      targetToken.style.backgroundColor = color;
      targetToken.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      targetToken.textContent = token.text;
      targetTokenWrap.appendChild(targetToken);
      targetTokenElements.push(targetToken);

      // Percentage placeholder for each target token row
      const percentageWrap = document.createElement('div');
      percentageWrap.className = 'absolute w-full';
      percentageWrap.style.top = `${topPosition}px`;
      percentageColumn.appendChild(percentageWrap);

      // Create a div to hold percentage values
      const percentageDiv = document.createElement('div');
      percentageDiv.className = 'flex items-center justify-start h-full';
      percentageDiv.style.height = `${tokenHeight}px`;
      percentageWrap.appendChild(percentageDiv);

      // Store the reference to this div for later use
      percentageElements.set(`target-${i}`, percentageDiv);

      // Click handler for source tokens
      sourceToken.addEventListener('click', () => {
        const tokenIndex = parseInt(sourceToken.dataset.index || '0');
        const event = new CustomEvent('token-select', {
          detail: { tokenIndex: tokenIndex === selectedTokenIndex ? null : tokenIndex }
        });
        container.dispatchEvent(event);
      });
    });

    // Draw connections layer
    const connectionsGroup = svg.append('g')
      .attr('class', 'connections');

    // Helper function to get token position
    const getTokenPosition = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const containerRect = contentArea.getBoundingClientRect();
      return {
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        top: rect.top - containerRect.top,
        bottom: rect.bottom - containerRect.top,
        centerY: rect.top + rect.height / 2 - containerRect.top
      };
    };

    // Draw attention connections with exact alignment
    if (tokens.length > 0) {
      setTimeout(() => {
        // Clear any existing percentage values
        percentageElements.forEach(element => {
          element.innerHTML = '';
        });

        if (selectedTokenIndex !== null) {
          // Selected token to all targets
          const sourceToken = sourceTokenElements[selectedTokenIndex];
          const sourcePos = getTokenPosition(sourceToken);

          // Sort attention values to display in descending order
          const attentionValues = tokens.map((_, targetIdx) => ({
            targetIdx,
            value: head.attention[selectedTokenIndex][targetIdx]
          })).filter(item => item.value > 0.00001);

          // Sort by value in descending order
          attentionValues.sort((a, b) => b.value - a.value);

          // Draw connections for sorted values
          attentionValues.forEach(({ targetIdx, value }) => {
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
            const percentageElement = percentageElements.get(`target-${targetIdx}`);
            if (percentageElement) {
              // Format percentage based on value
              const percentageText = value >= 0.01
                ? Math.round(value * 100) + '%'  // ≥ 1%: no decimal
                : value >= 0.001
                  ? (value * 100).toFixed(1) + '%' // 0.1% to 0.9%: 1 decimal
                  : value >= 0.0001
                    ? (value * 100).toFixed(2) + '%' // 0.01% to 0.09%: 2 decimals
                    : (value * 100).toFixed(3) + '%'; // < 0.01%: 3 decimals

              // Create percentage badge with improved styling
              const badge = document.createElement('div');
              badge.className = 'font-medium text-center transition-all px-2';
              badge.style.width = '100%';
              badge.style.color = colors[selectedTokenIndex % colors.length];
              badge.style.opacity = Math.min(1, Math.max(0.75, value * 2)).toString(); // Slightly increased minimum opacity
              badge.style.fontWeight = 'bold';
              badge.style.fontSize = '14px'; // Consistent font size
              badge.textContent = percentageText;

              // Animate appearance
              badge.style.opacity = '0';
              badge.style.transform = 'translateX(-10px)';
              badge.style.transition = 'all 0.4s ease';

              percentageElement.innerHTML = '';
              percentageElement.appendChild(badge);

              // Trigger animation
              setTimeout(() => {
                badge.style.opacity = Math.min(1, Math.max(0.75, value * 2)).toString();
                badge.style.transform = 'translateX(0)';
              }, 50);
            }
          });
        } else {
          // Show all significant connections with wider spacing
          // For the no-selection state, limit connections to reduce clutter
          tokens.forEach((_, sourceIdx) => {
            tokens.forEach((_, targetIdx) => {
              const attentionValue = head.attention[sourceIdx][targetIdx];
              // Lower threshold when no token is selected (1% instead of 5%)
              if (attentionValue > 0.01) {
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
      const instructionOverlay = document.createElement('div');
      instructionOverlay.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none';
      instructionOverlay.innerHTML = `
        <div class="bg-white/90 backdrop-blur-sm p-5 rounded-lg shadow-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-indigo-600"><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>
          <div class="text-lg font-medium text-gray-800 mb-1">Click any source token</div>
          <div class="text-sm text-gray-600">to see its attention connections</div>
        </div>
      `;
      contentArea.appendChild(instructionOverlay);
    }

    // Add event listener for token selection
    const handleTokenSelect = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && 'tokenIndex' in customEvent.detail) {
        const onTokenSelect = (idx: number | null) => {
          if (selectedTokenIndex !== idx) {
            const event = new CustomEvent('token-selection-change', {
              detail: { tokenIndex: idx }
            });
            window.dispatchEvent(event);
          }
        };

        onTokenSelect(customEvent.detail.tokenIndex);
      }
    };

    container.addEventListener('token-select', handleTokenSelect);

    // Cleanup
    return () => {
      container.removeEventListener('token-select', handleTokenSelect);
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
    const path = layer.append('path')
      .attr('d', `M${x1},${y1} L${x2},${y2}`) // Straight line
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 0)
      .attr('stroke-opacity', opacity)
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrowhead marker
    if (layer.select('defs').empty()) {
      layer.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#64748b');
    }

    // Animate path with more conservative line width
    path.transition()
      .duration(600)
      .delay(400)
      // Use a more moderate line width for less visual crowding
      .attr('stroke-width', Math.max(1.2, Math.min(5, strength * 8)));
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center relative"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ParallelView;
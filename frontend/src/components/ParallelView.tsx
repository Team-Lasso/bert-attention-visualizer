import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { AttentionHead, Token } from '../types';

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

    // Token dimensions
    const tokenWidth = 180;
    const tokenHeight = 40;
    const tokenGap = 8;
    const totalTokenHeight = tokenHeight + tokenGap;

    // Calculate layout
    const middleGap = containerWidth - (tokenWidth * 2);
    const leftColX = 0;
    const rightColX = leftColX + tokenWidth + middleGap;

    // Create main layout
    const mainLayout = document.createElement('div');
    mainLayout.className = 'flex flex-col w-full';
    container.appendChild(mainLayout);

    // Create header
    const header = document.createElement('div');
    header.className = 'flex justify-between w-full mb-4';

    const sourceHeader = document.createElement('div');
    sourceHeader.className = 'font-bold text-slate-700 text-lg';
    sourceHeader.style.width = `${tokenWidth}px`;
    sourceHeader.style.textAlign = 'center';
    sourceHeader.textContent = 'Source Tokens';

    const targetHeader = document.createElement('div');
    targetHeader.className = 'font-bold text-slate-700 text-lg';
    targetHeader.style.width = `${tokenWidth}px`;
    targetHeader.style.textAlign = 'center';
    targetHeader.textContent = 'Target Tokens';

    header.appendChild(sourceHeader);
    header.appendChild(targetHeader);
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
    sourceColumn.className = 'absolute top-0 left-0';
    sourceColumn.style.width = `${tokenWidth}px`;

    const targetColumn = document.createElement('div');
    targetColumn.className = 'absolute top-0';
    targetColumn.style.width = `${tokenWidth}px`;
    targetColumn.style.left = `${rightColX}px`;

    contentArea.appendChild(sourceColumn);
    contentArea.appendChild(targetColumn);

    // Style for improved appearance
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.width = '100%';
    targetHeader.style.marginLeft = 'auto';

    // Custom positioning to ensure proper alignment
    const columnSpacing = containerWidth - tokenWidth * 2;
    if (columnSpacing > 0) {
      sourceHeader.style.marginRight = '0';
      targetHeader.style.marginLeft = '0';

      // Position columns exactly
      sourceColumn.style.left = '0';
      targetColumn.style.left = `${tokenWidth + columnSpacing}px`;
    }

    // Create colors
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#95a5a6', '#8e44ad',
      '#16a085', '#c0392b', '#27ae60', '#f1c40f', '#7f8c8d'
    ];

    // Store token elements for precise positioning
    const sourceTokenElements: HTMLElement[] = [];
    const targetTokenElements: HTMLElement[] = [];

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
        if (selectedTokenIndex !== null) {
          // Selected token to all targets
          const sourceToken = sourceTokenElements[selectedTokenIndex];
          const sourcePos = getTokenPosition(sourceToken);

          tokens.forEach((_, targetIdx) => {
            const attentionValue = head.attention[selectedTokenIndex][targetIdx];
            if (attentionValue > 0.01) {
              const targetToken = targetTokenElements[targetIdx];
              const targetPos = getTokenPosition(targetToken);

              drawConnection(
                connectionsGroup,
                sourcePos.right, // Start at right edge of source
                sourcePos.centerY,
                targetPos.left, // End at left edge of target
                targetPos.centerY,
                attentionValue,
                colors[selectedTokenIndex % colors.length]
              );
            }
          });
        } else {
          // Show all significant connections
          tokens.forEach((_, sourceIdx) => {
            tokens.forEach((_, targetIdx) => {
              const attentionValue = head.attention[sourceIdx][targetIdx];
              if (attentionValue > 0.1) {
                const sourceToken = sourceTokenElements[sourceIdx];
                const targetToken = targetTokenElements[targetIdx];
                const sourcePos = getTokenPosition(sourceToken);
                const targetPos = getTokenPosition(targetToken);

                drawConnection(
                  connectionsGroup,
                  sourcePos.right, // Start at right edge of source
                  sourcePos.centerY,
                  targetPos.left, // End at left edge of target
                  targetPos.centerY,
                  attentionValue,
                  colors[sourceIdx % colors.length],
                  0.6
                );
              }
            });
          });
        }
      }, 50); // Small delay to ensure DOM rendering is complete
    }

    // Add instructions in the content area
    if (tokens.length > 0 && selectedTokenIndex === null) {
      const instructionOverlay = document.createElement('div');
      instructionOverlay.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none';
      instructionOverlay.innerHTML = `
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-indigo-600"><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>
          <div class="text-md font-medium text-gray-800">Click any source token</div>
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
    // Calculate the midpoint and offsets
    const midX = (x1 + x2) / 2;
    const dx = x2 - x1;

    // Use a consistent relative curve
    const curveOffset = Math.min(dx * 0.3, 80);

    // Use a consistent connection path
    const path = layer.append('path')
      .attr('d', `M${x1},${y1} C${x1 + curveOffset},${y1} ${x2 - curveOffset},${y2} ${x2},${y2}`)
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

    // Animate path
    path.transition()
      .duration(600)
      .delay(400)
      .attr('stroke-width', Math.max(1, strength * 10));

    // Add percentage label
    if (strength > 0.05) {
      const percentage = (strength * 100).toFixed(1);

      // Calculate vertical offset based on distance
      const yDiff = Math.abs(y2 - y1);
      const vertOffset = yDiff > 40 ? 16 : 12;

      // Add background for label
      const labelBg = layer.append('rect')
        .attr('x', midX - 20)
        .attr('y', (y1 + y2) / 2 - vertOffset - 8)
        .attr('width', 40)
        .attr('height', 16)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', 'white')
        .attr('opacity', 0)
        .attr('stroke', 'none');

      // Add percentage text
      const label = layer.append('text')
        .attr('x', midX)
        .attr('y', (y1 + y2) / 2 - vertOffset + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', color)
        .attr('opacity', 0)
        .text(`${percentage}%`);

      // Animate label
      label.transition()
        .duration(300)
        .delay(800)
        .attr('opacity', 1);

      // Animate background
      labelBg.transition()
        .duration(300)
        .delay(800)
        .attr('opacity', 0.7);
    }
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
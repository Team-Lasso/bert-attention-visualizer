import React, { useEffect, useRef } from 'react';
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
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate token spacing
    const tokenSpacing = innerHeight / (tokens.length + 1);
    
    // Draw left column tokens
    const leftTokens = g.append("g").attr("class", "left-tokens");
    const rightTokens = g.append("g").attr("class", "right-tokens");
    
    // Color scale for tokens - using a more vibrant palette
    const tokenColorScale = d3.scaleOrdinal()
      .domain(tokens.map((_, i) => i.toString()))
      .range(d3.schemeSet2);
    
    // Add background for better visibility
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#f8fafc")
      .attr("rx", 8)
      .attr("ry", 8);
    
    // Draw tokens on both sides with animation
    tokens.forEach((token, i) => {
      // Left side tokens
      const leftRect = leftTokens.append("rect")
        .attr("x", 0)
        .attr("y", i * tokenSpacing)
        .attr("width", 0) // Start with zero width
        .attr("height", tokenSpacing * 0.8)
        .attr("fill", tokenColorScale(i.toString()))
        .attr("opacity", 0.9)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
      
      // Animate width
      leftRect.transition()
        .duration(500)
        .attr("width", 50);
      
      leftTokens.append("text")
        .attr("x", 25)
        .attr("y", i * tokenSpacing + tokenSpacing * 0.4)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("opacity", 0) // Start invisible
        .text(token.text)
        .transition()
        .delay(300)
        .duration(300)
        .attr("opacity", 1);
      
      // Right side tokens
      const rightRect = rightTokens.append("rect")
        .attr("x", innerWidth)
        .attr("y", i * tokenSpacing)
        .attr("width", 0) // Start with zero width
        .attr("height", tokenSpacing * 0.8)
        .attr("fill", tokenColorScale(i.toString()))
        .attr("opacity", 0.9)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
      
      // Animate width and position
      rightRect.transition()
        .duration(500)
        .attr("x", innerWidth - 50)
        .attr("width", 50);
      
      rightTokens.append("text")
        .attr("x", innerWidth - 25)
        .attr("y", i * tokenSpacing + tokenSpacing * 0.4)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("opacity", 0) // Start invisible
        .text(token.text)
        .transition()
        .delay(300)
        .duration(300)
        .attr("opacity", 1);
    });
    
    // Draw attention connections
    const connections = g.append("g").attr("class", "connections");
    
    // If a token is selected, only show its connections
    if (selectedTokenIndex !== null) {
      tokens.forEach((_, targetIdx) => {
        const sourceX = 50;
        const sourceY = selectedTokenIndex * tokenSpacing + tokenSpacing * 0.4;
        const targetX = innerWidth - 50;
        const targetY = targetIdx * tokenSpacing + tokenSpacing * 0.4;
        
        const attentionValue = head.attention[selectedTokenIndex][targetIdx];
        const percentage = (attentionValue * 100).toFixed(1);
        
        // Only draw connections with significant attention
        if (attentionValue > 0.01) {
          const path = connections.append("path")
            .attr("d", `M${sourceX},${sourceY} C${innerWidth/2},${sourceY} ${innerWidth/2},${targetY} ${targetX},${targetY}`)
            .attr("fill", "none")
            .attr("stroke", tokenColorScale(selectedTokenIndex.toString()))
            .attr("stroke-width", 0) // Start with zero width
            .attr("stroke-opacity", 0.8)
            .attr("marker-end", "url(#arrowhead)");
          
          // Animate stroke width
          path.transition()
            .duration(600)
            .delay(500)
            .attr("stroke-width", Math.max(1, attentionValue * 12));
            
          path.append("title")
            .text(`${tokens[selectedTokenIndex].text} → ${tokens[targetIdx].text}: ${percentage}%`);
          
          // Add percentage labels for significant connections
          if (attentionValue > 0.1) {
            connections.append("text")
              .attr("x", innerWidth / 2)
              .attr("y", (sourceY + targetY) / 2 - 5)
              .attr("text-anchor", "middle")
              .attr("font-size", "11px")
              .attr("fill", tokenColorScale(selectedTokenIndex.toString()))
              .attr("stroke", "white")
              .attr("stroke-width", 0.5)
              .attr("paint-order", "stroke")
              .attr("opacity", 0) // Start invisible
              .text(`${percentage}%`)
              .transition()
              .duration(300)
              .delay(800)
              .attr("opacity", 1);
          }
        }
      });
      
      // Add focus indicator
      g.append("rect")
        .attr("x", -5)
        .attr("y", selectedTokenIndex * tokenSpacing - 5)
        .attr("width", 60)
        .attr("height", tokenSpacing * 0.8 + 10)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("stroke-dasharray", "5,3")
        .attr("opacity", 0)
        .transition()
        .duration(300)
        .attr("opacity", 1);
    } else {
      // Show all connections with significant attention
      tokens.forEach((_, sourceIdx) => {
        tokens.forEach((_, targetIdx) => {
          const attentionValue = head.attention[sourceIdx][targetIdx];
          
          // Only draw connections with significant attention
          if (attentionValue > 0.1) {
            const sourceX = 50;
            const sourceY = sourceIdx * tokenSpacing + tokenSpacing * 0.4;
            const targetX = innerWidth - 50;
            const targetY = targetIdx * tokenSpacing + tokenSpacing * 0.4;
            const percentage = (attentionValue * 100).toFixed(1);
            
            const path = connections.append("path")
              .attr("d", `M${sourceX},${sourceY} C${innerWidth/2},${sourceY} ${innerWidth/2},${targetY} ${targetX},${targetY}`)
              .attr("fill", "none")
              .attr("stroke", tokenColorScale(sourceIdx.toString()))
              .attr("stroke-width", 0) // Start with zero width
              .attr("stroke-opacity", 0.6);
              
            // Animate stroke width
            path.transition()
              .duration(600)
              .delay(500 + (sourceIdx + targetIdx) * 20) // Stagger the animations
              .attr("stroke-width", Math.max(1, attentionValue * 6));
              
            path.append("title")
              .text(`${tokens[sourceIdx].text} → ${tokens[targetIdx].text}: ${percentage}%`);
          }
        });
      });
    }
    
    // Add arrowhead marker definition
    svg.append("defs").append("marker")
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
    
    // Add title with better styling
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text(`Head ${head.headIndex + 1} Attention Flow`);
    
    // Add instructions
    if (selectedTokenIndex === null) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#64748b")
        .text("Click on a token above to focus on its attention connections");
    } else {
      // Add focused token indicator
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#3b82f6")
        .attr("font-weight", "medium")
        .text(`Focused on: "${tokens[selectedTokenIndex].text}"`);
    }

    // Add side labels
    svg.append("text")
      .attr("x", margin.left + 25)
      .attr("y", margin.top - 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text("Source");

    svg.append("text")
      .attr("x", width - margin.right - 25)
      .attr("y", margin.top - 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text("Target");

  }, [tokens, head, width, height, selectedTokenIndex]);

  return <svg ref={svgRef} width={width} height={height} className="mx-auto" />;
};

export default ParallelView;
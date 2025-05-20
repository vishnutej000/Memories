import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface EmojiData {
  emoji: string;
  count: number;
}

interface EmojiCloudProps {
  data: EmojiData[];
  size?: 'small' | 'medium' | 'large';
}

const EmojiCloud: React.FC<EmojiCloudProps> = ({ data, size = 'medium' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Determine height based on size prop
  const getHeight = () => {
    switch (size) {
      case 'small': return 150;
      case 'medium': return 300;
      case 'large': return 500;
      default: return 300;
    }
  };
  
  // Draw emoji cloud
  useEffect(() => {
    if (!svgRef.current || !data.length) return;
    
    // Clear SVG
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set dimensions
    const width = svgRef.current.clientWidth;
    const height = getHeight();
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Prepare data for cloud layout
    const maxCount = d3.max(data, d => d.count) || 1;
    const minCount = d3.min(data, d => d.count) || 1;
    
    // Create font size scale
    const fontSizeScale = d3.scaleLinear()
      .domain([minCount, maxCount])
      .range([14, 60]);
    
    // Create opacity scale
    const opacityScale = d3.scaleLinear()
      .domain([minCount, maxCount])
      .range([0.7, 1]);
    
    // Prepare cloud data
    const cloudData = data.map(d => ({
      text: d.emoji,
      size: fontSizeScale(d.count),
      opacity: opacityScale(d.count),
      count: d.count
    }));
    
    // Create cloud layout
    const layout = cloud()
      .size([width, height])
      .words(cloudData)
      .padding(5)
      .rotate(() => 0) // No rotation for emojis
      .fontSize(d => (d as any).size)
      .on('end', draw);
    
    // Start layout
    layout.start();
    
    // Draw function
    function draw(words: any[]) {
      svg.selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('fill', 'currentColor')
        .style('opacity', d => d.opacity)
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .text(d => d.text)
        .append('title')
        .text(d => `${d.text}: ${d.count} times`);
    }
  }, [data, size]);
  
  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
          No emoji data available
        </div>
      ) : (
        <svg 
          ref={svgRef} 
          className="w-full"
          height={getHeight()}
        ></svg>
      )}
    </div>
  );
};

export default EmojiCloud;
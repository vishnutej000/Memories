import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface HeatmapData {
  date: string;
  messageCount: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  height?: number;
  colorRange?: [string, string];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  height = 180,
  colorRange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const { darkMode } = useTheme();
  
  // Generate colors based on theme
  const defaultColorRange = darkMode
    ? ['#1e3a2c', '#25D366'] // Dark theme: dark green to bright green
    : ['#dcf8e0', '#075E54']; // Light theme: light green to dark green
  
  const colors = colorRange || defaultColorRange;
  
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;
    
    const svg = svgRef.current;
    const svgWidth = svg.clientWidth;
    const svgHeight = height;
    
    // Clear existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
    // Prepare data
    const dateMap = new Map<string, number>();
    data.forEach(d => dateMap.set(d.date, d.messageCount));
    
    // Find date range
    const minDate = new Date(data[0].date);
    const maxDate = new Date(data[data.length - 1].date);
    
    // Compute maximum message count
    const maxCount = Math.max(...data.map(d => d.messageCount));
    
    // Generate array of all dates in range
    const allDates: Date[] = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      allDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group dates by month
    const monthlyGroups: { month: Date; dates: Date[] }[] = [];
    let currentMonth: Date | null = null;
    let currentMonthDates: Date[] = [];
    
    allDates.forEach(date => {
      const month = new Date(date.getFullYear(), date.getMonth(), 1);
      if (!currentMonth || month.getTime() !== currentMonth.getTime()) {
        if (currentMonth) {
          monthlyGroups.push({ month: currentMonth, dates: currentMonthDates });
        }
        currentMonth = month;
        currentMonthDates = [date];
      } else {
        currentMonthDates.push(date);
      }
    });
    
    if (currentMonth && currentMonthDates.length > 0) {
      monthlyGroups.push({ month: currentMonth, dates: currentMonthDates });
    }
    
    // Calculate cell size and spacing
    const cellSize = Math.min(14, Math.max(8, svgWidth / allDates.length / 1.2));
    const cellPadding = Math.max(2, cellSize / 7);
    
    // Draw month labels and day cells
    let xOffset = 40; // Initial offset for labels
    
    // Grid for 7 days of the week
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Add day labels on the left
    dayLabels.forEach((label, index) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '10');
      text.setAttribute('y', (index * (cellSize + cellPadding) + cellSize / 2 + 30).toString());
      text.setAttribute('font-size', '10px');
      text.setAttribute('text-anchor', 'start');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', darkMode ? '#aaa' : '#666');
      text.textContent = label;
      svg.appendChild(text);
    });
    
    // Month labels and cells
    monthlyGroups.forEach(({ month, dates }) => {
      // Month label
      const monthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const monthName = month.toLocaleString('default', { month: 'short' });
      monthLabel.setAttribute('x', xOffset.toString());
      monthLabel.setAttribute('y', '14');
      monthLabel.setAttribute('font-size', '10px');
      monthLabel.setAttribute('text-anchor', 'start');
      monthLabel.setAttribute('fill', darkMode ? '#aaa' : '#666');
      monthLabel.textContent = monthName;
      svg.appendChild(monthLabel);
      
      // Draw cells for each date
      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const count = dateMap.get(dateStr) || 0;
        
        // Calculate color based on count
        const intensity = maxCount > 0 ? count / maxCount : 0;
        const cellColor = interpolateColor(colors[0], colors[1], intensity);
        
        // Calculate position
        const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
        const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
        
        const x = xOffset + weekOfMonth * (cellSize + cellPadding);
        const y = 30 + dayOfWeek * (cellSize + cellPadding);
        
        // Create rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', y.toString());
        rect.setAttribute('width', cellSize.toString());
        rect.setAttribute('height', cellSize.toString());
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', cellColor);
        rect.setAttribute('stroke', darkMode ? '#222' : '#fff');
        rect.setAttribute('stroke-width', '0.5');
        
        // Add tooltip on hover
        rect.addEventListener('mouseover', (e) => {
          setTooltipData({
            date: date.toLocaleDateString(),
            count,
            x: e.clientX,
            y: e.clientY
          });
        });
        
        rect.addEventListener('mousemove', (e) => {
          if (tooltipData) {
            setTooltipData({
              ...tooltipData,
              x: e.clientX,
              y: e.clientY
            });
          }
        });
        
        rect.addEventListener('mouseout', () => {
          setTooltipData(null);
        });
        
        svg.appendChild(rect);
      });
      
      // Update x offset for next month
      xOffset += Math.ceil(dates.length / 7) * (cellSize + cellPadding);
    });
    
  }, [data, darkMode, height, colors]);
  
  // Position tooltip
  useEffect(() => {
    if (tooltipRef.current && tooltipData) {
      const tooltip = tooltipRef.current;
      tooltip.style.left = `${tooltipData.x + 10}px`;
      tooltip.style.top = `${tooltipData.y + 10}px`;
    }
  }, [tooltipData]);
  
  // Helper function to interpolate between two colors
  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    if (factor <= 0) return color1;
    if (factor >= 1) return color2;
    
    // Parse colors
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    
    // Interpolate
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  return (
    <div className="relative">
      <svg 
        ref={svgRef} 
        width="100%" 
        height={height} 
        className="overflow-visible"
      ></svg>
      
      {tooltipData && (
        <div
          ref={tooltipRef}
          className="absolute z-10 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded shadow-lg text-xs"
          style={{
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-medium">{tooltipData.date}</div>
          <div>{tooltipData.count} messages</div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
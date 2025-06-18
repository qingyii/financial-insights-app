import React, { useEffect, useRef, memo } from 'react';
import { Box, Card, Heading, Text } from '@radix-ui/themes';
import * as d3 from 'd3';

interface DataFlowDiagramProps {
  currentStep: number;
}

const DataFlowDiagram: React.FC<DataFlowDiagramProps> = memo(({ currentStep }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Define system nodes and their connections
  const systems = [
    { id: 'client', name: 'Client System', x: 100, y: 100, type: 'source' },
    { id: 'oms', name: 'Order Management', x: 300, y: 100, type: 'processing' },
    { id: 'market', name: 'Market Gateway', x: 500, y: 100, type: 'external' },
    { id: 'risk', name: 'Risk Engine', x: 300, y: 250, type: 'processing' },
    { id: 'portfolio', name: 'Portfolio System', x: 100, y: 250, type: 'processing' },
    { id: 'settlement', name: 'Settlement', x: 500, y: 250, type: 'processing' },
    { id: 'warehouse', name: 'Data Warehouse', x: 300, y: 400, type: 'storage' }
  ];

  const connections = [
    { source: 'client', target: 'oms', steps: [1, 2, 3] },
    { source: 'oms', target: 'market', steps: [2, 3] },
    { source: 'market', target: 'oms', steps: [3] },
    { source: 'oms', target: 'portfolio', steps: [4] },
    { source: 'portfolio', target: 'risk', steps: [5] },
    { source: 'oms', target: 'settlement', steps: [6, 7] },
    { source: 'oms', target: 'warehouse', steps: [1, 2, 3, 4, 5, 6, 7] },
    { source: 'portfolio', target: 'warehouse', steps: [4, 5] },
    { source: 'risk', target: 'warehouse', steps: [5] },
    { source: 'settlement', target: 'warehouse', steps: [6, 7] }
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    // Clear existing content
    svg.selectAll('*').remove();

    // Create arrow marker
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 7)
      .attr('refX', 9)
      .attr('refY', 3.5)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3.5, 0 7')
      .attr('fill', 'var(--ruby-9)');

    // Draw connections
    svg.selectAll('.link')
      .data(connections)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', d => systems.find(s => s.id === d.source)!.x + 50)
      .attr('y1', d => systems.find(s => s.id === d.source)!.y + 25)
      .attr('x2', d => systems.find(s => s.id === d.target)!.x + 50)
      .attr('y2', d => systems.find(s => s.id === d.target)!.y + 25)
      .attr('stroke', d => d.steps.includes(currentStep + 1) ? 'var(--ruby-9)' : 'var(--gray-6)')
      .attr('stroke-width', d => d.steps.includes(currentStep + 1) ? 3 : 1)
      .attr('stroke-dasharray', d => d.steps.includes(currentStep + 1) ? '5,5' : 'none')
      .attr('marker-end', d => d.steps.includes(currentStep + 1) ? 'url(#arrowhead)' : 'none')
      .style('opacity', d => d.steps.includes(currentStep + 1) ? 1 : 0.3);

    // Animate active connections
    svg.selectAll('.link')
      .filter((d: any) => d.steps.includes(currentStep + 1))
      .each(function() {
        const link = d3.select(this);
        const length = (this as SVGLineElement).getTotalLength();
        
        link
          .attr('stroke-dasharray', length + ' ' + length)
          .attr('stroke-dashoffset', length)
          .transition()
          .duration(1000)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
          .on('end', function() {
            link.attr('stroke-dasharray', '5,5');
          });
      });

    // Draw system nodes
    const nodes = svg.selectAll('.node')
      .data(systems)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Node rectangles
    nodes.append('rect')
      .attr('width', 100)
      .attr('height', 50)
      .attr('rx', 8)
      .attr('fill', d => {
        if (d.type === 'source') return 'var(--blue-3)';
        if (d.type === 'external') return 'var(--green-3)';
        if (d.type === 'storage') return 'var(--amber-3)';
        return 'var(--gray-3)';
      })
      .attr('stroke', d => {
        // Highlight active systems based on current step
        const activeInStep = connections.some(c => 
          (c.source === d.id || c.target === d.id) && c.steps.includes(currentStep + 1)
        );
        return activeInStep ? 'var(--ruby-9)' : 'var(--gray-6)';
      })
      .attr('stroke-width', d => {
        const activeInStep = connections.some(c => 
          (c.source === d.id || c.target === d.id) && c.steps.includes(currentStep + 1)
        );
        return activeInStep ? 3 : 1;
      });

    // Node labels
    nodes.append('text')
      .attr('x', 50)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--gray-12)')
      .attr('font-size', '12px')
      .attr('font-weight', d => {
        const activeInStep = connections.some(c => 
          (c.source === d.id || c.target === d.id) && c.steps.includes(currentStep + 1)
        );
        return activeInStep ? 'bold' : 'normal';
      })
      .text(d => d.name);

    // Add data flow particles for active connections
    svg.selectAll('.particle')
      .data(connections.filter(c => c.steps.includes(currentStep + 1)))
      .enter()
      .append('circle')
      .attr('class', 'particle')
      .attr('r', 4)
      .attr('fill', 'var(--ruby-9)')
      .attr('cx', d => systems.find(s => s.id === d.source)!.x + 50)
      .attr('cy', d => systems.find(s => s.id === d.source)!.y + 25)
      .transition()
      .duration(1000)
      .attr('cx', d => systems.find(s => s.id === d.target)!.x + 50)
      .attr('cy', d => systems.find(s => s.id === d.target)!.y + 25)
      .transition()
      .duration(0)
      .remove();

  }, [currentStep]);

  return (
    <Card style={{ backgroundColor: 'var(--gray-2)' }}>
      <Box p="4">
        <Heading size="4" mb="3">System Data Flow</Heading>
        <Text size="2" color="gray" mb="3">
          Real-time visualization of data flow between systems
        </Text>
        <Box style={{ 
          backgroundColor: 'var(--gray-1)', 
          borderRadius: 'var(--radius-3)',
          border: '1px solid var(--gray-4)'
        }}>
          <svg
            ref={svgRef}
            width="100%"
            height={500}
            viewBox="0 0 600 500"
            style={{ display: 'block' }}
          />
        </Box>
      </Box>
    </Card>
  );
});

DataFlowDiagram.displayName = 'DataFlowDiagram';

export default DataFlowDiagram;
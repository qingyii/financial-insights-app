import React, { useEffect, useState } from 'react';
import { Box, Card, Heading, Text, Badge, Flex } from '@radix-ui/themes';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface TableConnection {
  source: string;
  target: string;
  strength: number;
  keywords: string[];
}

interface TableNode {
  id: string;
  label: string;
  type: 'fact' | 'dimension';
  relevance: number;
  keywords: string[];
  x?: number;
  y?: number;
}

interface TableRelevanceHeatmapProps {
  query: string;
  relevanceData: Array<{
    table: string;
    relevanceScore: number;
    reasons: string[];
  }>;
}

export const TableRelevanceHeatmap: React.FC<TableRelevanceHeatmapProps> = ({ relevanceData }) => {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  useEffect(() => {
    if (!relevanceData || relevanceData.length === 0) return;

    // Clear previous visualization
    d3.select('#relevance-heatmap').selectAll('*').remove();

    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create SVG
    const svg = d3.select('#relevance-heatmap')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Define gradient for relevance
    const defs = svg.append('defs');
    
    const gradient = defs.append('radialGradient')
      .attr('id', 'relevance-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff6b6b')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4ecdc4')
      .attr('stop-opacity', 0.2);

    // Prepare nodes data
    const nodes: TableNode[] = [
      { id: 'fact_trading_orders', label: 'Trading Orders', type: 'fact', relevance: 0, keywords: [] },
      { id: 'dim_security', label: 'Securities', type: 'dimension', relevance: 0, keywords: [] },
      { id: 'dim_trader', label: 'Traders', type: 'dimension', relevance: 0, keywords: [] },
      { id: 'dim_time', label: 'Time', type: 'dimension', relevance: 0, keywords: [] },
      { id: 'dim_counterparty', label: 'Counterparties', type: 'dimension', relevance: 0, keywords: [] },
      { id: 'dim_order_type', label: 'Order Types', type: 'dimension', relevance: 0, keywords: [] }
    ];

    // Update relevance scores
    relevanceData.forEach(data => {
      const node = nodes.find(n => n.id === data.table);
      if (node) {
        node.relevance = data.relevanceScore;
        // Extract keywords from reasons
        node.keywords = data.reasons
          .filter(r => r.includes('Keyword'))
          .map(r => r.match(/"([^"]+)"/)?.[1] || '')
          .filter(k => k);
      }
    });

    // Position nodes in a circle around the center
    const radius = 200;
    nodes.forEach((node, i) => {
      if (node.type === 'fact') {
        node.x = centerX;
        node.y = centerY;
      } else {
        const angle = (i - 1) * (2 * Math.PI / (nodes.length - 1));
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      }
    });

    // Create force simulation
    const simulation = d3.forceSimulation<TableNode>(nodes)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collision', d3.forceCollide().radius(80));

    // Create connections
    const connections: TableConnection[] = [];
    const factTable = nodes.find(n => n.type === 'fact');
    if (factTable) {
      nodes.filter(n => n.type === 'dimension' && n.relevance > 0).forEach(dimTable => {
        connections.push({
          source: factTable.id,
          target: dimTable.id,
          strength: dimTable.relevance,
          keywords: dimTable.keywords
        });
      });
    }

    // Draw connections
    const links = svg.append('g')
      .selectAll('line')
      .data(connections)
      .enter()
      .append('line')
      .attr('stroke', d => `rgba(229, 64, 123, ${d.strength})`)
      .attr('stroke-width', d => Math.max(1, d.strength * 5))
      .attr('x1', d => nodes.find(n => n.id === d.source)?.x || 0)
      .attr('y1', d => nodes.find(n => n.id === d.source)?.y || 0)
      .attr('x2', d => nodes.find(n => n.id === d.target)?.x || 0)
      .attr('y2', d => nodes.find(n => n.id === d.target)?.y || 0);

    // Create node groups
    const nodeGroups = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => setHoveredTable(d.id))
      .on('mouseleave', () => setHoveredTable(null));

    // Draw node backgrounds (relevance indicators)
    nodeGroups.append('circle')
      .attr('r', d => 40 + d.relevance * 30)
      .attr('fill', d => d.type === 'fact' ? 'url(#relevance-gradient)' : 'none')
      .attr('stroke', d => {
        if (d.relevance > 0.8) return '#22c55e';
        if (d.relevance > 0.5) return '#3b82f6';
        if (d.relevance > 0.2) return '#f59e0b';
        return '#9ca3af';
      })
      .attr('stroke-width', d => d.relevance > 0 ? 3 : 1)
      .attr('fill-opacity', d => d.type === 'dimension' ? d.relevance * 0.3 : 0.8);

    // Draw node icons
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '24px')
      .text(d => {
        switch (d.id) {
          case 'fact_trading_orders': return '📊';
          case 'dim_security': return '📈';
          case 'dim_trader': return '👤';
          case 'dim_time': return '🕐';
          case 'dim_counterparty': return '🏦';
          case 'dim_order_type': return '📋';
          default: return '📊';
        }
      });

    // Add node labels
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 35)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--gray-12)')
      .text(d => d.label);

    // Add relevance scores
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 50)
      .attr('font-size', '10px')
      .attr('fill', 'var(--gray-11)')
      .text(d => d.relevance > 0 ? `${(d.relevance * 100).toFixed(0)}%` : '');

    // Add keyword badges
    const keywordGroups = nodeGroups.append('g')
      .attr('transform', 'translate(0, -50)');

    keywordGroups.each(function(d) {
      const group = d3.select(this);
      d.keywords.slice(0, 2).forEach((keyword, i) => {
        const badge = group.append('g')
          .attr('transform', `translate(${i * 60 - 30}, 0)`);

        badge.append('rect')
          .attr('x', -25)
          .attr('y', -10)
          .attr('width', 50)
          .attr('height', 20)
          .attr('rx', 10)
          .attr('fill', 'var(--ruby-9)')
          .attr('fill-opacity', 0.8);

        badge.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '10px')
          .attr('fill', 'white')
          .text(keyword);
      });
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', d => nodes.find(n => n.id === d.source)?.x || 0)
        .attr('y1', d => nodes.find(n => n.id === d.source)?.y || 0)
        .attr('x2', d => nodes.find(n => n.id === d.target)?.x || 0)
        .attr('y2', d => nodes.find(n => n.id === d.target)?.y || 0);

      nodeGroups
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });

    svg.call(zoom as any);

  }, [relevanceData]);

  return (
    <Card>
      <Heading size="4" mb="3">Table Relevance Heat Map</Heading>
      
      <Box mb="3">
        <Flex gap="4" align="center">
          <Badge color="green">High Relevance (&gt;80%)</Badge>
          <Badge color="blue">Medium Relevance (50-80%)</Badge>
          <Badge color="amber">Low Relevance (20-50%)</Badge>
          <Badge color="gray">Minimal Relevance (&lt;20%)</Badge>
        </Flex>
      </Box>

      <Box 
        id="relevance-heatmap" 
        style={{ 
          width: '100%', 
          height: '600px',
          backgroundColor: 'var(--gray-2)',
          borderRadius: 'var(--radius-3)',
          overflow: 'hidden'
        }}
      />

      {hoveredTable && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'var(--gray-1)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-2)',
            border: '1px solid var(--gray-6)',
            maxWidth: '300px'
          }}
        >
          <Text size="2" weight="bold">{hoveredTable}</Text>
          <Text size="1" color="gray" style={{ display: 'block', marginTop: '4px' }}>
            {relevanceData.find(d => d.table === hoveredTable)?.reasons.join(' • ')}
          </Text>
        </motion.div>
      )}
    </Card>
  );
};
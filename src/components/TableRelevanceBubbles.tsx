import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, Text, Badge, Callout, Flex } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface BubbleData extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'fact' | 'dimension';
  relevance: number;
  reasons: string[];
  keywords: string[];
  size: number;
}

interface TableRelevanceBubblesProps {
  query: string;
  relevanceData: Array<{
    table: string;
    relevanceScore: number;
    reasons: string[];
  }>;
}

export const TableRelevanceBubbles: React.FC<TableRelevanceBubblesProps> = ({ relevanceData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredBubble, setHoveredBubble] = useState<BubbleData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        const { width } = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: Math.min(width - 40, 1200), height: 600 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!relevanceData || relevanceData.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Prepare bubble data
    const bubbles: BubbleData[] = [
      { 
        id: 'fact_trading_orders', 
        name: 'Trading Orders', 
        type: 'fact', 
        relevance: 0.5, 
        reasons: ['Central fact table'],
        keywords: [],
        size: 100
      },
      { id: 'dim_security', name: 'Securities', type: 'dimension', relevance: 0, reasons: [], keywords: [], size: 60 },
      { id: 'dim_trader', name: 'Traders', type: 'dimension', relevance: 0, reasons: [], keywords: [], size: 60 },
      { id: 'dim_time', name: 'Time', type: 'dimension', relevance: 0, reasons: [], keywords: [], size: 60 },
      { id: 'dim_counterparty', name: 'Counterparties', type: 'dimension', relevance: 0, reasons: [], keywords: [], size: 60 },
      { id: 'dim_order_type', name: 'Order Types', type: 'dimension', relevance: 0, reasons: [], keywords: [], size: 60 }
    ];

    // Update with relevance data
    relevanceData.forEach(data => {
      const bubble = bubbles.find(b => b.id === data.table);
      if (bubble) {
        bubble.relevance = data.relevanceScore;
        bubble.reasons = data.reasons;
        bubble.keywords = data.reasons
          .filter(r => r.includes('Keyword'))
          .map(r => r.match(/"([^"]+)"/)?.[1] || '')
          .filter(k => k);
        bubble.size = bubble.type === 'fact' ? 100 : 60 + (data.relevanceScore * 80);
      }
    });

    // Create container group
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create gradient definitions
    const defs = svg.append('defs');
    
    // Gradient for high relevance
    const gradientHigh = defs.append('radialGradient')
      .attr('id', 'gradient-high');
    gradientHigh.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.8);
    gradientHigh.append('stop').attr('offset', '100%').attr('stop-color', '#059669').attr('stop-opacity', 0.6);

    // Gradient for medium relevance
    const gradientMed = defs.append('radialGradient')
      .attr('id', 'gradient-med');
    gradientMed.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.8);
    gradientMed.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb').attr('stop-opacity', 0.6);

    // Gradient for low relevance
    const gradientLow = defs.append('radialGradient')
      .attr('id', 'gradient-low');
    gradientLow.append('stop').attr('offset', '0%').attr('stop-color', '#94a3b8').attr('stop-opacity', 0.6);
    gradientLow.append('stop').attr('offset', '100%').attr('stop-color', '#64748b').attr('stop-opacity', 0.4);

    // Gradient for fact table
    const gradientFact = defs.append('radialGradient')
      .attr('id', 'gradient-fact');
    gradientFact.append('stop').attr('offset', '0%').attr('stop-color', '#e11d48').attr('stop-opacity', 0.9);
    gradientFact.append('stop').attr('offset', '100%').attr('stop-color', '#be123c').attr('stop-opacity', 0.7);

    // Create force simulation
    const simulation = d3.forceSimulation<BubbleData>(bubbles)
      .force('charge', d3.forceManyBody<BubbleData>().strength(d => d.type === 'fact' ? -200 : -100))
      .force('center', d3.forceCenter<BubbleData>(0, 0))
      .force('collision', d3.forceCollide<BubbleData>().radius(d => d.size + 10))
      .force('x', d3.forceX<BubbleData>(0).strength(0.1))
      .force('y', d3.forceY<BubbleData>(0).strength(0.1));

    // Create bubble groups
    const bubbleGroups = g.selectAll('.bubble')
      .data(bubbles)
      .enter()
      .append('g')
      .attr('class', 'bubble')
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => setHoveredBubble(d))
      .on('mouseleave', () => setHoveredBubble(null));

    // Add circles
    bubbleGroups.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => {
        if (d.type === 'fact') return 'url(#gradient-fact)';
        if (d.relevance >= 0.7) return 'url(#gradient-high)';
        if (d.relevance >= 0.4) return 'url(#gradient-med)';
        return 'url(#gradient-low)';
      })
      .attr('stroke', d => {
        if (d.type === 'fact') return 'var(--ruby-9)';
        if (d.relevance >= 0.7) return 'var(--green-9)';
        if (d.relevance >= 0.4) return 'var(--blue-9)';
        return 'var(--gray-7)';
      })
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');

    // Add labels
    bubbleGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', d => d.type === 'fact' ? '16px' : '14px')
      .style('font-weight', d => d.type === 'fact' ? 'bold' : 'normal')
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .text(d => d.name);

    // Add relevance score
    bubbleGroups.filter(d => d.relevance > 0)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', 20)
      .style('font-size', '12px')
      .style('fill', 'white')
      .style('opacity', 0.9)
      .style('pointer-events', 'none')
      .text(d => `${(d.relevance * 100).toFixed(0)}%`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      bubbleGroups.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    // Animate bubbles on load
    bubbleGroups.select('circle')
      .attr('r', 0)
      .transition()
      .duration(800)
      .ease(d3.easeBounceOut)
      .attr('r', d => d.size);

  }, [relevanceData, dimensions]);

  return (
    <Box>
      <Card>
        <Box position="relative">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ display: 'block', margin: '0 auto' }}
          />
          
          {hoveredBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                maxWidth: '300px',
                zIndex: 10
              }}
            >
              <Card style={{ 
                backgroundColor: 'var(--gray-2)', 
                border: '1px solid var(--gray-6)',
                padding: '12px'
              }}>
                <Text size="3" weight="bold" mb="2">
                  {hoveredBubble.name}
                </Text>
                <Badge 
                  color={hoveredBubble.type === 'fact' ? 'ruby' : 'blue'} 
                  mb="2"
                >
                  {hoveredBubble.type} table
                </Badge>
                {hoveredBubble.relevance > 0 && (
                  <>
                    <Text size="2" style={{ display: 'block', marginBottom: '8px' }}>
                      Relevance: <strong>{(hoveredBubble.relevance * 100).toFixed(0)}%</strong>
                    </Text>
                    {hoveredBubble.keywords.length > 0 && (
                      <Box mb="2">
                        <Text size="2" color="gray">Matched keywords:</Text>
                        <Flex gap="1" wrap="wrap" mt="1">
                          {hoveredBubble.keywords.map((keyword, idx) => (
                            <Badge key={idx} size="1" variant="soft">
                              {keyword}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    )}
                    {hoveredBubble.reasons.length > 0 && (
                      <Box>
                        <Text size="2" color="gray">Reasons:</Text>
                        {hoveredBubble.reasons.slice(0, 3).map((reason, idx) => (
                          <Text key={idx} size="1" style={{ display: 'block', marginTop: '4px' }}>
                            • {reason}
                          </Text>
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </Box>
      </Card>

      <Callout.Root mt="3" size="1">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Bubble size and color indicate relevance to your query. Hover over bubbles to see details.
          Green = High relevance, Blue = Medium relevance, Gray = Low relevance.
        </Callout.Text>
      </Callout.Root>
    </Box>
  );
};
import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, Heading, Grid, Text, Badge, Flex, Progress } from '@radix-ui/themes';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { OrderFlow } from '@/models/types';

interface AnimatedOrder {
  id: string;
  x: number;
  y: number;
  data: OrderFlow;
  velocity: { x: number; y: number };
  lifecycle: number;
}

const orderLifecycleStages = [
  { stage: 'Order Initiation', color: '#E8B4B8' },
  { stage: 'Market Data Validation', color: '#DC6970' },
  { stage: 'Trade Execution', color: '#E73C7E' },
  { stage: 'Portfolio Position Update', color: '#C22E5E' },
  { stage: 'Risk Management Assessment', color: '#9E1946' },
  { stage: 'Settlement Processing', color: '#7A0F31' },
  { stage: 'Final Settlement', color: '#520A21' }
];

const OrderFlowVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [orders, setOrders] = useState<AnimatedOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderFlow[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3000');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to order flow WebSocket');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'order') {
        const orderData = message.data;
        
        // Add to animated orders with lifecycle stage
        const animatedOrder: AnimatedOrder = {
          id: orderData.order_id,
          x: 50, // Start from left
          y: Math.random() * 300 + 50,
          data: {
            ...orderData,
            timestamp: new Date(orderData.timestamp)
          },
          velocity: {
            x: 2 + Math.random(),
            y: (Math.random() - 0.5) * 0.5
          },
          lifecycle: 0 // Start at Order Initiation
        };
        
        setOrders(prev => [...prev.slice(-50), animatedOrder]);
        setRecentOrders(prev => [orderData, ...prev.slice(0, 9)]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 400;

    // Clear existing content
    svg.selectAll('*').remove();

    // Create gradient definitions for each lifecycle stage
    const defs = svg.append('defs');
    
    orderLifecycleStages.forEach((stage, index) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${index}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', stage.color)
        .attr('stop-opacity', 1);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', stage.color)
        .attr('stop-opacity', 0.3);
    });

    // Draw lifecycle stages
    const stageWidth = width / orderLifecycleStages.length;
    orderLifecycleStages.forEach((stage, index) => {
      svg.append('rect')
        .attr('x', index * stageWidth)
        .attr('y', 0)
        .attr('width', stageWidth)
        .attr('height', height)
        .attr('fill', 'var(--gray-2)')
        .attr('stroke', 'var(--gray-4)')
        .attr('stroke-width', 1);
      
      svg.append('text')
        .attr('x', index * stageWidth + stageWidth / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--gray-11)')
        .attr('font-size', '12px')
        .text(stage.stage);
    });

    // Animation loop
    const animate = () => {
      setOrders(prevOrders => {
        return prevOrders
          .map(order => {
            // Move order to the right
            const newX = order.x + order.velocity.x;
            const newY = order.y + order.velocity.y;
            
            // Update lifecycle stage based on position
            const newLifecycle = Math.min(
              Math.floor(newX / stageWidth),
              orderLifecycleStages.length - 1
            );
            
            return {
              ...order,
              x: newX,
              y: Math.max(50, Math.min(height - 50, newY)),
              lifecycle: newLifecycle,
              velocity: {
                x: order.velocity.x,
                y: order.velocity.y
              }
            };
          })
          .filter(order => order.x < width + 50);
      });
    };

    const interval = setInterval(animate, 50);

    return () => clearInterval(interval);
  }, []);

  const getOrderColor = (order: OrderFlow) => {
    return order.order_side === 'BUY' ? '#00E676' : '#FF1744';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FILLED': return 'green';
      case 'PARTIAL': return 'amber';
      case 'CANCELLED': return 'red';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box>
      <Card>
        <Heading size="5" mb="4">Live Order Flow & Lifecycle Visualization</Heading>
        
        {/* Lifecycle Legend */}
        <Box mb="4">
          <Grid columns="7" gap="2">
            {orderLifecycleStages.map((stage, index) => (
              <Box key={index}>
                <Flex align="center" gap="2">
                  <Box 
                    style={{ 
                      width: 12, 
                      height: 12, 
                      backgroundColor: stage.color,
                      borderRadius: '2px'
                    }} 
                  />
                  <Text size="1" color="gray">{stage.stage}</Text>
                </Flex>
              </Box>
            ))}
          </Grid>
        </Box>
        
        <Box style={{ 
          position: 'relative', 
          overflow: 'hidden', 
          height: 400, 
          marginBottom: 'var(--space-6)', 
          backgroundColor: 'var(--gray-1)', 
          borderRadius: 'var(--radius-3)',
          border: '1px solid var(--gray-4)'
        }}>
          <svg
            ref={svgRef}
            width="100%"
            height={400}
          >
            <AnimatePresence>
              {orders.map(order => (
                <motion.g
                  key={order.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.circle
                    cx={order.x}
                    cy={order.y}
                    r={Math.sqrt(order.data.quantity) / 10 + 8}
                    fill={`url(#gradient-${order.lifecycle})`}
                    stroke={getOrderColor(order)}
                    strokeWidth="2"
                    animate={{
                      cx: order.x,
                      cy: order.y
                    }}
                    transition={{ duration: 0.05 }}
                  />
                  <motion.text
                    x={order.x}
                    y={order.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {order.data.symbol}
                  </motion.text>
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>
        </Box>

        <Heading size="4" mb="4">Recent Orders</Heading>
        
        <Grid columns={{ initial: '1', md: '2' }} gap="4">
          {recentOrders.slice(0, 6).map((order, index) => (
            <motion.div
              key={order.order_id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card style={{ 
                borderLeft: `4px solid ${getOrderColor(order)}`,
                backgroundColor: 'var(--gray-2)'
              }}>
                <Flex justify="between" align="center" mb="2">
                  <Text size="3" weight="bold" color={order.order_side === 'BUY' ? 'green' : 'red'}>
                    {order.order_side} {order.symbol}
                  </Text>
                  <Badge color={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </Flex>
                
                {/* Lifecycle Progress */}
                <Box mb="2">
                  <Text size="1" color="gray" mb="1">Order Lifecycle</Text>
                  <Progress value={Math.random() * 100} size="1" color="ruby" />
                </Box>
                
                <Grid columns="2" gap="2">
                  <Box>
                    <Text color="gray" size="1">Quantity</Text>
                    <Text size="2">{order.quantity?.toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text color="gray" size="1">Price</Text>
                    <Text size="2">${order.price?.toFixed(2) || 'Market'}</Text>
                  </Box>
                  <Box>
                    <Text color="gray" size="1">Type</Text>
                    <Text size="2">{order.order_type}</Text>
                  </Box>
                  <Box>
                    <Text color="gray" size="1">P&L</Text>
                    <Text 
                      size="2" 
                      color={order.pnl && order.pnl > 0 ? 'green' : order.pnl && order.pnl < 0 ? 'red' : undefined}
                    >
                      ${order.pnl?.toFixed(2) || '0.00'}
                    </Text>
                  </Box>
                </Grid>
              </Card>
            </motion.div>
          ))}
        </Grid>
      </Card>
    </Box>
  );
};

export default OrderFlowVisualization;
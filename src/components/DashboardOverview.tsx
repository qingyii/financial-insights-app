import React, { useState } from 'react';
import { Box, Grid, Card, Text, Heading, Flex, Badge, Table, Tabs } from '@radix-ui/themes';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowUpIcon, ArrowDownIcon, BarChartIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { mockDataGenerator } from '@/services/mockDataGenerator';

// Modern gradient colors for charts
const COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#fee140',
  '#30cfd0', '#330867', '#ffeaa7', '#00b894', '#6c5ce7', '#fd79a8', '#a29bfe', '#e17055'
];
const VOLUME_COLORS = {
  buy: 'url(#buyGradient)',
  sell: 'url(#sellGradient)'
};

const DashboardOverview: React.FC = () => {
  const { data: recentOrders } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/orders/recent?limit=100');
      return response.data;
    },
    refetchInterval: 5000
  });

  // Removed dailySummary query as we're now using hourly data from recentOrders

  const calculateMetrics = () => {
    if (!recentOrders) return { totalVolume: 0, totalPnL: 0, successRate: 0, avgOrderSize: 0 };

    const totalVolume = recentOrders.reduce((sum: number, order: any) => 
      sum + (order.order_quantity || 0), 0);
    
    const totalPnL = recentOrders.reduce((sum: number, order: any) => 
      sum + (order.pnl || 0), 0);
    
    const filledOrders = recentOrders.filter((order: any) => 
      order.order_status === 'FILLED').length;
    
    const successRate = (filledOrders / recentOrders.length) * 100;
    
    const avgOrderSize = totalVolume / recentOrders.length;

    return { totalVolume, totalPnL, successRate, avgOrderSize };
  };

  const metrics = calculateMetrics();

  const getSecurityTypeDistribution = () => {
    if (!recentOrders) return [];
    
    const distribution: Record<string, number> = {};
    recentOrders.forEach((order: any) => {
      const type = order.security_type || 'Unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const getVolumeByTime = () => {
    if (!recentOrders) return [];
    
    // Generate hourly volume data for the last 24 hours
    const now = new Date();
    const hourlyData: any[] = [];
    
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i);
      hourStart.setMinutes(0, 0, 0);
      
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);
      
      const hourOrders = recentOrders.filter((order: any) => {
        const orderTime = new Date(order.full_datetime);
        return orderTime >= hourStart && orderTime < hourEnd;
      });
      
      const buyVolume = hourOrders
        .filter((o: any) => o.order_side === 'BUY')
        .reduce((sum: number, o: any) => sum + (o.order_quantity || 0), 0);
      
      const sellVolume = hourOrders
        .filter((o: any) => o.order_side === 'SELL')
        .reduce((sum: number, o: any) => sum + (o.order_quantity || 0), 0);
      
      hourlyData.push({
        time: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        hour: hourStart.getHours(),
        buyVolume: buyVolume || Math.floor(Math.random() * 50000) + 10000,
        sellVolume: sellVolume || Math.floor(Math.random() * 50000) + 10000,
        totalVolume: buyVolume + sellVolume
      });
    }
    
    return hourlyData;
  };

  return (
    <Box>
      <Heading size="5" mb="6">Trading Dashboard Overview</Heading>

      {/* Key Metrics */}
      <Grid columns={{ initial: '1', xs: '2', md: '4' }} gap="4" mb="6">
        <Card>
          <Flex justify="between" align="center">
            <Box>
              <Text color="gray" size="2">Total Volume</Text>
              <Heading size="4">{metrics.totalVolume.toLocaleString()}</Heading>
            </Box>
            <BarChartIcon width="32" height="32" color="var(--ruby-9)" />
          </Flex>
        </Card>

        <Card>
          <Flex justify="between" align="center">
            <Box>
              <Text color="gray" size="2">Total P&L</Text>
              <Heading size="4" color={metrics.totalPnL > 0 ? 'green' : 'red'}>
                ${metrics.totalPnL.toFixed(2)}
              </Heading>
            </Box>
            {metrics.totalPnL > 0 ? 
              <ArrowUpIcon width="32" height="32" color="var(--green-9)" /> :
              <ArrowDownIcon width="32" height="32" color="var(--red-9)" />
            }
          </Flex>
        </Card>

        <Card>
          <Flex justify="between" align="center">
            <Box>
              <Text color="gray" size="2">Success Rate</Text>
              <Heading size="4">{metrics.successRate.toFixed(1)}%</Heading>
            </Box>
            <ActivityLogIcon width="32" height="32" color="var(--ruby-9)" />
          </Flex>
        </Card>

        <Card>
          <Flex justify="between" align="center">
            <Box>
              <Text color="gray" size="2">Avg Order Size</Text>
              <Heading size="4">{Math.round(metrics.avgOrderSize).toLocaleString()}</Heading>
            </Box>
            <BarChartIcon width="32" height="32" color="var(--ruby-9)" />
          </Flex>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid columns={{ initial: '1', md: '3' }} gap="6">
        {/* Volume Trend */}
        <Box style={{ gridColumn: 'span 2' }}>
          <Card>
            <Heading size="4" mb="4">24-Hour Trading Volume Trend</Heading>
            <Box style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getVolumeByTime()}>
                  <defs>
                    <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4facfe" stopOpacity={1} />
                      <stop offset="100%" stopColor="#00f2fe" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="sellGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fa709a" stopOpacity={1} />
                      <stop offset="100%" stopColor="#fee140" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke="var(--gray-11)" 
                    fontSize={12}
                    tickFormatter={(value) => value.split(':')[0] + ':00'}
                  />
                  <YAxis 
                    stroke="var(--gray-11)" 
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}
                    labelStyle={{ color: 'var(--gray-12)' }}
                    itemStyle={{ color: 'var(--gray-12)' }}
                    formatter={(value: any) => `${(value as number).toLocaleString()} shares`}
                  />
                  <Legend wrapperStyle={{ color: 'var(--gray-11)' }} />
                  <Bar dataKey="buyVolume" fill={VOLUME_COLORS.buy} name="Buy Volume" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sellVolume" fill={VOLUME_COLORS.sell} name="Sell Volume" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>

        {/* Security Type Distribution */}
        <Card>
          <Heading size="4" mb="4">Security Type Distribution</Heading>
          <Box style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getSecurityTypeDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getSecurityTypeDistribution().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--gray-3)', border: '1px solid var(--gray-6)', borderRadius: '4px' }}
                  labelStyle={{ color: 'var(--gray-12)' }}
                  itemStyle={{ color: 'var(--gray-12)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Recent Activity */}
        <Box style={{ gridColumn: 'span 3' }}>
          <Card>
            <Heading size="4" mb="4">Recent Trading Activity</Heading>
            <Tabs.Root defaultValue="all">
              <Tabs.List>
                <Tabs.Trigger value="all">All</Tabs.Trigger>
                <Tabs.Trigger value="traditional">Traditional</Tabs.Trigger>
                <Tabs.Trigger value="derivatives">Derivatives</Tabs.Trigger>
                <Tabs.Trigger value="fx">FX</Tabs.Trigger>
                <Tabs.Trigger value="money_market">Money Market</Tabs.Trigger>
                <Tabs.Trigger value="commodities">Commodities</Tabs.Trigger>
              </Tabs.List>
              
              <Tabs.Content value="all">
                <RecentTradingTable orders={recentOrders} />
              </Tabs.Content>
              
              <Tabs.Content value="traditional">
                <RecentTradingTable 
                  orders={recentOrders?.filter((o: any) => 
                    ['EQUITY', 'BOND', 'ETF'].includes(o.security_type)
                  )} 
                />
              </Tabs.Content>
              
              <Tabs.Content value="derivatives">
                <RecentTradingTable 
                  orders={recentOrders?.filter((o: any) => 
                    ['OPTION', 'FUTURE', 'SWAP', 'OTC_DERIVATIVE', 'CREDIT_DEFAULT_SWAP'].includes(o.security_type)
                  )} 
                />
              </Tabs.Content>
              
              <Tabs.Content value="fx">
                <RecentTradingTable 
                  orders={recentOrders?.filter((o: any) => 
                    ['FX_SPOT', 'FX_FORWARD'].includes(o.security_type)
                  )} 
                />
              </Tabs.Content>
              
              <Tabs.Content value="money_market">
                <RecentTradingTable 
                  orders={recentOrders?.filter((o: any) => 
                    ['MONEY_MARKET', 'REPO', 'CASH'].includes(o.security_type)
                  )} 
                />
              </Tabs.Content>
              
              <Tabs.Content value="commodities">
                <RecentTradingTable 
                  orders={recentOrders?.filter((o: any) => 
                    o.security_type === 'COMMODITY'
                  )} 
                />
              </Tabs.Content>
            </Tabs.Root>
          </Card>
        </Box>
      </Grid>
    </Box>
  );
};

interface RecentTradingTableProps {
  orders: any[] | undefined;
}

const RecentTradingTable: React.FC<RecentTradingTableProps> = ({ orders }) => {
  // Sort orders by timestamp descending
  const sortedOrders = orders?.sort((a: any, b: any) => 
    new Date(b.full_datetime).getTime() - new Date(a.full_datetime).getTime()
  );
  
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Symbol</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Side</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="right">Quantity</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="right">Price</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="right">P&L</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedOrders?.slice(0, 10).map((order: any, idx: number) => (
          <Table.Row key={idx}>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: 'monospace' }}>
                {(() => {
                  const date = new Date(order.full_datetime);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}${month}${day}`;
                })()}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: 'monospace' }}>
                {(() => {
                  const date = new Date(order.full_datetime);
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  const seconds = String(date.getSeconds()).padStart(2, '0');
                  const ms = String(date.getMilliseconds()).padStart(3, '0');
                  return `${hours}:${minutes}:${seconds}:${ms}`;
                })()}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Text 
                weight="bold" 
                style={{ cursor: 'help' }}
                title={mockDataGenerator.getSymbolDescription(order.symbol)}
              >
                {order.symbol}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Badge 
                variant="soft" 
                style={{ cursor: 'help' }}
                title={mockDataGenerator.getSecurityTypeDescription(order.security_type)}
              >
                {order.security_type}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge color={order.order_side === 'BUY' ? 'green' : 'red'}>
                {order.order_side}
              </Badge>
            </Table.Cell>
            <Table.Cell align="right">
              {order.order_quantity?.toLocaleString()}
            </Table.Cell>
            <Table.Cell align="right">
              {order.average_fill_price ? 
                `$${order.average_fill_price.toFixed(2)}` :
                order.order_price ? 
                  `$${order.order_price.toFixed(2)}` :
                  <Badge variant="soft" color="gray">Market</Badge>
              }
            </Table.Cell>
            <Table.Cell>
              <Badge 
                color={
                  order.order_status === 'FILLED' ? 'green' :
                  order.order_status === 'PARTIAL' ? 'amber' :
                  order.order_status === 'CANCELLED' ? 'red' : 'gray'
                }
              >
                {order.order_status}
              </Badge>
            </Table.Cell>
            <Table.Cell align="right">
              <Text color={order.pnl > 0 ? 'green' : order.pnl < 0 ? 'red' : undefined}>
                ${order.pnl?.toFixed(2) || '0.00'}
              </Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default DashboardOverview;
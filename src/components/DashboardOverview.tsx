import React from 'react';
import { Box, Grid, Card, Text, Heading, Flex, Badge, Table } from '@radix-ui/themes';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowUpIcon, ArrowDownIcon, BarChartIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { mockDataGenerator } from '@/services/mockDataGenerator';

const COLORS = ['#E73C7E', '#23A6D5', '#23D5AB', '#EE7752', '#E8B4B8'];

const DashboardOverview: React.FC = () => {
  const { data: recentOrders } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/orders/recent?limit=100');
      return response.data;
    },
    refetchInterval: 5000
  });

  const { data: dailySummary } = useQuery({
    queryKey: ['dailySummary'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/summary/daily');
      return response.data;
    },
    refetchInterval: 30000
  });

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
    if (!dailySummary) return [];
    
    return dailySummary.slice(0, 7).reverse().map((day: any) => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      buyVolume: day.buy_volume || 0,
      sellVolume: day.sell_volume || 0,
      pnl: day.total_pnl || 0
    }));
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
            <Heading size="4" mb="4">Trading Volume Trend</Heading>
            <Box style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getVolumeByTime()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
                  <XAxis dataKey="date" stroke="var(--gray-11)" />
                  <YAxis stroke="var(--gray-11)" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--gray-3)', border: '1px solid var(--gray-6)', borderRadius: '4px' }}
                    labelStyle={{ color: 'var(--gray-12)' }}
                    itemStyle={{ color: 'var(--gray-12)' }}
                  />
                  <Legend wrapperStyle={{ color: 'var(--gray-11)' }} />
                  <Bar dataKey="buyVolume" fill="#00E676" name="Buy Volume" />
                  <Bar dataKey="sellVolume" fill="#FF1744" name="Sell Volume" />
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
            <Table.Root>
              <Table.Header>
                <Table.Row>
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
                {recentOrders?.slice(0, 10).map((order: any, idx: number) => (
                  <Table.Row key={idx}>
                    <Table.Cell>
                      {new Date(order.full_datetime).toLocaleTimeString('en-US', { hour12: false })}
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
                      ${order.average_fill_price?.toFixed(2) || order.order_price?.toFixed(2) || 'Market'}
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
          </Card>
        </Box>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
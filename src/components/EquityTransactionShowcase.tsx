import React, { useState } from 'react';
import { Box, Card, Heading, Text, Button, Flex, Grid, Badge, Table, Separator, Tabs, ScrollArea } from '@radix-ui/themes';
import { CheckIcon, ClockIcon, UpdateIcon, TableIcon, Share2Icon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionStep {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: string;
  details: Record<string, string>;
  dataFlow: string[];
  tablesAffected: DatabaseTable[];
  sqlOperations: SqlOperation[];
}

interface DatabaseTable {
  name: string;
  type: 'fact' | 'dimension';
  description: string;
  primaryKey: string;
  columns: TableColumn[];
  relationships?: string[];
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
}

interface SqlOperation {
  type: 'INSERT' | 'UPDATE' | 'SELECT' | 'DELETE';
  table: string;
  sql: string;
  description: string;
  executionTime: number;
}

export const EquityTransactionShowcase: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Comprehensive database schema for trading system
  const databaseTables: Record<string, DatabaseTable> = {
    fact_trading_orders: {
      name: 'fact_trading_orders',
      type: 'fact',
      description: 'Central fact table storing all trading order transactions',
      primaryKey: 'order_id',
      columns: [
        { name: 'order_id', type: 'VARCHAR(20)', nullable: false, description: 'Unique order identifier' },
        { name: 'time_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_time' },
        { name: 'security_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_security' },
        { name: 'trader_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_trader' },
        { name: 'counterparty_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_counterparty' },
        { name: 'order_type_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_order_type' },
        { name: 'order_quantity', type: 'DECIMAL(15,2)', nullable: false, description: 'Number of shares/units' },
        { name: 'order_price', type: 'DECIMAL(15,4)', nullable: true, description: 'Limit price (NULL for market orders)' },
        { name: 'filled_quantity', type: 'DECIMAL(15,2)', nullable: false, description: 'Actual filled quantity' },
        { name: 'average_fill_price', type: 'DECIMAL(15,4)', nullable: true, description: 'Volume-weighted average price' },
        { name: 'order_status', type: 'VARCHAR(20)', nullable: false, description: 'NEW, PARTIAL, FILLED, CANCELLED, REJECTED' },
        { name: 'pnl', type: 'DECIMAL(15,2)', nullable: true, description: 'Profit and loss for the trade' }
      ],
      relationships: ['dim_security', 'dim_trader', 'dim_time', 'dim_counterparty', 'dim_order_type']
    },
    dim_security: {
      name: 'dim_security',
      type: 'dimension',
      description: 'Security master data including stocks, bonds, derivatives',
      primaryKey: 'security_id',
      columns: [
        { name: 'security_id', type: 'INTEGER', nullable: false, description: 'Unique security identifier' },
        { name: 'symbol', type: 'VARCHAR(20)', nullable: false, description: 'Trading symbol (e.g., AAPL.O)' },
        { name: 'security_name', type: 'VARCHAR(100)', nullable: false, description: 'Full security name' },
        { name: 'security_type', type: 'VARCHAR(20)', nullable: false, description: 'Equity, Bond, Option, etc.' },
        { name: 'exchange', type: 'VARCHAR(10)', nullable: false, description: 'Primary exchange' },
        { name: 'sector', type: 'VARCHAR(50)', nullable: true, description: 'Business sector' },
        { name: 'currency', type: 'VARCHAR(3)', nullable: false, description: 'Trading currency' }
      ]
    },
    fact_risk_metrics: {
      name: 'fact_risk_metrics',
      type: 'fact',
      description: 'Real-time risk calculations and limits monitoring',
      primaryKey: 'risk_id',
      columns: [
        { name: 'risk_id', type: 'INTEGER', nullable: false, description: 'Unique risk calculation ID' },
        { name: 'trader_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_trader' },
        { name: 'security_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_security' },
        { name: 'position_limit', type: 'DECIMAL(15,2)', nullable: false, description: 'Maximum allowed position' },
        { name: 'current_position', type: 'DECIMAL(15,2)', nullable: false, description: 'Current holdings' },
        { name: 'concentration_pct', type: 'DECIMAL(5,2)', nullable: false, description: 'Portfolio concentration percentage' },
        { name: 'var_1day', type: 'DECIMAL(15,2)', nullable: true, description: '1-day Value at Risk' }
      ]
    },
    fact_executions: {
      name: 'fact_executions',
      type: 'fact',
      description: 'Individual trade execution details and fills',
      primaryKey: 'execution_id',
      columns: [
        { name: 'execution_id', type: 'VARCHAR(20)', nullable: false, description: 'Unique execution identifier' },
        { name: 'order_id', type: 'VARCHAR(20)', nullable: false, description: 'Foreign key to fact_trading_orders' },
        { name: 'execution_price', type: 'DECIMAL(15,4)', nullable: false, description: 'Actual execution price' },
        { name: 'execution_quantity', type: 'DECIMAL(15,2)', nullable: false, description: 'Executed quantity' },
        { name: 'execution_venue', type: 'VARCHAR(20)', nullable: false, description: 'Execution venue/exchange' },
        { name: 'commission', type: 'DECIMAL(10,2)', nullable: false, description: 'Commission charged' }
      ]
    },
    fact_positions: {
      name: 'fact_positions',
      type: 'fact',
      description: 'Current portfolio positions and valuations',
      primaryKey: 'position_id',
      columns: [
        { name: 'position_id', type: 'INTEGER', nullable: false, description: 'Unique position identifier' },
        { name: 'trader_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_trader' },
        { name: 'security_id', type: 'INTEGER', nullable: false, description: 'Foreign key to dim_security' },
        { name: 'quantity', type: 'DECIMAL(15,2)', nullable: false, description: 'Current position quantity' },
        { name: 'average_cost', type: 'DECIMAL(15,4)', nullable: false, description: 'Volume-weighted average cost' },
        { name: 'market_value', type: 'DECIMAL(15,2)', nullable: false, description: 'Current market value' },
        { name: 'unrealized_pnl', type: 'DECIMAL(15,2)', nullable: false, description: 'Unrealized profit/loss' }
      ]
    },
    fact_settlements: {
      name: 'fact_settlements',
      type: 'fact',
      description: 'Trade settlement and cash movement records',
      primaryKey: 'settlement_id',
      columns: [
        { name: 'settlement_id', type: 'VARCHAR(20)', nullable: false, description: 'Unique settlement identifier' },
        { name: 'order_id', type: 'VARCHAR(20)', nullable: false, description: 'Foreign key to fact_trading_orders' },
        { name: 'settlement_date', type: 'DATE', nullable: false, description: 'Settlement date (T+2)' },
        { name: 'net_amount', type: 'DECIMAL(15,2)', nullable: false, description: 'Net cash amount' },
        { name: 'settlement_status', type: 'VARCHAR(20)', nullable: false, description: 'PENDING, SETTLED, FAILED' }
      ]
    }
  };

  const transactionSteps: TransactionStep[] = [
    {
      id: 1,
      name: 'Order Placement',
      status: 'pending',
      details: {
        'Order ID': 'ORD-2024-001234',
        'Symbol': 'AAPL.O',
        'Side': 'BUY',
        'Quantity': '1,000',
        'Order Type': 'LIMIT',
        'Limit Price': '$195.50'
      },
      dataFlow: [
        'INSERT INTO fact_trading_orders',
        'JOIN dim_security ON symbol = "AAPL.O"',
        'JOIN dim_trader ON trader_id = "TR-001"',
        'JOIN dim_time ON current_timestamp'
      ],
      tablesAffected: [
        databaseTables.fact_trading_orders,
        databaseTables.dim_security
      ],
      sqlOperations: [
        {
          type: 'SELECT',
          table: 'dim_security',
          sql: 'SELECT security_id, symbol, security_type FROM dim_security WHERE symbol = \'AAPL.O\'',
          description: 'Lookup security master data for Apple Inc.',
          executionTime: 2
        },
        {
          type: 'INSERT',
          table: 'fact_trading_orders',
          sql: `INSERT INTO fact_trading_orders (
            order_id, time_id, security_id, trader_id, 
            order_quantity, order_price, order_status
          ) VALUES (
            'ORD-2024-001234', 20241215, 12345, 101,
            1000.00, 195.50, 'NEW'
          )`,
          description: 'Create new order record in the system',
          executionTime: 15
        }
      ]
    },
    {
      id: 2,
      name: 'Risk Validation',
      status: 'pending',
      details: {
        'Position Limit': 'PASS ✓',
        'Credit Check': 'PASS ✓',
        'Market Risk': 'Within limits',
        'Concentration': '12% of portfolio',
        'Available Cash': '$2.5M'
      },
      dataFlow: [
        'SELECT SUM(position) FROM fact_positions',
        'CHECK portfolio_limits',
        'CALCULATE concentration_risk',
        'UPDATE risk_metrics'
      ],
      tablesAffected: [
        databaseTables.fact_risk_metrics
      ],
      sqlOperations: [
        {
          type: 'SELECT',
          table: 'fact_risk_metrics',
          sql: `SELECT 
            current_position, position_limit, concentration_pct 
          FROM fact_risk_metrics 
          WHERE trader_id = 101 AND security_id = 12345`,
          description: 'Check current risk limits and positions',
          executionTime: 5
        },
        {
          type: 'UPDATE',
          table: 'fact_risk_metrics',
          sql: `UPDATE fact_risk_metrics 
          SET current_position = current_position + 1000,
              concentration_pct = 12.5,
              var_1day = 25000.00
          WHERE trader_id = 101 AND security_id = 12345`,
          description: 'Update risk metrics with new position',
          executionTime: 8
        }
      ]
    },
    {
      id: 3,
      name: 'Market Routing',
      status: 'pending',
      details: {
        'Primary Route': 'NASDAQ',
        'Smart Order Router': 'Active',
        'Dark Pool Check': 'No match',
        'Best Bid': '$195.48',
        'Best Ask': '$195.52'
      },
      dataFlow: [
        'QUERY market_data_feed',
        'CHECK liquidity_pools',
        'ROUTE to best_execution_venue',
        'UPDATE order_status = "ROUTED"'
      ],
      tablesAffected: [
        databaseTables.fact_trading_orders
      ],
      sqlOperations: [
        {
          type: 'UPDATE',
          table: 'fact_trading_orders',
          sql: `UPDATE fact_trading_orders 
          SET order_status = 'ROUTED'
          WHERE order_id = 'ORD-2024-001234'`,
          description: 'Update order status to routed',
          executionTime: 3
        }
      ]
    },
    {
      id: 4,
      name: 'Order Execution',
      status: 'pending',
      details: {
        'Execution Price': '$195.51',
        'Filled Quantity': '1,000',
        'Execution Time': '10:45:32.123',
        'Execution Venue': 'NASDAQ',
        'Trade ID': 'TRD-2024-005678'
      },
      dataFlow: [
        'UPDATE order_status = "FILLED"',
        'SET fill_price = 195.51',
        'SET fill_timestamp = NOW()',
        'INSERT INTO fact_executions'
      ],
      tablesAffected: [
        databaseTables.fact_trading_orders,
        databaseTables.fact_executions
      ],
      sqlOperations: [
        {
          type: 'UPDATE',
          table: 'fact_trading_orders',
          sql: `UPDATE fact_trading_orders 
          SET order_status = 'FILLED',
              filled_quantity = 1000.00,
              average_fill_price = 195.51,
              pnl = (195.51 - 189.75) * 1000
          WHERE order_id = 'ORD-2024-001234'`,
          description: 'Update order with execution details',
          executionTime: 12
        },
        {
          type: 'INSERT',
          table: 'fact_executions',
          sql: `INSERT INTO fact_executions (
            execution_id, order_id, execution_price, 
            execution_quantity, execution_venue, commission
          ) VALUES (
            'TRD-2024-005678', 'ORD-2024-001234', 195.51,
            1000.00, 'NASDAQ', 10.00
          )`,
          description: 'Record execution details in fact table',
          executionTime: 18
        }
      ]
    },
    {
      id: 5,
      name: 'Position Update',
      status: 'pending',
      details: {
        'Previous Position': '5,000',
        'Trade Quantity': '+1,000',
        'New Position': '6,000',
        'Avg Cost': '$189.75',
        'Market Value': '$1,173,060'
      },
      dataFlow: [
        'UPDATE fact_positions',
        'CALCULATE weighted_avg_cost',
        'UPDATE market_value',
        'TRIGGER position_alerts'
      ],
      tablesAffected: [
        databaseTables.fact_positions
      ],
      sqlOperations: [
        {
          type: 'UPDATE',
          table: 'fact_positions',
          sql: `UPDATE fact_positions 
          SET quantity = quantity + 1000,
              average_cost = ((quantity * average_cost) + (1000 * 195.51)) / (quantity + 1000),
              market_value = (quantity + 1000) * 195.51,
              unrealized_pnl = ((quantity + 1000) * 195.51) - ((quantity + 1000) * average_cost)
          WHERE trader_id = 101 AND security_id = 12345`,
          description: 'Update portfolio position with new trade',
          executionTime: 25
        }
      ]
    },
    {
      id: 6,
      name: 'Settlement & Reporting',
      status: 'pending',
      details: {
        'Settlement Date': 'T+2',
        'Net Amount': '$195,510',
        'Commission': '$10',
        'Reports Generated': '4',
        'Confirmations Sent': 'Yes'
      },
      dataFlow: [
        'INSERT INTO fact_settlements',
        'GENERATE trade_confirmation',
        'UPDATE regulatory_reporting',
        'SEND client_notification'
      ],
      tablesAffected: [
        databaseTables.fact_settlements
      ],
      sqlOperations: [
        {
          type: 'INSERT',
          table: 'fact_settlements',
          sql: `INSERT INTO fact_settlements (
            settlement_id, order_id, settlement_date, 
            net_amount, settlement_status
          ) VALUES (
            'STL-2024-001234', 'ORD-2024-001234', 
            DATEADD(day, 2, GETDATE()), 195510.00, 'PENDING'
          )`,
          description: 'Create settlement record for T+2 processing',
          executionTime: 10
        }
      ]
    }
  ];

  const runTransaction = () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= transactionSteps.length - 1) {
          clearInterval(interval);
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  const getStepStatus = (index: number): 'pending' | 'active' | 'completed' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep && isRunning) return 'active';
    return 'pending';
  };

  const getStatusIcon = (status: 'pending' | 'active' | 'completed') => {
    switch (status) {
      case 'completed':
        return <CheckIcon width="16" height="16" />;
      case 'active':
        return <UpdateIcon width="16" height="16" className="animate-spin" />;
      default:
        return <ClockIcon width="16" height="16" />;
    }
  };

  const getStatusColor = (status: 'pending' | 'active' | 'completed') => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'active':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Box>
          <Heading size="6" mb="2">End-to-End Equity Transaction</Heading>
          <Text color="gray">Watch a complete equity order flow through our trading system with real-time database updates</Text>
        </Box>
        <Button 
          size="3" 
          onClick={runTransaction} 
          disabled={isRunning}
          style={{ minWidth: '150px' }}
        >
          {isRunning ? 'Running...' : 'Run Transaction'}
        </Button>
      </Flex>

      <Tabs.Root defaultValue="transaction">
        <Tabs.List mb="4">
          <Tabs.Trigger value="transaction">Transaction Flow</Tabs.Trigger>
          <Tabs.Trigger value="schema">
            <TableIcon width="16" height="16" style={{ marginRight: '4px' }} />
            Database Schema
          </Tabs.Trigger>
          <Tabs.Trigger value="sql">
            <Share2Icon width="16" height="16" style={{ marginRight: '4px' }} />
            SQL Operations
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="transaction">

      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        <Card size="3">
          <Heading size="4" mb="3">Transaction Flow</Heading>
          
          <Box>
            {transactionSteps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <Box key={step.id} mb="3">
                  <Flex align="center" gap="3" mb="2">
                    <Badge 
                      size="2" 
                      color={getStatusColor(status) as any}
                      style={{ minWidth: '30px' }}
                    >
                      {getStatusIcon(status)}
                    </Badge>
                    <Text weight={status === 'active' ? 'bold' : 'regular'}>
                      {step.name}
                    </Text>
                    {status === 'completed' && (
                      <Text size="1" color="gray">
                        {new Date().toLocaleTimeString()}
                      </Text>
                    )}
                  </Flex>
                  
                  {index < transactionSteps.length - 1 && (
                    <Box 
                      ml="3" 
                      style={{ 
                        borderLeft: `2px ${status === 'completed' ? 'solid' : 'dashed'} var(--gray-6)`,
                        height: '20px',
                        marginLeft: '15px'
                      }} 
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Card>

        <Card size="3">
          <AnimatePresence mode="wait">
            {currentStep < transactionSteps.length && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Heading size="4" mb="3">
                  {transactionSteps[currentStep].name}
                </Heading>
                
                <Box mb="4">
                  <Text size="2" weight="medium" color="gray" mb="2">Transaction Details</Text>
                  <Table.Root size="1">
                    <Table.Body>
                      {Object.entries(transactionSteps[currentStep].details).map(([key, value]) => (
                        <Table.Row key={key}>
                          <Table.Cell style={{ fontWeight: 500 }}>{key}</Table.Cell>
                          <Table.Cell>{value}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>

                <Separator size="4" mb="4" />

                <Box>
                  <Text size="2" weight="medium" color="gray" mb="2">Database Operations</Text>
                  <Box style={{ 
                    backgroundColor: 'var(--gray-2)', 
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-2)',
                    fontFamily: 'monospace'
                  }}>
                    {transactionSteps[currentStep].dataFlow.map((flow, index) => (
                      <Text key={index} size="1" style={{ display: 'block', marginBottom: '4px' }}>
                        {flow}
                      </Text>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isRunning && currentStep === transactionSteps.length - 1 && (
            <Box style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <CheckIcon width="48" height="48" style={{ color: 'var(--green-9)', margin: '0 auto' }} />
              <Heading size="4" mt="3" mb="2">Transaction Complete!</Heading>
              <Text color="gray">The equity order has been successfully processed through all stages.</Text>
            </Box>
          )}
        </Card>
      </Grid>

        <Card mt="4" size="2">
          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            <Box>
              <Text size="1" weight="medium" color="gray">Order Summary</Text>
              <Text size="3" weight="bold">1,000 AAPL.O @ $195.51</Text>
            </Box>
            <Box>
              <Text size="1" weight="medium" color="gray">Total Value</Text>
              <Text size="3" weight="bold">$195,510</Text>
            </Box>
            <Box>
              <Text size="1" weight="medium" color="gray">Status</Text>
              <Badge size="2" color={isRunning ? 'blue' : currentStep > 0 ? 'green' : 'gray'}>
                {isRunning ? 'Processing' : currentStep === transactionSteps.length - 1 ? 'Settled' : 'Ready'}
              </Badge>
            </Box>
          </Grid>
        </Card>
        </Tabs.Content>

        <Tabs.Content value="schema">
          <Card>
            <Heading size="4" mb="4">Database Schema Overview</Heading>
            <Text color="gray" mb="4">
              This shows the tables and relationships involved in the current transaction step
            </Text>
            
            {currentStep < transactionSteps.length && (
              <Box>
                <Heading size="3" mb="3">
                  Tables Affected: {transactionSteps[currentStep].name}
                </Heading>
                
                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                  {transactionSteps[currentStep].tablesAffected?.map((table, index) => (
                    <motion.div
                      key={table.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card style={{ 
                        borderLeft: `4px solid ${table.type === 'fact' ? 'var(--ruby-9)' : 'var(--blue-9)'}`,
                        backgroundColor: table.type === 'fact' ? 'var(--ruby-2)' : 'var(--blue-2)'
                      }}>
                        <Flex align="center" gap="2" mb="3">
                          <Badge size="2" color={table.type === 'fact' ? 'ruby' : 'blue'}>
                            {table.type.toUpperCase()} TABLE
                          </Badge>
                          <Text size="3" weight="bold">{table.name}</Text>
                        </Flex>
                        
                        <Text size="2" color="gray" mb="3">{table.description}</Text>
                        
                        <Box mb="3">
                          <Text size="2" weight="medium" mb="2">Primary Key: {table.primaryKey}</Text>
                        </Box>
                        
                        <ScrollArea style={{ maxHeight: 200 }}>
                          <Table.Root size="1">
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeaderCell>Column</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {table.columns.slice(0, 6).map((column) => (
                                <Table.Row key={column.name}>
                                  <Table.Cell style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                    {column.name}
                                    {!column.nullable && <Text color="red" size="1"> *</Text>}
                                  </Table.Cell>
                                  <Table.Cell style={{ fontFamily: 'monospace' }}>
                                    <Text size="1">{column.type}</Text>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Text size="1" color="gray">{column.description}</Text>
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Root>
                        </ScrollArea>
                        
                        {table.columns.length > 6 && (
                          <Text size="1" color="gray" mt="2">
                            ... and {table.columns.length - 6} more columns
                          </Text>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </Grid>
              </Box>
            )}
          </Card>
        </Tabs.Content>

        <Tabs.Content value="sql">
          <Card>
            <Heading size="4" mb="4">Real-time SQL Operations</Heading>
            <Text color="gray" mb="4">
              Watch the actual SQL commands being executed for the current transaction step
            </Text>
            
            {currentStep < transactionSteps.length && (
              <Box>
                <Heading size="3" mb="3">
                  SQL Operations: {transactionSteps[currentStep].name}
                </Heading>
                
                <Box>
                  {transactionSteps[currentStep].sqlOperations?.map((operation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.3 }}
                    >
                      <Card mb="4" style={{ 
                        borderLeft: `4px solid ${
                          operation.type === 'INSERT' ? 'var(--green-9)' :
                          operation.type === 'UPDATE' ? 'var(--amber-9)' :
                          operation.type === 'SELECT' ? 'var(--blue-9)' :
                          'var(--red-9)'
                        }`
                      }}>
                        <Flex justify="between" align="center" mb="3">
                          <Flex align="center" gap="2">
                            <Badge size="2" color={
                              operation.type === 'INSERT' ? 'green' :
                              operation.type === 'UPDATE' ? 'amber' :
                              operation.type === 'SELECT' ? 'blue' : 'red'
                            }>
                              {operation.type}
                            </Badge>
                            <Text size="2" weight="medium">{operation.table}</Text>
                          </Flex>
                          <Text size="1" color="gray">{operation.executionTime}ms</Text>
                        </Flex>
                        
                        <Text size="2" mb="3">{operation.description}</Text>
                        
                        <Box style={{ 
                          backgroundColor: 'var(--gray-4)', 
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-2)',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          border: '1px solid var(--gray-6)'
                        }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {operation.sql}
                          </pre>
                        </Box>
                      </Card>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            )}
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};
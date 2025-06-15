import React, { useState } from 'react';
import { Box, Card, Heading, Text, Button, Flex, Grid, Badge, Table, Separator } from '@radix-ui/themes';
import { ArrowRightIcon, CheckIcon, ClockIcon, UpdateIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionStep {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: string;
  details: Record<string, string>;
  dataFlow: string[];
}

export const EquityTransactionShowcase: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

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
          <Text color="gray">Watch a complete equity order flow through our trading system</Text>
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
    </Box>
  );
};
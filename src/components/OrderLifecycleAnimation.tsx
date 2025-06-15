import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Box, Card, Heading, Text, Button, Flex, Badge, Progress, Separator, Grid } from '@radix-ui/themes';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, ResetIcon, CheckCircledIcon, ClockIcon } from '@radix-ui/react-icons';

// Lazy load DataFlowDiagram to improve initial load time
const DataFlowDiagram = lazy(() => import('./DataFlowDiagram'));

interface OrderStep {
  id: number;
  title: string;
  duration: number; // in seconds
  description: string;
  details: string[];
  dataAccess: string[];
  metrics?: { label: string; value: string }[];
}

const orderSteps: OrderStep[] = [
  {
    id: 1,
    title: "Order Initiation",
    duration: 4,
    description: "BlackRock Inc. submits buy order for 50,000 AAPL.O shares",
    details: [
      "Client: BlackRock Incorporated",
      "AUM: $8.5 billion",
      "Order: BUY 50,000 AAPL.O shares",
      "Trader: Sarah Chen (TR-001)",
      "Desk: Equity Trading"
    ],
    dataAccess: [
      "Accessing DIM_CLIENT table",
      "Retrieving client risk rating: A",
      "Verifying trader authorization",
      "Checking trading limits"
    ],
    metrics: [
      { label: "Order Size", value: "50,000 shares" },
      { label: "Client AUM", value: "$8.5B" }
    ]
  },
  {
    id: 2,
    title: "Market Data Validation",
    duration: 3,
    description: "Validating security details and checking market conditions",
    details: [
      "Symbol: AAPL.O (Apple Inc.)",
      "Asset Class: Large-cap Equity",
      "Sector: Technology",
      "Exchange: NASDAQ",
      "ISIN: US0378331005"
    ],
    dataAccess: [
      "Querying DIM_SECURITY table",
      "Accessing FACT_MARKET_DATA",
      "Real-time price feed active",
      "Liquidity check: 45M shares traded"
    ],
    metrics: [
      { label: "Bid Price", value: "$195.85" },
      { label: "Ask Price", value: "$195.93" },
      { label: "Last Trade", value: "$195.89" },
      { label: "Daily Volume", value: "45M shares" }
    ]
  },
  {
    id: 3,
    title: "Trade Execution",
    duration: 3.5,
    description: "Executing order in the market at target price",
    details: [
      "Trade ID: T-0001234",
      "Execution Price: $195.89",
      "Quantity: 50,000 shares",
      "Gross Value: $9,794,500",
      "Commission: $9,795 (10 bps)"
    ],
    dataAccess: [
      "Creating record in FACT_TRADES",
      "Linking to client dimension",
      "Linking to security dimension",
      "Linking to trader dimension",
      "Linking to date dimension"
    ],
    metrics: [
      { label: "Execution Price", value: "$195.89" },
      { label: "Gross Value", value: "$9,794,500" },
      { label: "Commission", value: "$9,795" }
    ]
  },
  {
    id: 4,
    title: "Portfolio Position Update",
    duration: 3,
    description: "Updating BlackRock's portfolio positions",
    details: [
      "Previous Position: 200,000 shares",
      "New Trade: +50,000 shares",
      "Total Position: 250,000 shares",
      "Avg Cost Basis: $175.25",
      "Market Value: $48,972,500"
    ],
    dataAccess: [
      "Updating FACT_POSITIONS table",
      "Aggregating existing holdings",
      "Calculating weighted average cost",
      "Computing unrealized P&L",
      "Triggering position alerts"
    ],
    metrics: [
      { label: "Total Position", value: "250,000 shares" },
      { label: "Market Value", value: "$48,972,500" },
      { label: "Unrealized P&L", value: "+$5,160,000" }
    ]
  },
  {
    id: 5,
    title: "Risk Management Assessment",
    duration: 4,
    description: "Calculating portfolio risk metrics",
    details: [
      "VaR Calculation Engine Active",
      "95% Confidence Level",
      "1-Day VaR: $2,150,000",
      "Sharpe Ratio: 1.25",
      "Portfolio Beta: 0.95"
    ],
    dataAccess: [
      "Updating FACT_RISK_METRICS",
      "Processing position changes",
      "Recalculating VaR metrics",
      "Updating Sharpe ratio",
      "Checking risk limits"
    ],
    metrics: [
      { label: "1-Day VaR (95%)", value: "$2,150,000" },
      { label: "Sharpe Ratio", value: "1.25" },
      { label: "Portfolio Beta", value: "0.95" },
      { label: "Max Drawdown", value: "8.5%" },
      { label: "Concentration Risk", value: "15%" }
    ]
  },
  {
    id: 6,
    title: "Settlement Processing",
    duration: 3,
    description: "Initiating T+2 settlement process",
    details: [
      "Transaction ID: TX-0001234",
      "Settlement: T+2 cycle",
      "Clearing: DTCC",
      "Status: Pending",
      "Settlement Date: June 16, 2025"
    ],
    dataAccess: [
      "Creating FACT_TRANSACTIONS record",
      "Interfacing with DTCC",
      "Recording counterparty details",
      "Managing settlement workflow",
      "Monitoring settlement status"
    ],
    metrics: [
      { label: "Gross Amount", value: "$9,275,000" },
      { label: "Settlement Cycle", value: "T+2" },
      { label: "Status", value: "Pending" }
    ]
  },
  {
    id: 7,
    title: "Final Settlement",
    duration: 4,
    description: "Completing settlement and regulatory reporting",
    details: [
      "Settlement Date: June 16, 2025",
      "Status: Settled",
      "Securities Delivered: 50,000 shares",
      "Cash Debited: $9,265,725",
      "Regulatory Reports: Complete"
    ],
    dataAccess: [
      "Updating settlement status",
      "Confirming securities delivery",
      "Processing cash movement",
      "FINRA reporting complete",
      "SEC reporting complete"
    ],
    metrics: [
      { label: "Net Amount", value: "$9,265,725" },
      { label: "Shares Delivered", value: "50,000" },
      { label: "Status", value: "Settled" },
      { label: "Reports Filed", value: "FINRA, SEC" }
    ]
  }
];

const OrderLifecycleAnimation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = orderSteps.reduce((acc, step) => acc + step.duration, 0);

  // Set ready state after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPlaying && currentStep < orderSteps.length) {
      const currentStepData = orderSteps[currentStep];
      const stepDuration = currentStepData.duration * 1000; // Convert to milliseconds
      
      // Update progress every 100ms
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / stepDuration) * 100;
          if (newProgress >= 100) {
            return 100;
          }
          return newProgress;
        });
        setElapsedTime(prev => prev + 0.1);
      }, 100);

      // Move to next step after duration
      stepTimerRef.current = setTimeout(() => {
        if (currentStep < orderSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
        }
      }, stepDuration);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [isPlaying, currentStep]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
    setElapsedTime(0);
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <Card>
      <Box p="4">
        <Flex justify="between" align="center" mb="4">
          <Box>
            <Heading size="5" mb="2">Investment Banking Order Lifecycle</Heading>
            <Text color="gray" size="2">
              Follow the complete lifecycle of a $9.3M institutional equity order from BlackRock
            </Text>
          </Box>
          <Flex gap="2">
            <Button 
              onClick={handlePlayPause} 
              variant={isPlaying ? "soft" : "solid"}
              color="ruby"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={handleReset} variant="soft">
              <ResetIcon />
              Reset
            </Button>
          </Flex>
        </Flex>

        {/* Progress Timeline */}
        <Box mb="6">
          <Flex gap="1" mb="3">
            {orderSteps.map((step, index) => (
              <Box 
                key={step.id}
                style={{ 
                  flex: 1, 
                  cursor: 'pointer',
                  opacity: index <= currentStep ? 1 : 0.5
                }}
                onClick={() => handleStepClick(index)}
              >
                <Flex direction="column" align="center" gap="2">
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      backgroundColor: index < currentStep ? 'var(--green-9)' : 
                                     index === currentStep ? 'var(--ruby-9)' : 'var(--gray-6)',
                      transform: index === currentStep ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {index < currentStep ? <CheckCircledIcon /> : step.id}
                  </Box>
                  <Text size="1" align="center" weight={index === currentStep ? "bold" : "regular"}>
                    {step.title}
                  </Text>
                </Flex>
              </Box>
            ))}
          </Flex>

          {/* Step Progress Bar */}
          <Progress value={progress} size="3" color="ruby" />
          
          <Flex justify="between" mt="2">
            <Text size="2" color="gray">
              Step {currentStep + 1} of {orderSteps.length}
            </Text>
            <Flex align="center" gap="2">
              <ClockIcon />
              <Text size="2" color="gray">
                {elapsedTime.toFixed(1)}s / {totalDuration}s
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* Current Step Details */}
        <AnimatePresence mode="wait">
          {isReady && currentStep < orderSteps.length && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Grid columns={{ initial: '1', md: '3' }} gap="4">
                {/* Step Overview */}
                <Card style={{ backgroundColor: 'var(--gray-2)' }}>
                  <Box p="4">
                    <Badge color="ruby" size="2" mb="3">{orderSteps[currentStep].title}</Badge>
                    <Heading size="4" mb="3">{orderSteps[currentStep].description}</Heading>
                    
                    <Box>
                      {orderSteps[currentStep].details.map((detail, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.15 }}
                        >
                          <Flex align="center" gap="2" mb="2">
                            <Box style={{ 
                              width: 6, 
                              height: 6, 
                              backgroundColor: 'var(--ruby-9)', 
                              borderRadius: '50%' 
                            }} />
                            <Text size="2">{detail}</Text>
                          </Flex>
                        </motion.div>
                      ))}
                    </Box>
                  </Box>
                </Card>

                {/* Data Access */}
                <Card style={{ backgroundColor: 'var(--gray-2)' }}>
                  <Box p="4">
                    <Badge color="blue" size="2" mb="3">System Activity</Badge>
                    <Heading size="4" mb="3">Data Operations</Heading>
                    
                    <Box>
                      {orderSteps[currentStep].dataAccess.map((access, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.15 }}
                        >
                          <Flex align="center" gap="2" mb="2">
                            <Box
                              style={{ 
                                width: 8, 
                                height: 8, 
                                border: '2px solid var(--blue-9)', 
                                borderTop: '2px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}
                            />
                            <Text size="2" color="blue">{access}</Text>
                          </Flex>
                        </motion.div>
                      ))}
                    </Box>
                  </Box>
                </Card>

                {/* Metrics */}
                {orderSteps[currentStep].metrics && (
                  <Card style={{ backgroundColor: 'var(--gray-2)' }}>
                    <Box p="4">
                      <Badge color="green" size="2" mb="3">Key Metrics</Badge>
                      <Heading size="4" mb="3">Real-time Values</Heading>
                      
                      <Box>
                        {orderSteps[currentStep].metrics.map((metric, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                          >
                            <Box mb="3">
                              <Text size="1" color="gray">{metric.label}</Text>
                              <Text size="4" weight="bold" color="green">
                                {metric.value}
                              </Text>
                            </Box>
                            {orderSteps[currentStep].metrics && index < orderSteps[currentStep].metrics!.length - 1 && (
                              <Separator size="4" />
                            )}
                          </motion.div>
                        ))}
                      </Box>
                    </Box>
                  </Card>
                )}
              </Grid>

              {/* Data Flow Diagram */}
              <Box mt="4">
                <Suspense fallback={
                  <Card style={{ backgroundColor: 'var(--gray-2)' }}>
                    <Box p="4">
                      <Text color="gray">Loading data flow visualization...</Text>
                    </Box>
                  </Card>
                }>
                  <DataFlowDiagram currentStep={currentStep} />
                </Suspense>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default OrderLifecycleAnimation;
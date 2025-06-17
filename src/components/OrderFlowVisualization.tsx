import React from 'react';
import { Box, Tabs } from '@radix-ui/themes';
import OrderLifecycleAnimation from './OrderLifecycleAnimation';
import { EquityTransactionShowcase } from './EquityTransactionShowcase';

const OrderFlowVisualization: React.FC = () => {

  return (
    <Box>
      <Tabs.Root defaultValue="lifecycle">
        <Tabs.List mb="4">
          <Tabs.Trigger value="lifecycle">Order Lifecycle Process</Tabs.Trigger>
          <Tabs.Trigger value="showcase">Equity Transaction Demo</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="lifecycle">
          <OrderLifecycleAnimation />
        </Tabs.Content>
        
        <Tabs.Content value="showcase">
          <EquityTransactionShowcase />
        </Tabs.Content>
  </Tabs.Root>
  </Box>
  );
};

export default OrderFlowVisualization;
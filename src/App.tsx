import React, { useState } from 'react';
import { Theme, Container, Tabs, Box, Heading } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderFlowVisualization from '@/components/OrderFlowVisualization';
import QueryInterface from '@/components/QueryInterface';
import DataStructureManager from '@/components/DataStructureManager';
import DashboardOverview from '@/components/DashboardOverview';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <Theme 
        accentColor="ruby" 
        grayColor="gray" 
        radius="medium" 
        appearance="dark"
        panelBackground="solid"
      >
        <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)' }}>
          <Box style={{ 
            backgroundColor: 'var(--gray-2)', 
            borderBottom: '1px solid var(--gray-6)',
            padding: 'var(--space-4)'
          }}>
            <Container size="4">
              <Heading size="6" weight="bold" style={{ marginBottom: 'var(--space-4)' }}>
                Financial Trading Insights Platform
              </Heading>
              
              <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                <Tabs.List size="2">
                  <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
                  <Tabs.Trigger value="orderflow">Order Flow</Tabs.Trigger>
                  <Tabs.Trigger value="query">Query Analysis</Tabs.Trigger>
                  <Tabs.Trigger value="structure">Data Structure</Tabs.Trigger>
                </Tabs.List>
              </Tabs.Root>
            </Container>
          </Box>

          <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'orderflow' && <OrderFlowVisualization />}
            {activeTab === 'query' && <QueryInterface />}
            {activeTab === 'structure' && <DataStructureManager />}
          </Container>
        </Box>
      </Theme>
    </QueryClientProvider>
  );
}

export default App;
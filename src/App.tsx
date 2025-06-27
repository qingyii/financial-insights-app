import { useState } from 'react';
import { Theme, Container, Tabs, Box, Heading, Flex, IconButton } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import OrderFlowVisualization from '@/components/OrderFlowVisualization';
import QueryInterface from '@/components/QueryInterface';
import DataStructureManager from '@/components/DataStructureManager';
import DashboardOverview from '@/components/DashboardOverview';
import { AssetClassEducation } from '@/components/AssetClassEducation';
import { AIProductPortfolio } from '@/components/AIProductPortfolio';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

const queryClient = new QueryClient();

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { theme, toggleTheme } = useTheme();

  return (
    <Theme 
      accentColor="ruby" 
      grayColor="gray" 
      radius="medium" 
      appearance={theme}
      panelBackground="solid"
    >
      <Box style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)' }}>
        <Box style={{ 
          backgroundColor: 'var(--gray-2)', 
          borderBottom: '1px solid var(--gray-6)',
          padding: 'var(--space-4)'
        }}>
          <Container size="4">
            <Flex align="center" justify="between" style={{ marginBottom: 'var(--space-4)' }}>
              <Flex align="center" gap="3">
                <Box style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, var(--ruby-9) 0%, var(--ruby-11) 100%)',
                  borderRadius: 'var(--radius-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  FI
                </Box>
                <Heading size="6" weight="bold">
                  Financial Trading Insights Platform
                </Heading>
              </Flex>
              
              <IconButton
                size="3"
                variant="ghost"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? <SunIcon width="20" height="20" /> : <MoonIcon width="20" height="20" />}
              </IconButton>
            </Flex>
            
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List size="2">
                <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
                <Tabs.Trigger value="orderflow">Order Flow</Tabs.Trigger>
                <Tabs.Trigger value="query">Query Analysis</Tabs.Trigger>
                <Tabs.Trigger value="structure">Data Structure</Tabs.Trigger>
                <Tabs.Trigger value="education">Asset Classes</Tabs.Trigger>
                <Tabs.Trigger value="portfolio">Case Studies</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Container>
          </Box>

          <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'orderflow' && <OrderFlowVisualization />}
            {activeTab === 'query' && <QueryInterface />}
            {activeTab === 'structure' && <DataStructureManager />}
            {activeTab === 'education' && <AssetClassEducation />}
            {activeTab === 'portfolio' && <AIProductPortfolio />}
          </Container>
        </Box>
      </Theme>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
import React from 'react';
import { Box, Card, Heading, Text, Grid, Badge, Table, Flex } from '@radix-ui/themes';
import { SecurityType } from '@/models/types';

interface AssetClassInfo {
  type: SecurityType;
  name: string;
  description: string;
  orderFlow: string[];
  keyAttributes: Record<string, string>;
  example: string;
  color: string;
}

const assetClasses: AssetClassInfo[] = [
  {
    type: SecurityType.EQUITY,
    name: 'Equity',
    description: 'Ownership shares in a company, representing a claim on assets and earnings.',
    orderFlow: [
      '1. Order Placement: Buy/Sell order with quantity and price',
      '2. Order Routing: Sent to exchange or dark pool',
      '3. Matching: Order book matching with contra-side',
      '4. Execution: Trade executed at agreed price',
      '5. Clearing: Trade details sent to clearinghouse',
      '6. Settlement: T+2 settlement cycle'
    ],
    keyAttributes: {
      'Symbol': 'AAPL.O, MSFT.O',
      'Trading Hours': '9:30 AM - 4:00 PM ET',
      'Settlement': 'T+2',
      'Tick Size': '$0.01'
    },
    example: 'Buy 1000 shares of AAPL at $195.50',
    color: 'blue'
  },
  {
    type: SecurityType.BOND,
    name: 'Fixed Income Bond',
    description: 'Debt securities where investors loan money to entities for a defined period at fixed interest rates.',
    orderFlow: [
      '1. RFQ: Request for Quote sent to dealers',
      '2. Quote Collection: Multiple dealer quotes received',
      '3. Negotiation: Price/yield negotiation',
      '4. Trade Confirmation: Terms agreed and confirmed',
      '5. Allocation: For block trades, allocation to accounts',
      '6. Settlement: T+1 or T+2 settlement'
    ],
    keyAttributes: {
      'ISIN/CUSIP': 'US912828YK47',
      'Maturity': '2-30 years',
      'Settlement': 'T+1 or T+2',
      'Min Size': '$1,000 face value'
    },
    example: 'Buy $1M US Treasury 10Y at 4.25% yield',
    color: 'green'
  },
  {
    type: SecurityType.OPTION,
    name: 'Options',
    description: 'Derivatives giving the right, but not obligation, to buy/sell an underlying asset at a specific price.',
    orderFlow: [
      '1. Strategy Selection: Choose option strategy',
      '2. Strike/Expiry Selection: Select strike price and expiration',
      '3. Order Entry: Specify contract quantity',
      '4. Market Making: Market makers provide liquidity',
      '5. Execution: Trade executed on options exchange',
      '6. Settlement: T+1 for premium, exercise settlement varies'
    ],
    keyAttributes: {
      'Underlying': 'Stock, Index, ETF',
      'Contract Size': '100 shares',
      'Settlement': 'T+1 premium',
      'Exercise': 'American/European'
    },
    example: 'Buy 10 AAPL Dec 200 Calls at $5.50',
    color: 'purple'
  },
  {
    type: SecurityType.FUTURE,
    name: 'Futures',
    description: 'Standardized contracts to buy/sell an asset at a future date at a predetermined price.',
    orderFlow: [
      '1. Margin Posting: Initial margin requirement',
      '2. Order Placement: Buy/Sell futures contracts',
      '3. Exchange Matching: CME/ICE order matching',
      '4. Mark-to-Market: Daily P&L settlement',
      '5. Margin Calls: Variation margin if needed',
      '6. Expiry: Physical delivery or cash settlement'
    ],
    keyAttributes: {
      'Exchange': 'CME, ICE, EUREX',
      'Margin': '5-15% initial',
      'Settlement': 'Daily MTM',
      'Delivery': 'Physical/Cash'
    },
    example: 'Buy 5 ES (S&P 500) Mar futures at 4,850',
    color: 'orange'
  },
  {
    type: SecurityType.FX_SPOT,
    name: 'FX Spot',
    description: 'Immediate exchange of one currency for another at current market rates.',
    orderFlow: [
      '1. Price Discovery: Check multiple liquidity providers',
      '2. Order Placement: Buy/Sell currency pair',
      '3. Execution: Match with counterparty',
      '4. Confirmation: Trade details confirmed',
      '5. Netting: Net positions if applicable',
      '6. Settlement: T+2 standard settlement'
    ],
    keyAttributes: {
      'Pairs': 'EUR/USD, USD/JPY',
      'Market Hours': '24/5',
      'Settlement': 'T+2',
      'Min Size': '$100,000'
    },
    example: 'Buy EUR 1M vs USD at 1.0850',
    color: 'teal'
  },
  {
    type: SecurityType.SWAP,
    name: 'Interest Rate Swap',
    description: 'Derivative contract to exchange fixed for floating interest rate payments.',
    orderFlow: [
      '1. Term Negotiation: Notional, tenor, rates',
      '2. Credit Check: Counterparty credit approval',
      '3. Documentation: ISDA agreement review',
      '4. Trade Execution: Confirm swap terms',
      '5. Confirmation: Legal confirmation process',
      '6. Collateral: Post initial margin if required'
    ],
    keyAttributes: {
      'Tenor': '2Y-30Y',
      'Notional': '$10M minimum',
      'Reset': 'Quarterly/Semi',
      'Day Count': 'ACT/360'
    },
    example: 'Pay Fixed 3.5% vs 3M LIBOR on $50M for 5Y',
    color: 'indigo'
  }
];

export const AssetClassEducation: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = React.useState<AssetClassInfo>(assetClasses[0]);

  return (
    <Box>
      <Heading size="6" mb="4">Asset Class Order Flow Education</Heading>
      
      <Grid columns={{ initial: '1', md: '3' }} gap="4" mb="4">
        {assetClasses.map((asset) => (
          <Card
            key={asset.type}
            style={{ 
              cursor: 'pointer',
              border: selectedAsset.type === asset.type ? `2px solid var(--${asset.color}-9)` : undefined
            }}
            onClick={() => setSelectedAsset(asset)}
          >
            <Flex direction="column" gap="2">
              <Badge color={asset.color as any} size="2">{asset.name}</Badge>
              <Text size="1" style={{ lineHeight: 1.5 }}>{asset.description}</Text>
            </Flex>
          </Card>
        ))}
      </Grid>

      <Card size="3">
        <Heading size="5" mb="3" color={selectedAsset.color as any}>
          {selectedAsset.name} Trading Workflow
        </Heading>
        
        <Grid columns={{ initial: '1', md: '2' }} gap="4">
          <Box>
            <Heading size="3" mb="2">Order Flow Process</Heading>
            <Box>
              {selectedAsset.orderFlow.map((step, index) => (
                <Flex key={index} gap="2" mb="2" align="start">
                  <Badge variant="soft" color={selectedAsset.color as any} style={{ minWidth: '30px' }}>
                    {index + 1}
                  </Badge>
                  <Text size="2" style={{ flex: 1 }}>{step.replace(/^\d+\.\s*/, '')}</Text>
                </Flex>
              ))}
            </Box>
          </Box>

          <Box>
            <Heading size="3" mb="2">Key Attributes</Heading>
            <Table.Root size="1">
              <Table.Body>
                {Object.entries(selectedAsset.keyAttributes).map(([key, value]) => (
                  <Table.Row key={key}>
                    <Table.Cell style={{ fontWeight: 500 }}>{key}</Table.Cell>
                    <Table.Cell>{value}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
            
            <Box mt="3" p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }}>
              <Text size="1" weight="medium">Example Order:</Text>
              <Text size="2" mt="1">{selectedAsset.example}</Text>
            </Box>
          </Box>
        </Grid>
      </Card>
    </Box>
  );
};
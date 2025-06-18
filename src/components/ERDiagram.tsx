import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Card, Text, Heading, Badge, Flex } from '@radix-ui/themes';

interface TableColumn {
  name: string;
  type: 'PK' | 'FK' | 'M' | 'NK' | 'attr';
}

interface TableNodeData {
  name: string;
  columns: string[];
  type: 'fact' | 'dimension';
}

const parseColumn = (columnStr: string): TableColumn => {
  if (columnStr.includes('(PK)')) {
    return { name: columnStr.replace(' (PK)', ''), type: 'PK' };
  } else if (columnStr.includes('(FK)')) {
    return { name: columnStr.replace(' (FK)', ''), type: 'FK' };
  } else if (columnStr.includes('(M)')) {
    return { name: columnStr.replace(' (M)', ''), type: 'M' };
  } else if (columnStr.includes('(NK)')) {
    return { name: columnStr.replace(' (NK)', ''), type: 'NK' };
  }
  return { name: columnStr, type: 'attr' };
};

const getColumnBadgeColor = (type: TableColumn['type']) => {
  switch (type) {
    case 'PK': return 'ruby';
    case 'FK': return 'blue';
    case 'M': return 'green';
    case 'NK': return 'amber';
    default: return 'gray';
  }
};

const getColumnBadgeLabel = (type: TableColumn['type']) => {
  switch (type) {
    case 'PK': return 'PK';
    case 'FK': return 'FK';
    case 'M': return 'M';
    case 'NK': return 'NK';
    default: return '';
  }
};

const TableNode = ({ data }: { data: TableNodeData }) => {
  const parsedColumns = data.columns.map(parseColumn);
  
  return (
    <Card 
      style={{ 
        minWidth: 280,
        border: data.type === 'fact' ? '2px solid var(--ruby-8)' : '2px solid var(--blue-8)',
        backgroundColor: 'var(--gray-2)'
      }}
    >
      <Box p="3">
        <Flex align="center" gap="2" mb="3">
          <Heading size="3" weight="bold" color={data.type === 'fact' ? 'ruby' : 'blue'}>
            {data.name}
          </Heading>
          <Badge color={data.type === 'fact' ? 'ruby' : 'blue'} variant="soft">
            {data.type === 'fact' ? 'FACT' : 'DIM'}
          </Badge>
        </Flex>
        
        <Box>
          {parsedColumns.map((column, index) => (
            <Flex key={index} align="center" gap="2" mb="1" style={{ fontSize: '12px' }}>
              {column.type !== 'attr' && (
                <Badge 
                  size="1" 
                  color={getColumnBadgeColor(column.type)}
                  variant="solid"
                >
                  {getColumnBadgeLabel(column.type)}
                </Badge>
              )}
              <Text 
                size="1" 
                weight={column.type === 'PK' ? 'bold' : 'regular'}
                color={column.type === 'PK' ? 'ruby' : column.type === 'FK' ? 'blue' : undefined}
              >
                {column.name}
              </Text>
            </Flex>
          ))}
        </Box>
      </Box>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const ERDiagram: React.FC = () => {
  const factTables = [
    {
      id: 'fact_trades',
      name: 'FACT_TRADES',
      x: 500, y: 200,
      columns: [
        'trade_fact_id (PK)', 'client_key (FK)', 'security_key (FK)', 
        'trader_key (FK)', 'trade_date_key (FK)', 'quantity (M)', 
        'price (M)', 'gross_amount (M)', 'commission (M)', 'unrealized_pnl (M)'
      ]
    },
    {
      id: 'fact_positions',
      name: 'FACT_POSITIONS',
      x: 800, y: 400,
      columns: [
        'position_fact_id (PK)', 'client_key (FK)', 'security_key (FK)',
        'position_date_key (FK)', 'quantity (M)', 'market_value (M)',
        'unrealized_pnl (M)', 'day_pnl (M)', 'position_delta (M)'
      ]
    },
    {
      id: 'fact_market_data',
      name: 'FACT_MARKET_DATA',
      x: 200, y: 400,
      columns: [
        'market_fact_id (PK)', 'security_key (FK)', 'date_key (FK)',
        'time_key (FK)', 'open_price (M)', 'close_price (M)',
        'volume (M)', 'volatility_30d (M)', 'beta (M)'
      ]
    },
    {
      id: 'fact_risk_metrics',
      name: 'FACT_RISK_METRICS',
      x: 500, y: 600,
      columns: [
        'risk_fact_id (PK)', 'client_key (FK)', 'portfolio_key (FK)',
        'risk_date_key (FK)', 'portfolio_value (M)', 'var_1d_95 (M)',
        'sharpe_ratio (M)', 'max_drawdown (M)'
      ]
    },
    {
      id: 'fact_transactions',
      name: 'FACT_TRANSACTIONS',
      x: 800, y: 200,
      columns: [
        'transaction_fact_id (PK)', 'trade_key (FK)', 'client_key (FK)',
        'settlement_date_key (FK)', 'currency_key (FK)', 'gross_amount (M)',
        'fees (M)', 'net_amount (M)', 'fx_rate (M)'
      ]
    }
  ];

  const dimensionTables = [
    {
      id: 'dim_client',
      name: 'DIM_CLIENT',
      x: 100, y: 100,
      columns: [
        'client_key (PK)', 'client_id (NK)', 'client_name', 'client_type',
        'industry_sector', 'geography', 'risk_rating', 'aum_usd',
        'relationship_manager', 'scd_current_flag'
      ]
    },
    {
      id: 'dim_security',
      name: 'DIM_SECURITY',
      x: 300, y: 750,
      columns: [
        'security_key (PK)', 'security_id (NK)', 'symbol', 'security_name',
        'asset_class', 'sector', 'currency', 'exchange', 'credit_rating'
      ]
    },
    {
      id: 'dim_trader',
      name: 'DIM_TRADER',
      x: 1000, y: 100,
      columns: [
        'trader_key (PK)', 'trader_id (NK)', 'trader_name', 'desk_name',
        'business_unit', 'location', 'authorization_level', 'trading_limit'
      ]
    },
    {
      id: 'dim_date',
      name: 'DIM_DATE',
      x: 700, y: 750,
      columns: [
        'date_key (PK)', 'calendar_date (NK)', 'year', 'quarter', 'month',
        'day_of_week', 'is_business_day', 'fiscal_year'
      ]
    },
    {
      id: 'dim_counterparty',
      name: 'DIM_COUNTERPARTY',
      x: 1200, y: 300,
      columns: [
        'counterparty_key (PK)', 'counterparty_name', 'counterparty_type',
        'credit_rating', 'exposure_limit', 'geography', 'lei_code'
      ]
    },
    {
      id: 'dim_portfolio',
      name: 'DIM_PORTFOLIO',
      x: 100, y: 600,
      columns: [
        'portfolio_key (PK)', 'portfolio_name', 'strategy_type',
        'benchmark', 'portfolio_manager', 'base_currency', 'inception_date'
      ]
    },
    {
      id: 'dim_currency',
      name: 'DIM_CURRENCY',
      x: 1200, y: 500,
      columns: [
        'currency_key (PK)', 'currency_code (NK)', 'currency_name',
        'country', 'is_major_currency'
      ]
    },
    {
      id: 'dim_time',
      name: 'DIM_TIME',
      x: 100, y: 300,
      columns: [
        'time_key (PK)', 'hour', 'minute', 'market_session', 'is_market_open'
      ]
    }
  ];

  const relationships = [
    // Client relationships
    { from: 'dim_client', to: 'fact_trades', color: '#3B82F6' },
    { from: 'dim_client', to: 'fact_positions', color: '#3B82F6' },
    { from: 'dim_client', to: 'fact_risk_metrics', color: '#3B82F6' },
    { from: 'dim_client', to: 'fact_transactions', color: '#3B82F6' },
    
    // Security relationships
    { from: 'dim_security', to: 'fact_trades', color: '#10B981' },
    { from: 'dim_security', to: 'fact_positions', color: '#10B981' },
    { from: 'dim_security', to: 'fact_market_data', color: '#10B981' },
    
    // Date relationships
    { from: 'dim_date', to: 'fact_trades', color: '#F59E0B' },
    { from: 'dim_date', to: 'fact_positions', color: '#F59E0B' },
    { from: 'dim_date', to: 'fact_market_data', color: '#F59E0B' },
    { from: 'dim_date', to: 'fact_risk_metrics', color: '#F59E0B' },
    { from: 'dim_date', to: 'fact_transactions', color: '#F59E0B' },
    
    // Other relationships
    { from: 'dim_trader', to: 'fact_trades', color: '#8B5CF6' },
    { from: 'dim_counterparty', to: 'fact_trades', color: '#EF4444' },
    { from: 'dim_counterparty', to: 'fact_transactions', color: '#EF4444' },
    { from: 'dim_portfolio', to: 'fact_risk_metrics', color: '#06B6D4' },
    { from: 'dim_currency', to: 'fact_transactions', color: '#84CC16' },
    { from: 'dim_time', to: 'fact_market_data', color: '#F97316' }
  ];

  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    
    // Add fact tables
    factTables.forEach(table => {
      nodes.push({
        id: table.id,
        type: 'tableNode',
        position: { x: table.x, y: table.y },
        data: {
          name: table.name,
          columns: table.columns,
          type: 'fact'
        }
      });
    });
    
    // Add dimension tables
    dimensionTables.forEach(table => {
      nodes.push({
        id: table.id,
        type: 'tableNode',
        position: { x: table.x, y: table.y },
        data: {
          name: table.name,
          columns: table.columns,
          type: 'dimension'
        }
      });
    });
    
    return nodes;
  }, []);

  const initialEdges: Edge[] = useMemo(() => {
    return relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.from,
      target: rel.to,
      type: 'smoothstep',
      style: {
        stroke: rel.color,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: rel.color,
      } as any
    }));
  }, []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <Box>
      {/* Legend */}
      <Card mb="4" style={{ backgroundColor: 'var(--gray-2)' }}>
        <Box p="3">
          <Heading size="3" mb="3">Legend</Heading>
          <Flex gap="6" wrap="wrap">
            <Flex align="center" gap="2">
              <Badge size="1" color="ruby" variant="solid">PK</Badge>
              <Text size="2">Primary Key</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge size="1" color="blue" variant="solid">FK</Badge>
              <Text size="2">Foreign Key</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge size="1" color="green" variant="solid">M</Badge>
              <Text size="2">Measure</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge size="1" color="amber" variant="solid">NK</Badge>
              <Text size="2">Natural Key</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Box style={{ width: '12px', height: '2px', backgroundColor: 'var(--ruby-8)' }} />
              <Text size="2">Fact Table</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Box style={{ width: '12px', height: '2px', backgroundColor: 'var(--blue-8)' }} />
              <Text size="2">Dimension Table</Text>
            </Flex>
          </Flex>
        </Box>
      </Card>
      
      <Box style={{ width: '100%', height: '800px', border: '1px solid var(--gray-6)', borderRadius: 'var(--radius-3)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{
            backgroundColor: 'var(--gray-1)',
          }}
        >
          <Controls style={{ backgroundColor: 'var(--gray-3)', border: '1px solid var(--gray-6)' }} />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="var(--gray-6)"
          />
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default ERDiagram;
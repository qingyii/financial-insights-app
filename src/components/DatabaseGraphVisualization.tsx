import React, { useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Card, Text, Badge, Flex } from '@radix-ui/themes';
import { Link1Icon } from '@radix-ui/react-icons';

interface TableField {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
}

interface TableNodeData extends Record<string, any> {
  name: string;
  type: 'fact' | 'dimension';
  fields: TableField[];
  description: string;
}

const TableNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as TableNodeData;
  const nodeStyle = nodeData.type === 'fact' 
    ? { borderColor: 'var(--ruby-9)', backgroundColor: 'var(--ruby-2)' }
    : { borderColor: 'var(--blue-9)', backgroundColor: 'var(--blue-2)' };

  return (
    <Card 
      style={{
        ...nodeStyle,
        borderWidth: '2px',
        borderStyle: 'solid',
        minWidth: '250px',
        cursor: 'grab'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      
      <Flex align="center" gap="2" mb="2">
        <Text size="3" weight="bold">📊 {nodeData.name}</Text>
        <Badge color={nodeData.type === 'fact' ? 'ruby' : 'blue'} size="1">
          {nodeData.type}
        </Badge>
      </Flex>
      
      <Text size="1" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
        {nodeData.description}
      </Text>
      
      <Box style={{ 
        borderTop: '1px solid var(--gray-6)', 
        paddingTop: '8px',
        fontSize: '12px'
      }}>
        {nodeData.fields.slice(0, 5).map((field, idx) => (
          <Flex key={idx} gap="2" mb="1" align="center">
            {field.isPrimary && <Badge size="1" color="amber">PK</Badge>}
            {field.isForeign && <Badge size="1" color="green">FK</Badge>}
            <Text size="1" style={{ fontFamily: 'monospace' }}>
              {field.name}: {field.type}
            </Text>
          </Flex>
        ))}
        {nodeData.fields.length > 5 && (
          <Text size="1" color="gray">... and {nodeData.fields.length - 5} more fields</Text>
        )}
      </Box>
      
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </Card>
  );
};

const nodeTypes = {
  table: TableNode
};

export const DatabaseGraphVisualization: React.FC = () => {
  const initialNodes: Node<TableNodeData>[] = [
    {
      id: 'fact_trading_orders',
      type: 'table',
      position: { x: 400, y: 300 },
      data: {
        name: 'fact_trading_orders',
        type: 'fact',
        description: 'Central fact table containing all trading order transactions',
        fields: [
          { name: 'order_id', type: 'VARCHAR', isPrimary: true },
          { name: 'time_id', type: 'INTEGER', isForeign: true, references: 'dim_time' },
          { name: 'security_id', type: 'INTEGER', isForeign: true, references: 'dim_security' },
          { name: 'trader_id', type: 'INTEGER', isForeign: true, references: 'dim_trader' },
          { name: 'counterparty_id', type: 'INTEGER', isForeign: true, references: 'dim_counterparty' },
          { name: 'order_type_id', type: 'INTEGER', isForeign: true, references: 'dim_order_type' },
          { name: 'order_quantity', type: 'DECIMAL' },
          { name: 'order_price', type: 'DECIMAL' },
          { name: 'filled_quantity', type: 'DECIMAL' },
          { name: 'average_fill_price', type: 'DECIMAL' },
          { name: 'pnl', type: 'DECIMAL' }
        ]
      }
    },
    {
      id: 'dim_security',
      type: 'table',
      position: { x: 100, y: 50 },
      data: {
        name: 'dim_security',
        type: 'dimension',
        description: 'Security master data including stocks, bonds, derivatives',
        fields: [
          { name: 'security_id', type: 'INTEGER', isPrimary: true },
          { name: 'symbol', type: 'VARCHAR' },
          { name: 'security_name', type: 'VARCHAR' },
          { name: 'security_type', type: 'VARCHAR' },
          { name: 'exchange', type: 'VARCHAR' },
          { name: 'sector', type: 'VARCHAR' },
          { name: 'currency', type: 'VARCHAR' }
        ]
      }
    },
    {
      id: 'dim_trader',
      type: 'table',
      position: { x: 700, y: 50 },
      data: {
        name: 'dim_trader',
        type: 'dimension',
        description: 'Trader information and hierarchy',
        fields: [
          { name: 'trader_id', type: 'INTEGER', isPrimary: true },
          { name: 'trader_code', type: 'VARCHAR' },
          { name: 'trader_name', type: 'VARCHAR' },
          { name: 'desk', type: 'VARCHAR' },
          { name: 'department', type: 'VARCHAR' },
          { name: 'experience_level', type: 'VARCHAR' }
        ]
      }
    },
    {
      id: 'dim_time',
      type: 'table',
      position: { x: 100, y: 550 },
      data: {
        name: 'dim_time',
        type: 'dimension',
        description: 'Time dimension with trading calendar details',
        fields: [
          { name: 'time_id', type: 'INTEGER', isPrimary: true },
          { name: 'full_datetime', type: 'TIMESTAMP' },
          { name: 'date', type: 'DATE' },
          { name: 'hour', type: 'INTEGER' },
          { name: 'minute', type: 'INTEGER' },
          { name: 'is_trading_day', type: 'BOOLEAN' },
          { name: 'is_market_hours', type: 'BOOLEAN' }
        ]
      }
    },
    {
      id: 'dim_counterparty',
      type: 'table',
      position: { x: 700, y: 550 },
      data: {
        name: 'dim_counterparty',
        type: 'dimension',
        description: 'Counterparty and client information',
        fields: [
          { name: 'counterparty_id', type: 'INTEGER', isPrimary: true },
          { name: 'counterparty_code', type: 'VARCHAR' },
          { name: 'counterparty_name', type: 'VARCHAR' },
          { name: 'counterparty_type', type: 'VARCHAR' },
          { name: 'country', type: 'VARCHAR' },
          { name: 'credit_rating', type: 'VARCHAR' }
        ]
      }
    },
    {
      id: 'dim_order_type',
      type: 'table',
      position: { x: 400, y: 600 },
      data: {
        name: 'dim_order_type',
        type: 'dimension',
        description: 'Order types and execution strategies',
        fields: [
          { name: 'order_type_id', type: 'INTEGER', isPrimary: true },
          { name: 'order_type', type: 'VARCHAR' },
          { name: 'order_side', type: 'VARCHAR' },
          { name: 'time_in_force', type: 'VARCHAR' },
          { name: 'is_algorithmic', type: 'BOOLEAN' }
        ]
      }
    }
  ];

  const initialEdges: Edge[] = [
    {
      id: 'e1',
      source: 'dim_security',
      target: 'fact_trading_orders',
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--blue-9)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--blue-9)' },
      label: 'security_id',
      labelStyle: { fontSize: 12, fontWeight: 500 }
    },
    {
      id: 'e2',
      source: 'dim_trader',
      target: 'fact_trading_orders',
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--blue-9)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--blue-9)' },
      label: 'trader_id',
      labelStyle: { fontSize: 12, fontWeight: 500 }
    },
    {
      id: 'e3',
      source: 'dim_time',
      target: 'fact_trading_orders',
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--blue-9)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--blue-9)' },
      label: 'time_id',
      labelStyle: { fontSize: 12, fontWeight: 500 }
    },
    {
      id: 'e4',
      source: 'dim_counterparty',
      target: 'fact_trading_orders',
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--blue-9)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--blue-9)' },
      label: 'counterparty_id',
      labelStyle: { fontSize: 12, fontWeight: 500 }
    },
    {
      id: 'e5',
      source: 'dim_order_type',
      target: 'fact_trading_orders',
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--blue-9)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--blue-9)' },
      label: 'order_type_id',
      labelStyle: { fontSize: 12, fontWeight: 500 }
    }
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  return (
    <Box style={{ height: '700px', backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-3)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>
      
      <Box p="3" style={{ backgroundColor: 'var(--gray-1)', borderRadius: '0 0 var(--radius-3) var(--radius-3)' }}>
        <Flex gap="4" align="center">
          <Flex align="center" gap="2">
            <Link1Icon />
            <Text size="2" weight="medium">Star Schema Relationships</Text>
          </Flex>
          <Badge color="ruby">1 Fact Table</Badge>
          <Badge color="blue">5 Dimension Tables</Badge>
          <Text size="2" color="gray">Click and drag to explore the data model</Text>
        </Flex>
      </Box>
    </Box>
  );
};
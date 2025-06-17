import React, { useEffect, useState } from 'react';
import { Box, Card, Text, Heading, Badge, Flex, Tabs, Callout } from '@radix-ui/themes';
import { InfoCircledIcon, TableIcon, Link2Icon } from '@radix-ui/react-icons';
import * as d3 from 'd3';

interface TableColumn {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
  references?: string;
}

interface Table {
  name: string;
  type: 'fact' | 'dimension' | 'view';
  columns: TableColumn[];
  x?: number;
  y?: number;
}

interface Relationship {
  source: string;
  target: string;
  sourceColumn: string;
  targetColumn: string;
}

const ERDiagramWithRelationships: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<Relationship | null>(null);

  // Define the star schema tables
  const tables: Table[] = [
    {
      name: 'fact_trading_orders',
      type: 'fact',
      columns: [
        { name: 'order_id', type: 'VARCHAR(20)', isPK: true },
        { name: 'time_id', type: 'INTEGER', isFK: true, references: 'dim_time' },
        { name: 'security_id', type: 'INTEGER', isFK: true, references: 'dim_security' },
        { name: 'trader_id', type: 'INTEGER', isFK: true, references: 'dim_trader' },
        { name: 'counterparty_id', type: 'INTEGER', isFK: true, references: 'dim_counterparty' },
        { name: 'order_type_id', type: 'INTEGER', isFK: true, references: 'dim_order_type' },
        { name: 'order_quantity', type: 'DECIMAL(15,2)' },
        { name: 'order_price', type: 'DECIMAL(15,4)' },
        { name: 'filled_quantity', type: 'DECIMAL(15,2)' },
        { name: 'average_fill_price', type: 'DECIMAL(15,4)' },
        { name: 'order_status', type: 'VARCHAR(20)' },
        { name: 'pnl', type: 'DECIMAL(15,2)' }
      ]
    },
    {
      name: 'dim_security',
      type: 'dimension',
      columns: [
        { name: 'security_id', type: 'INTEGER', isPK: true },
        { name: 'symbol', type: 'VARCHAR(20)' },
        { name: 'security_name', type: 'VARCHAR(100)' },
        { name: 'security_type', type: 'VARCHAR(20)' },
        { name: 'exchange', type: 'VARCHAR(10)' },
        { name: 'sector', type: 'VARCHAR(50)' },
        { name: 'currency', type: 'VARCHAR(3)' }
      ]
    },
    {
      name: 'dim_trader',
      type: 'dimension',
      columns: [
        { name: 'trader_id', type: 'INTEGER', isPK: true },
        { name: 'trader_code', type: 'VARCHAR(10)' },
        { name: 'trader_name', type: 'VARCHAR(100)' },
        { name: 'desk', type: 'VARCHAR(50)' },
        { name: 'department', type: 'VARCHAR(50)' },
        { name: 'experience_level', type: 'VARCHAR(20)' }
      ]
    },
    {
      name: 'dim_time',
      type: 'dimension',
      columns: [
        { name: 'time_id', type: 'INTEGER', isPK: true },
        { name: 'date', type: 'DATE' },
        { name: 'time', type: 'TIME' },
        { name: 'hour', type: 'INTEGER' },
        { name: 'day_of_week', type: 'VARCHAR(10)' },
        { name: 'month', type: 'INTEGER' },
        { name: 'quarter', type: 'INTEGER' },
        { name: 'year', type: 'INTEGER' }
      ]
    },
    {
      name: 'dim_counterparty',
      type: 'dimension',
      columns: [
        { name: 'counterparty_id', type: 'INTEGER', isPK: true },
        { name: 'counterparty_code', type: 'VARCHAR(20)' },
        { name: 'counterparty_name', type: 'VARCHAR(100)' },
        { name: 'counterparty_type', type: 'VARCHAR(20)' },
        { name: 'country', type: 'VARCHAR(50)' },
        { name: 'credit_rating', type: 'VARCHAR(10)' }
      ]
    },
    {
      name: 'dim_order_type',
      type: 'dimension',
      columns: [
        { name: 'order_type_id', type: 'INTEGER', isPK: true },
        { name: 'order_type', type: 'VARCHAR(20)' },
        { name: 'order_side', type: 'VARCHAR(10)' },
        { name: 'time_in_force', type: 'VARCHAR(10)' },
        { name: 'is_algorithmic', type: 'BOOLEAN' }
      ]
    }
  ];

  // Define relationships
  const relationships: Relationship[] = [
    { source: 'fact_trading_orders', target: 'dim_time', sourceColumn: 'time_id', targetColumn: 'time_id' },
    { source: 'fact_trading_orders', target: 'dim_security', sourceColumn: 'security_id', targetColumn: 'security_id' },
    { source: 'fact_trading_orders', target: 'dim_trader', sourceColumn: 'trader_id', targetColumn: 'trader_id' },
    { source: 'fact_trading_orders', target: 'dim_counterparty', sourceColumn: 'counterparty_id', targetColumn: 'counterparty_id' },
    { source: 'fact_trading_orders', target: 'dim_order_type', sourceColumn: 'order_type_id', targetColumn: 'order_type_id' }
  ];

  useEffect(() => {
    drawERDiagram();
  }, []);

  const drawERDiagram = () => {
    const svg = d3.select('#er-diagram-svg');
    svg.selectAll('*').remove();

    const width = 1200;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    // Position tables in star schema layout
    const factTable = tables.find(t => t.type === 'fact');
    if (factTable) {
      factTable.x = centerX;
      factTable.y = centerY;
    }

    // Position dimension tables around the fact table
    const dimTables = tables.filter(t => t.type === 'dimension');
    const radius = 300;
    dimTables.forEach((table, i) => {
      const angle = (i * 2 * Math.PI) / dimTables.length - Math.PI / 2;
      table.x = centerX + radius * Math.cos(angle);
      table.y = centerY + radius * Math.sin(angle);
    });

    // Draw relationships (lines)
    const g = svg.append('g');
    
    relationships.forEach(rel => {
      const sourceTable = tables.find(t => t.name === rel.source);
      const targetTable = tables.find(t => t.name === rel.target);
      
      if (sourceTable && targetTable) {
        const line = g.append('line')
          .attr('x1', sourceTable.x!)
          .attr('y1', sourceTable.y!)
          .attr('x2', targetTable.x!)
          .attr('y2', targetTable.y!)
          .attr('stroke', 'var(--gray-7)')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredRelation(rel))
          .on('mouseleave', () => setHoveredRelation(null));

        // Add arrowhead
        const angle = Math.atan2(targetTable.y! - sourceTable.y!, targetTable.x! - sourceTable.x!);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        g.append('line')
          .attr('x1', targetTable.x! - 100 * Math.cos(angle))
          .attr('y1', targetTable.y! - 100 * Math.sin(angle))
          .attr('x2', targetTable.x! - 100 * Math.cos(angle) - arrowLength * Math.cos(angle - arrowAngle))
          .attr('y2', targetTable.y! - 100 * Math.sin(angle) - arrowLength * Math.sin(angle - arrowAngle))
          .attr('stroke', 'var(--gray-7)')
          .attr('stroke-width', 2);
          
        g.append('line')
          .attr('x1', targetTable.x! - 100 * Math.cos(angle))
          .attr('y1', targetTable.y! - 100 * Math.sin(angle))
          .attr('x2', targetTable.x! - 100 * Math.cos(angle) - arrowLength * Math.cos(angle + arrowAngle))
          .attr('y2', targetTable.y! - 100 * Math.sin(angle) - arrowLength * Math.sin(angle + arrowAngle))
          .attr('stroke', 'var(--gray-7)')
          .attr('stroke-width', 2);
      }
    });

    // Draw tables
    tables.forEach(table => {
      const tableGroup = g.append('g')
        .attr('transform', `translate(${table.x! - 120}, ${table.y! - 80})`)
        .style('cursor', 'pointer')
        .on('click', () => setSelectedTable(table.name));

      // Table background
      tableGroup.append('rect')
        .attr('width', 240)
        .attr('height', 160)
        .attr('rx', 8)
        .attr('fill', 'var(--gray-2)')
        .attr('stroke', table.type === 'fact' ? 'var(--ruby-9)' : 'var(--blue-9)')
        .attr('stroke-width', 2);

      // Table header
      tableGroup.append('rect')
        .attr('width', 240)
        .attr('height', 40)
        .attr('rx', 8)
        .attr('fill', table.type === 'fact' ? 'var(--ruby-9)' : 'var(--blue-9)');

      // Table name
      tableGroup.append('text')
        .attr('x', 120)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .text(table.name);

      // Show key columns
      const keyColumns = table.columns.filter(c => c.isPK || c.isFK).slice(0, 4);
      keyColumns.forEach((col, i) => {
        tableGroup.append('text')
          .attr('x', 10)
          .attr('y', 60 + i * 20)
          .attr('font-size', '12px')
          .attr('fill', col.isPK ? 'var(--ruby-11)' : 'var(--blue-11)')
          .text(`${col.isPK ? '🔑' : '🔗'} ${col.name}`);
      });

      // Column count
      tableGroup.append('text')
        .attr('x', 120)
        .attr('y', 145)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', 'var(--gray-11)')
        .text(`${table.columns.length} columns`);
    });
  };

  return (
    <Box>
      <Tabs.Root defaultValue="diagram">
        <Tabs.List mb="4">
          <Tabs.Trigger value="diagram">
            <Link2Icon width="16" height="16" style={{ marginRight: '4px' }} />
            ER Diagram with Relationships
          </Tabs.Trigger>
          <Tabs.Trigger value="views">
            <TableIcon width="16" height="16" style={{ marginRight: '4px' }} />
            Understanding Views
          </Tabs.Trigger>
          <Tabs.Trigger value="column-selection">
            <InfoCircledIcon width="16" height="16" style={{ marginRight: '4px' }} />
            Column Selection Strategy
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="diagram">
          <Card>
            <Box position="relative">
              <svg id="er-diagram-svg" width="1200" height="800" viewBox="0 0 1200 800" />
              
              {hoveredRelation && (
                <Box position="absolute" top="20" right="20" style={{ maxWidth: '300px' }}>
                  <Card style={{ backgroundColor: 'var(--gray-3)', padding: '12px' }}>
                    <Text size="2" weight="bold">Relationship</Text>
                    <Text size="2" style={{ display: 'block', marginTop: '4px' }}>
                      {hoveredRelation.source}.{hoveredRelation.sourceColumn} → {hoveredRelation.target}.{hoveredRelation.targetColumn}
                    </Text>
                  </Card>
                </Box>
              )}

              {selectedTable && (
                <Box position="absolute" bottom="20" left="20" style={{ maxWidth: '400px', maxHeight: '300px', overflow: 'auto' }}>
                  <Card>
                    <Heading size="3" mb="2">{selectedTable}</Heading>
                    <Box>
                      {tables.find(t => t.name === selectedTable)?.columns.map((col, i) => (
                        <Flex key={i} gap="2" mb="1">
                          {col.isPK && <Badge size="1" color="ruby">PK</Badge>}
                          {col.isFK && <Badge size="1" color="blue">FK</Badge>}
                          <Text size="2" style={{ fontFamily: 'monospace' }}>{col.name}</Text>
                          <Text size="1" color="gray">{col.type}</Text>
                        </Flex>
                      ))}
                    </Box>
                  </Card>
                </Box>
              )}
            </Box>

            <Callout.Root mt="4" size="1">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                This star schema shows the central fact table (fact_trading_orders) connected to dimension tables. 
                Click on tables to see their columns. Hover over relationships to see the connected columns.
              </Callout.Text>
            </Callout.Root>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="views">
          <Card>
            <Heading size="4" mb="4">What Are Database Views?</Heading>
            
            <Box mb="4">
              <Heading size="3" mb="2">Views = Pre-written SQL Queries</Heading>
              <Text size="3" style={{ lineHeight: 1.6 }}>
                A view is a <strong>virtual table</strong> that doesn't store data itself. Instead, it stores a SQL query 
                that runs whenever you access the view. Think of it as a "saved query" or "query template".
              </Text>
            </Box>

            <Box mb="4">
              <Heading size="3" mb="2">Why Use Views?</Heading>
              <Box style={{ marginLeft: '20px' }}>
                <Text size="3" style={{ display: 'block', marginBottom: '8px' }}>
                  <strong>1. Simplification:</strong> Complex joins are pre-written. Users don't need to know table relationships.
                </Text>
                <Text size="3" style={{ display: 'block', marginBottom: '8px' }}>
                  <strong>2. Security:</strong> Hide sensitive columns. Show only what users need to see.
                </Text>
                <Text size="3" style={{ display: 'block', marginBottom: '8px' }}>
                  <strong>3. Performance:</strong> Optimize common queries once, reuse many times.
                </Text>
                <Text size="3" style={{ display: 'block', marginBottom: '8px' }}>
                  <strong>4. Consistency:</strong> Business logic is centralized. Everyone uses the same calculations.
                </Text>
              </Box>
            </Box>

            <Box mb="4">
              <Heading size="3" mb="2">Example: v_trader_performance View</Heading>
              <Card style={{ backgroundColor: 'var(--gray-3)', padding: '16px' }}>
                <Text size="2" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`Instead of writing this complex query every time:

SELECT 
  t.trader_name,
  COUNT(o.order_id) as total_orders,
  SUM(o.pnl) as total_pnl,
  AVG(o.pnl) as avg_pnl
FROM dim_trader t
JOIN fact_trading_orders o ON t.trader_id = o.trader_id
WHERE t.is_active = 1
GROUP BY t.trader_id, t.trader_name

You can simply use:
SELECT * FROM v_trader_performance`}
                </Text>
              </Card>
            </Box>

            <Box>
              <Heading size="3" mb="2">Views in This System</Heading>
              <Text size="3" mb="3">We have 8 views that pre-aggregate common analytics:</Text>
              <Box style={{ marginLeft: '20px' }}>
                <Text size="2" style={{ display: 'block', marginBottom: '4px' }}>
                  • <strong>v_recent_orders</strong> - Latest trades with all details joined
                </Text>
                <Text size="2" style={{ display: 'block', marginBottom: '4px' }}>
                  • <strong>v_trader_performance</strong> - Trader metrics and PnL
                </Text>
                <Text size="2" style={{ display: 'block', marginBottom: '4px' }}>
                  • <strong>v_daily_trading_summary</strong> - Daily aggregated volumes
                </Text>
                <Text size="2" style={{ display: 'block', marginBottom: '4px' }}>
                  • <strong>v_security_statistics</strong> - Security-level analytics
                </Text>
              </Box>
            </Box>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="column-selection">
          <Card>
            <Heading size="4" mb="4">How to Select Columns from 1000+ Column Tables</Heading>
            
            <Box mb="4">
              <Heading size="3" mb="2" color="ruby">The Challenge</Heading>
              <Text size="3">
                In real financial systems, tables can have 1000+ columns containing trade attributes, 
                risk metrics, regulatory fields, and audit data. How do you pick the right columns?
              </Text>
            </Box>

            <Box mb="4">
              <Heading size="3" mb="2">1. Column Categorization</Heading>
              <Card style={{ backgroundColor: 'var(--gray-3)', padding: '16px' }}>
                <Flex gap="4" wrap="wrap">
                  <Box>
                    <Badge color="ruby" mb="2">Identifiers</Badge>
                    <Text size="2" style={{ display: 'block' }}>trade_id, order_id, account_id</Text>
                  </Box>
                  <Box>
                    <Badge color="blue" mb="2">Measures</Badge>
                    <Text size="2" style={{ display: 'block' }}>quantity, price, pnl, commission</Text>
                  </Box>
                  <Box>
                    <Badge color="green" mb="2">Dimensions</Badge>
                    <Text size="2" style={{ display: 'block' }}>product_type, exchange, currency</Text>
                  </Box>
                  <Box>
                    <Badge color="amber" mb="2">Timestamps</Badge>
                    <Text size="2" style={{ display: 'block' }}>trade_date, settlement_date</Text>
                  </Box>
                </Flex>
              </Card>
            </Box>

            <Box mb="4">
              <Heading size="3" mb="2">2. Query Context Analysis</Heading>
              <Text size="3" mb="2">Our system uses Natural Language Processing to understand intent:</Text>
              
              <Card style={{ backgroundColor: 'var(--gray-3)', padding: '16px', marginBottom: '12px' }}>
                <Text size="2" weight="bold" color="green">Query: "Show me Apple trades today"</Text>
                <Text size="2" style={{ marginTop: '8px' }}>
                  → Needs: symbol, trade_date, quantity, price (basic trade info)
                </Text>
              </Card>

              <Card style={{ backgroundColor: 'var(--gray-3)', padding: '16px', marginBottom: '12px' }}>
                <Text size="2" weight="bold" color="blue">Query: "Calculate trader PnL by desk"</Text>
                <Text size="2" style={{ marginTop: '8px' }}>
                  → Needs: trader_id, desk, pnl, trade_date (aggregation fields)
                </Text>
              </Card>

              <Card style={{ backgroundColor: 'var(--gray-3)', padding: '16px' }}>
                <Text size="2" weight="bold" color="amber">Query: "Risk exposure by counterparty"</Text>
                <Text size="2" style={{ marginTop: '8px' }}>
                  → Needs: counterparty_id, notional_value, market_value, var_amount
                </Text>
              </Card>
            </Box>

            <Box mb="4">
              <Heading size="3" mb="2">3. Column Metadata & Scoring</Heading>
              <Text size="3" mb="3">We score columns based on:</Text>
              <Box style={{ marginLeft: '20px' }}>
                <Flex gap="2" mb="2">
                  <Badge size="2">+10</Badge>
                  <Text size="2">Column name matches query keywords</Text>
                </Flex>
                <Flex gap="2" mb="2">
                  <Badge size="2">+8</Badge>
                  <Text size="2">Column is frequently used in similar queries</Text>
                </Flex>
                <Flex gap="2" mb="2">
                  <Badge size="2">+6</Badge>
                  <Text size="2">Column is a foreign key to relevant table</Text>
                </Flex>
                <Flex gap="2" mb="2">
                  <Badge size="2">+4</Badge>
                  <Text size="2">Column description contains query terms</Text>
                </Flex>
                <Flex gap="2">
                  <Badge size="2">+2</Badge>
                  <Text size="2">Column is commonly used with other selected columns</Text>
                </Flex>
              </Box>
            </Box>

            <Box>
              <Heading size="3" mb="2">4. Smart Column Groups</Heading>
              <Text size="3" mb="3">
                Instead of picking individual columns, we use "column groups" - sets of columns that are commonly used together:
              </Text>
              
              <Flex gap="3" wrap="wrap">
                <Card style={{ flex: 1, minWidth: '200px' }}>
                  <Text size="2" weight="bold" mb="2">Trade Basics</Text>
                  <Text size="1" color="gray">
                    trade_id, symbol, side, quantity, price, trade_date
                  </Text>
                </Card>
                <Card style={{ flex: 1, minWidth: '200px' }}>
                  <Text size="2" weight="bold" mb="2">Risk Metrics</Text>
                  <Text size="1" color="gray">
                    var_amount, position_limit, concentration_pct
                  </Text>
                </Card>
                <Card style={{ flex: 1, minWidth: '200px' }}>
                  <Text size="2" weight="bold" mb="2">Settlement</Text>
                  <Text size="1" color="gray">
                    settlement_date, settlement_amount, settlement_status
                  </Text>
                </Card>
              </Flex>
            </Box>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default ERDiagramWithRelationships;
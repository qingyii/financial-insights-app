import React, { useEffect, useState, useCallback } from 'react';
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
  BackgroundVariant,
  MiniMap,
  Panel,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Card, Text, Badge, Flex, Button, Select, Callout } from '@radix-ui/themes';
import { MagnifyingGlassIcon, InfoCircledIcon, ResetIcon } from '@radix-ui/react-icons';
import { neo4jSchemaService } from '@/services/neo4jSchemaService';

interface ColumnInfo {
  name: string;
  dataType: string;
  isPrimary?: boolean;
  isForeign?: boolean;
}

interface TableNodeData {
  name: string;
  type: 'fact' | 'dimension';
  columns: ColumnInfo[];
  columnCount: number;
  selected?: boolean;
}

const TableNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as TableNodeData;
  const isSelected = selected || nodeData.selected;
  
  const nodeStyle = {
    borderColor: isSelected 
      ? 'var(--ruby-11)' 
      : nodeData.type === 'fact' 
        ? 'var(--ruby-9)' 
        : 'var(--blue-9)',
    backgroundColor: isSelected
      ? nodeData.type === 'fact' ? 'var(--ruby-3)' : 'var(--blue-3)'
      : nodeData.type === 'fact' ? 'var(--ruby-2)' : 'var(--blue-2)',
    borderWidth: isSelected ? '3px' : '2px',
    transition: 'all 0.2s'
  };

  return (
    <Card 
      style={{
        ...nodeStyle,
        borderStyle: 'solid',
        minWidth: '280px',
        cursor: 'grab'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      
      <Flex align="center" gap="2" mb="2">
        <Text size="3" weight="bold">📊 {nodeData.name}</Text>
        <Badge color={nodeData.type === 'fact' ? 'ruby' : 'blue'} size="1">
          {nodeData.type}
        </Badge>
        <Badge variant="soft" size="1">
          {nodeData.columnCount} cols
        </Badge>
      </Flex>
      
      <Box style={{ 
        borderTop: '1px solid var(--gray-6)', 
        paddingTop: '8px',
        fontSize: '12px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {nodeData.columns.slice(0, 8).map((column, idx) => (
          <Flex key={idx} gap="2" mb="1" align="center">
            {column.isPrimary && <Badge size="1" color="amber">PK</Badge>}
            {column.isForeign && <Badge size="1" color="green">FK</Badge>}
            <Text size="1" style={{ fontFamily: 'monospace', flex: 1 }}>
              {column.name}
            </Text>
            <Text size="1" color="gray">
              {column.dataType}
            </Text>
          </Flex>
        ))}
        {nodeData.columns.length > 8 && (
          <Text size="1" color="gray" style={{ marginTop: '4px' }}>
            ... and {nodeData.columns.length - 8} more columns
          </Text>
        )}
      </Box>
      
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </Card>
  );
};

const nodeTypes = {
  table: TableNode
};

export const Neo4jSchemaGraph: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [joinPath, setJoinPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fitView, getNodes } = useReactFlow();

  useEffect(() => {
    loadSchemaGraph();
  }, []);

  const loadSchemaGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to connect to Neo4j
      await neo4jSchemaService.connect();
      
      // Get schema graph
      const { nodes: graphNodes, edges: graphEdges } = await neo4jSchemaService.getSchemaGraph();
      
      // Convert to ReactFlow format
      const flowNodes: Node[] = graphNodes.map((node, index) => ({
        id: node.id,
        type: 'table',
        position: getNodePosition(index, graphNodes.length),
        data: node.data
      }));
      
      const flowEdges: Edge[] = graphEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--gray-9)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--gray-9)' },
        label: edge.label,
        labelStyle: { fontSize: 12, fontWeight: 500, fill: 'var(--gray-11)' }
      }));
      
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    } catch (err) {
      console.error('Failed to load schema graph:', err);
      setError('Using in-memory schema graph (Neo4j not connected)');
      // Continue with in-memory graph
    } finally {
      setLoading(false);
    }
  };

  const getNodePosition = (index: number, total: number): { x: number; y: number } => {
    // Arrange nodes in a circle around the fact table
    if (index === 0) return { x: 400, y: 300 }; // Fact table in center
    
    const angle = ((index - 1) / (total - 1)) * 2 * Math.PI;
    const radius = 300;
    return {
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle)
    };
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const tableName = node.id;
    
    setSelectedTables(prev => {
      if (prev.includes(tableName)) {
        return prev.filter(t => t !== tableName);
      } else {
        return [...prev, tableName];
      }
    });
  }, []);

  const findOptimalJoinPath = async () => {
    if (selectedTables.length < 2) {
      setJoinPath([]);
      return;
    }
    
    try {
      const path = await neo4jSchemaService.findOptimalJoinPath(selectedTables);
      setJoinPath(path);
      
      // Highlight the path in the graph
      const pathSet = new Set(path);
      setNodes(nodes => nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          selected: pathSet.has(node.id)
        }
      })));
      
      // Highlight edges in the path
      setEdges(edges => edges.map(edge => {
        const isInPath = pathSet.has(edge.source) && pathSet.has(edge.target);
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isInPath ? 'var(--ruby-9)' : 'var(--gray-9)',
            strokeWidth: isInPath ? 3 : 2
          },
          animated: isInPath
        };
      }));
    } catch (err) {
      console.error('Failed to find join path:', err);
    }
  };

  useEffect(() => {
    findOptimalJoinPath();
  }, [selectedTables]);

  const resetSelection = () => {
    setSelectedTables([]);
    setJoinPath([]);
    setNodes(nodes => nodes.map(node => ({
      ...node,
      data: { ...node.data, selected: false }
    })));
    setEdges(edges => edges.map(edge => ({
      ...edge,
      style: { stroke: 'var(--gray-9)', strokeWidth: 2 },
      animated: true
    })));
  };

  const generateSQL = () => {
    if (joinPath.length < 2) return '';
    
    let sql = 'SELECT * FROM ' + joinPath[0];
    
    for (let i = 1; i < joinPath.length; i++) {
      const currentTable = joinPath[i];
      const previousTable = joinPath[i - 1];
      
      // Find the relationship
      const edge = edges.find(e => 
        (e.source === previousTable && e.target === currentTable) ||
        (e.source === currentTable && e.target === previousTable)
      );
      
      if (edge) {
        sql += `\nJOIN ${currentTable} ON ${previousTable}.${edge.label} = ${currentTable}.${edge.label}`;
      }
    }
    
    return sql;
  };

  if (loading) {
    return (
      <Box style={{ height: '700px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading schema graph...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Callout.Root color="amber" mb="3">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      
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
          <MiniMap 
            nodeColor={node => {
              const data = node.data as TableNodeData;
              return data.type === 'fact' ? 'var(--ruby-9)' : 'var(--blue-9)';
            }}
            style={{
              backgroundColor: 'var(--gray-3)',
              border: '1px solid var(--gray-6)'
            }}
          />
          
          <Panel position="top-left" style={{ margin: '10px' }}>
            <Card style={{ minWidth: '300px' }}>
              <Flex direction="column" gap="3">
                <Text size="2" weight="bold">Table Selection</Text>
                
                <Flex gap="2" wrap="wrap">
                  {selectedTables.map(table => (
                    <Badge key={table} color="ruby" size="2">
                      {table}
                    </Badge>
                  ))}
                  {selectedTables.length === 0 && (
                    <Text size="2" color="gray">Click tables to select for join</Text>
                  )}
                </Flex>
                
                {joinPath.length > 1 && (
                  <>
                    <Separator />
                    <Box>
                      <Text size="2" weight="bold" mb="2">Optimal Join Path:</Text>
                      <Flex gap="2" align="center">
                        {joinPath.map((table, idx) => (
                          <React.Fragment key={table}>
                            <Badge color="green" size="2">{table}</Badge>
                            {idx < joinPath.length - 1 && <Text>→</Text>}
                          </React.Fragment>
                        ))}
                      </Flex>
                    </Box>
                    
                    <Box>
                      <Text size="2" weight="bold" mb="2">Generated SQL:</Text>
                      <Box style={{ 
                        backgroundColor: 'var(--gray-4)', 
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-2)',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}>
                        <pre style={{ margin: 0 }}>{generateSQL()}</pre>
                      </Box>
                    </Box>
                  </>
                )}
                
                <Button size="2" variant="soft" onClick={resetSelection}>
                  <ResetIcon />
                  Reset Selection
                </Button>
              </Flex>
            </Card>
          </Panel>
        </ReactFlow>
      </Box>
      
      <Card mt="3">
        <Flex justify="between" align="center">
          <Box>
            <Text size="2" weight="bold">How to use:</Text>
            <Text size="2" color="gray">
              1. Click on tables to select them for joining
              2. The system will automatically find the optimal join path
              3. View the generated SQL query with proper join conditions
            </Text>
          </Box>
          <Flex gap="3" align="center">
            <Badge color="ruby" size="2">Fact Table</Badge>
            <Badge color="blue" size="2">Dimension Tables</Badge>
            <Badge color="green" size="2">Selected Path</Badge>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
};

// Add missing import
import { Separator } from '@radix-ui/themes';
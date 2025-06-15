import React, { useState } from 'react';
import {
  Box,
  Card,
  Heading,
  Table,
  Button,
  TextField,
  Text,
  Badge,
  Tabs,
  Dialog,
  Flex,
  Select,
  Separator,
  Callout
} from '@radix-ui/themes';
import {
  PlusIcon,
  TableIcon,
  Pencil1Icon,
  InfoCircledIcon,
  DrawingPinIcon
} from '@radix-ui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ERDiagram from './ERDiagram';

interface Column {
  name: string;
  type: string;
  pk: boolean;
  notnull: boolean;
}

interface TableSchema {
  sql: string;
  columns: Column[];
}

const DataStructureManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'column' | 'table'>('column');
  
  // Form state
  const [columnName, setColumnName] = useState('');
  const [dataType, setDataType] = useState('VARCHAR(255)');
  const [tableName, setTableName] = useState('');
  const [createStatement, setCreateStatement] = useState('');

  const { data: schema, isLoading } = useQuery({
    queryKey: ['schema'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/schema');
      return response.data as Record<string, TableSchema>;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await axios.post('http://localhost:3000/api/schema/update', params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema'] });
      handleCloseDialog();
    }
  });

  const handleAddColumn = () => {
    setDialogType('column');
    setDialogOpen(true);
  };

  const handleAddTable = () => {
    setDialogType('table');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setColumnName('');
    setDataType('VARCHAR(255)');
    setTableName('');
    setCreateStatement('');
  };

  const handleSubmit = () => {
    if (dialogType === 'column') {
      updateMutation.mutate({
        tableName: selectedTable,
        operation: 'ADD_COLUMN',
        definition: {
          columnName,
          dataType
        }
      });
    } else {
      updateMutation.mutate({
        tableName,
        operation: 'ADD_TABLE',
        definition: {
          createStatement
        }
      });
    }
  };

  const getColumnTypeColor = (type: string): any => {
    if (type.includes('INT')) return 'blue';
    if (type.includes('VARCHAR') || type.includes('TEXT')) return 'purple';
    if (type.includes('DECIMAL') || type.includes('NUMERIC')) return 'green';
    if (type.includes('DATE') || type.includes('TIME')) return 'amber';
    if (type.includes('BOOLEAN')) return 'cyan';
    return 'gray';
  };

  if (isLoading) return <Text>Loading schema...</Text>;

  const tableNames = Object.keys(schema || {});
  const dimensionTables = tableNames.filter(name => name.startsWith('dim_'));
  const factTables = tableNames.filter(name => name.startsWith('fact_'));
  const viewTables = tableNames.filter(name => name.startsWith('v_'));

  return (
    <Box>
      <Card>
        <Flex justify="between" align="center" mb="4">
          <Heading size="5">Data Structure Manager</Heading>
          <Button onClick={handleAddTable}>
            <PlusIcon />
            Add Table
          </Button>
        </Flex>

        <Tabs.Root defaultValue="er-diagram">
          <Tabs.List>
            <Tabs.Trigger value="er-diagram">
              <DrawingPinIcon />
              ER Diagram
            </Tabs.Trigger>
            <Tabs.Trigger value="dimensions">Dimensions ({dimensionTables.length})</Tabs.Trigger>
            <Tabs.Trigger value="facts">Facts ({factTables.length})</Tabs.Trigger>
            <Tabs.Trigger value="views">Views ({viewTables.length})</Tabs.Trigger>
          </Tabs.List>

          <Box mt="4">
            <Tabs.Content value="er-diagram">
              <Card>
                <Flex justify="between" align="center" mb="4">
                  <Box>
                    <Heading size="4" mb="2">Entity Relationship Diagram</Heading>
                    <Text color="gray" size="2">
                      Interactive visual representation of the star schema with fact and dimension tables.
                      Drag to pan, scroll to zoom, and hover over table nodes to see details.
                    </Text>
                  </Box>
                  <Flex gap="2">
                    <Badge color="ruby" variant="soft">FACT Tables</Badge>
                    <Badge color="blue" variant="soft">DIM Tables</Badge>
                  </Flex>
                </Flex>
                <ERDiagram />
              </Card>
            </Tabs.Content>
            
            <Tabs.Content value="dimensions">
              {dimensionTables.map(tableName => (
                <TableDisplay
                  key={tableName}
                  tableName={tableName}
                  schema={schema![tableName]}
                  onAddColumn={() => {
                    setSelectedTable(tableName);
                    handleAddColumn();
                  }}
                  getColumnTypeColor={getColumnTypeColor}
                />
              ))}
            </Tabs.Content>

            <Tabs.Content value="facts">
              {factTables.map(tableName => (
                <TableDisplay
                  key={tableName}
                  tableName={tableName}
                  schema={schema![tableName]}
                  onAddColumn={() => {
                    setSelectedTable(tableName);
                    handleAddColumn();
                  }}
                  getColumnTypeColor={getColumnTypeColor}
                />
              ))}
            </Tabs.Content>

            <Tabs.Content value="views">
              {viewTables.map(tableName => (
                <TableDisplay
                  key={tableName}
                  tableName={tableName}
                  schema={schema![tableName]}
                  onAddColumn={() => {}}
                  getColumnTypeColor={getColumnTypeColor}
                  isView={true}
                />
              ))}
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Card>

      {/* Add Column/Table Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>
            {dialogType === 'column' ? `Add Column to ${selectedTable}` : 'Create New Table'}
          </Dialog.Title>
          
          <Box mt="4">
            {updateMutation.isError && (
              <Callout.Root color="red" mb="4">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                  {(updateMutation.error as any)?.response?.data?.error || 'An error occurred'}
                </Callout.Text>
              </Callout.Root>
            )}

            {dialogType === 'column' ? (
              <Flex direction="column" gap="3">
                <Box>
                  <Text as="label" size="2" mb="1" weight="bold">
                    Column Name
                  </Text>
                  <TextField.Root
                    value={columnName}
                    onChange={(e) => setColumnName(e.target.value)}
                    placeholder="column_name"
                  />
                </Box>
                
                <Box>
                  <Text as="label" size="2" mb="1" weight="bold">
                    Data Type
                  </Text>
                  <Select.Root value={dataType} onValueChange={setDataType}>
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="VARCHAR(255)">VARCHAR(255)</Select.Item>
                      <Select.Item value="TEXT">TEXT</Select.Item>
                      <Select.Item value="INTEGER">INTEGER</Select.Item>
                      <Select.Item value="BIGINT">BIGINT</Select.Item>
                      <Select.Item value="DECIMAL(15,4)">DECIMAL(15,4)</Select.Item>
                      <Select.Item value="BOOLEAN">BOOLEAN</Select.Item>
                      <Select.Item value="DATE">DATE</Select.Item>
                      <Select.Item value="TIMESTAMP">TIMESTAMP</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Flex>
            ) : (
              <Flex direction="column" gap="3">
                <Box>
                  <Text as="label" size="2" mb="1" weight="bold">
                    Table Name
                  </Text>
                  <TextField.Root
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="e.g., dim_new_dimension"
                  />
                </Box>
                
                <Box>
                  <Text as="label" size="2" mb="1" weight="bold">
                    CREATE TABLE Statement
                  </Text>
                  <textarea
                    value={createStatement}
                    onChange={(e) => setCreateStatement(e.target.value)}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-2)',
                      border: '1px solid var(--gray-7)',
                      backgroundColor: 'var(--gray-2)',
                      color: 'var(--gray-12)',
                      fontSize: 'var(--font-size-2)'
                    }}
                    placeholder={`CREATE TABLE dim_new_dimension (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`}
                  />
                </Box>
              </Flex>
            )}
          </Box>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button 
              onClick={handleSubmit}
              disabled={updateMutation.isPending || 
                (dialogType === 'column' ? !columnName || !dataType : !tableName || !createStatement)}
            >
              {updateMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

interface TableDisplayProps {
  tableName: string;
  schema: TableSchema;
  onAddColumn: () => void;
  getColumnTypeColor: (type: string) => any;
  isView?: boolean;
}

const TableDisplay: React.FC<TableDisplayProps> = ({ 
  tableName, 
  schema, 
  onAddColumn, 
  getColumnTypeColor,
  isView = false
}) => {
  return (
    <Card mb="4">
      <Flex justify="between" align="center" mb="3">
        <Flex align="center" gap="2">
          <TableIcon />
          <Heading size="3">{tableName}</Heading>
          {isView && <Badge>VIEW</Badge>}
        </Flex>
        {!isView && (
          <Button size="1" variant="soft" onClick={onAddColumn}>
            <Pencil1Icon />
            Add Column
          </Button>
        )}
      </Flex>
      
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Column Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Data Type</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Constraints</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {schema.columns.map((column) => (
            <Table.Row key={column.name}>
              <Table.Cell>
                <Text style={{ fontFamily: 'var(--code-font-family)' }}>
                  {column.name}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge color={getColumnTypeColor(column.type)} variant="soft">
                  {column.type}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  {column.pk && <Badge>PRIMARY KEY</Badge>}
                  {column.notnull && <Badge variant="outline">NOT NULL</Badge>}
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card>
  );
};

export default DataStructureManager;
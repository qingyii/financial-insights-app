import neo4j, { Driver, Session } from 'neo4j-driver';

interface TableNode {
  name: string;
  type: 'fact' | 'dimension';
  columns: Array<{
    name: string;
    dataType: string;
    isPrimary?: boolean;
    isForeign?: boolean;
  }>;
}

interface RelationshipEdge {
  from: string;
  to: string;
  foreignKey: string;
  primaryKey: string;
  type: 'ONE_TO_MANY' | 'MANY_TO_ONE';
}

export class Neo4jSchemaService {
  private driver: Driver | null = null;
  private uri: string;
  private user: string;
  private password: string;

  constructor(uri: string = 'bolt://localhost:7687', user: string = 'neo4j', password: string = 'password') {
    this.uri = uri;
    this.user = user;
    this.password = password;
  }

  async connect() {
    try {
      this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.user, this.password));
      await this.driver.verifyConnectivity();
      console.log('Connected to Neo4j');
      await this.initializeSchema();
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      // Fall back to in-memory graph if Neo4j is not available
      this.driver = null;
    }
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
    }
  }

  private async initializeSchema() {
    if (!this.driver) return;
    
    const session = this.driver.session();
    try {
      // Create constraints
      await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (t:Table) REQUIRE t.name IS UNIQUE');
      await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (c:Column) REQUIRE c.fullName IS UNIQUE');
      
      // Clear existing schema
      await session.run('MATCH (n) WHERE n:Table OR n:Column DETACH DELETE n');
      
      // Create schema nodes and relationships
      await this.createSchemaGraph(session);
    } finally {
      await session.close();
    }
  }

  private async createSchemaGraph(session: Session) {
    // Define our star schema
    const tables: TableNode[] = [
      {
        name: 'fact_trading_orders',
        type: 'fact',
        columns: [
          { name: 'order_id', dataType: 'VARCHAR', isPrimary: true },
          { name: 'time_id', dataType: 'INTEGER', isForeign: true },
          { name: 'security_id', dataType: 'INTEGER', isForeign: true },
          { name: 'trader_id', dataType: 'INTEGER', isForeign: true },
          { name: 'counterparty_id', dataType: 'INTEGER', isForeign: true },
          { name: 'order_type_id', dataType: 'INTEGER', isForeign: true },
          { name: 'order_quantity', dataType: 'DECIMAL' },
          { name: 'order_price', dataType: 'DECIMAL' },
          { name: 'filled_quantity', dataType: 'DECIMAL' },
          { name: 'average_fill_price', dataType: 'DECIMAL' },
          { name: 'commission', dataType: 'DECIMAL' },
          { name: 'order_status', dataType: 'VARCHAR' },
          { name: 'pnl', dataType: 'DECIMAL' },
          { name: 'notional_value', dataType: 'DECIMAL' },
          { name: 'market_value', dataType: 'DECIMAL' }
        ]
      },
      {
        name: 'dim_security',
        type: 'dimension',
        columns: [
          { name: 'security_id', dataType: 'INTEGER', isPrimary: true },
          { name: 'symbol', dataType: 'VARCHAR' },
          { name: 'security_name', dataType: 'VARCHAR' },
          { name: 'security_type', dataType: 'VARCHAR' },
          { name: 'exchange', dataType: 'VARCHAR' },
          { name: 'sector', dataType: 'VARCHAR' },
          { name: 'industry', dataType: 'VARCHAR' },
          { name: 'currency', dataType: 'VARCHAR' },
          { name: 'is_active', dataType: 'BOOLEAN' }
        ]
      },
      {
        name: 'dim_trader',
        type: 'dimension',
        columns: [
          { name: 'trader_id', dataType: 'INTEGER', isPrimary: true },
          { name: 'trader_code', dataType: 'VARCHAR' },
          { name: 'trader_name', dataType: 'VARCHAR' },
          { name: 'desk', dataType: 'VARCHAR' },
          { name: 'department', dataType: 'VARCHAR' },
          { name: 'experience_level', dataType: 'VARCHAR' },
          { name: 'region', dataType: 'VARCHAR' },
          { name: 'is_active', dataType: 'BOOLEAN' }
        ]
      },
      {
        name: 'dim_time',
        type: 'dimension',
        columns: [
          { name: 'time_id', dataType: 'INTEGER', isPrimary: true },
          { name: 'full_datetime', dataType: 'TIMESTAMP' },
          { name: 'date', dataType: 'DATE' },
          { name: 'year', dataType: 'INTEGER' },
          { name: 'quarter', dataType: 'INTEGER' },
          { name: 'month', dataType: 'INTEGER' },
          { name: 'week', dataType: 'INTEGER' },
          { name: 'day_of_month', dataType: 'INTEGER' },
          { name: 'hour', dataType: 'INTEGER' },
          { name: 'minute', dataType: 'INTEGER' },
          { name: 'is_trading_day', dataType: 'BOOLEAN' },
          { name: 'is_market_hours', dataType: 'BOOLEAN' }
        ]
      },
      {
        name: 'dim_counterparty',
        type: 'dimension',
        columns: [
          { name: 'counterparty_id', dataType: 'INTEGER', isPrimary: true },
          { name: 'counterparty_code', dataType: 'VARCHAR' },
          { name: 'counterparty_name', dataType: 'VARCHAR' },
          { name: 'counterparty_type', dataType: 'VARCHAR' },
          { name: 'country', dataType: 'VARCHAR' },
          { name: 'credit_rating', dataType: 'VARCHAR' },
          { name: 'is_active', dataType: 'BOOLEAN' }
        ]
      },
      {
        name: 'dim_order_type',
        type: 'dimension',
        columns: [
          { name: 'order_type_id', dataType: 'INTEGER', isPrimary: true },
          { name: 'order_type', dataType: 'VARCHAR' },
          { name: 'order_side', dataType: 'VARCHAR' },
          { name: 'time_in_force', dataType: 'VARCHAR' },
          { name: 'is_algorithmic', dataType: 'BOOLEAN' },
          { name: 'algorithm_name', dataType: 'VARCHAR' }
        ]
      }
    ];

    const relationships: RelationshipEdge[] = [
      { from: 'fact_trading_orders', to: 'dim_security', foreignKey: 'security_id', primaryKey: 'security_id', type: 'MANY_TO_ONE' },
      { from: 'fact_trading_orders', to: 'dim_trader', foreignKey: 'trader_id', primaryKey: 'trader_id', type: 'MANY_TO_ONE' },
      { from: 'fact_trading_orders', to: 'dim_time', foreignKey: 'time_id', primaryKey: 'time_id', type: 'MANY_TO_ONE' },
      { from: 'fact_trading_orders', to: 'dim_counterparty', foreignKey: 'counterparty_id', primaryKey: 'counterparty_id', type: 'MANY_TO_ONE' },
      { from: 'fact_trading_orders', to: 'dim_order_type', foreignKey: 'order_type_id', primaryKey: 'order_type_id', type: 'MANY_TO_ONE' }
    ];

    // Create table nodes
    for (const table of tables) {
      await session.run(
        `CREATE (t:Table {name: $name, type: $type, columnCount: $columnCount})`,
        { name: table.name, type: table.type, columnCount: table.columns.length }
      );

      // Create column nodes
      for (const column of table.columns) {
        const fullName = `${table.name}.${column.name}`;
        await session.run(
          `CREATE (c:Column {
            name: $name, 
            fullName: $fullName,
            dataType: $dataType, 
            isPrimary: $isPrimary, 
            isForeign: $isForeign
          })`,
          {
            name: column.name,
            fullName: fullName,
            dataType: column.dataType,
            isPrimary: column.isPrimary || false,
            isForeign: column.isForeign || false
          }
        );

        // Link column to table
        await session.run(
          `MATCH (t:Table {name: $tableName}), (c:Column {fullName: $fullName})
           CREATE (t)-[:HAS_COLUMN]->(c)`,
          { tableName: table.name, fullName: fullName }
        );
      }
    }

    // Create relationships between tables
    for (const rel of relationships) {
      await session.run(
        `MATCH (from:Table {name: $from}), (to:Table {name: $to})
         CREATE (from)-[:JOINS_TO {foreignKey: $foreignKey, primaryKey: $primaryKey, type: $type}]->(to)`,
        rel
      );

      // Also create column-level relationships
      await session.run(
        `MATCH (fc:Column {fullName: $fromColumn}), (tc:Column {fullName: $toColumn})
         CREATE (fc)-[:REFERENCES]->(tc)`,
        {
          fromColumn: `${rel.from}.${rel.foreignKey}`,
          toColumn: `${rel.to}.${rel.primaryKey}`
        }
      );
    }
  }

  async findOptimalJoinPath(tables: string[]): Promise<string[]> {
    if (!this.driver) {
      return this.findOptimalJoinPathInMemory(tables);
    }

    const session = this.driver.session();
    try {
      // Use Cypher to find the shortest path between tables
      const result = await session.run(
        `MATCH path = allShortestPaths((start:Table)-[:JOINS_TO*]-(end:Table))
         WHERE start.name IN $tables AND end.name IN $tables
         AND start.name <> end.name
         RETURN nodes(path) as tables, relationships(path) as joins
         ORDER BY length(path) DESC
         LIMIT 1`,
        { tables }
      );

      if (result.records.length > 0) {
        const record = result.records[0];
        const pathTables = record.get('tables').map((node: any) => node.properties.name as string);
        return [...new Set(pathTables)] as string[]; // Remove duplicates while preserving order
      }

      return tables;
    } finally {
      await session.close();
    }
  }

  private findOptimalJoinPathInMemory(tables: string[]): string[] {
    // Simple in-memory implementation
    /* const _graph: Record<string, string[]> = {
      'fact_trading_orders': ['dim_security', 'dim_trader', 'dim_time', 'dim_counterparty', 'dim_order_type'],
      'dim_security': ['fact_trading_orders'],
      'dim_trader': ['fact_trading_orders'],
      'dim_time': ['fact_trading_orders'],
      'dim_counterparty': ['fact_trading_orders'],
      'dim_order_type': ['fact_trading_orders']
    }; */

    // If fact table is involved, it's the hub
    if (tables.includes('fact_trading_orders')) {
      return ['fact_trading_orders', ...tables.filter(t => t !== 'fact_trading_orders')];
    }

    // Otherwise, go through fact table
    return ['fact_trading_orders', ...tables];
  }

  async getTableRelationships(tableName: string): Promise<any[]> {
    if (!this.driver) {
      return this.getTableRelationshipsInMemory(tableName);
    }

    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (t:Table {name: $tableName})-[r:JOINS_TO]-(related:Table)
         RETURN t, r, related`,
        { tableName }
      );

      return result.records.map(record => ({
        table: record.get('t').properties,
        relationship: record.get('r').properties,
        relatedTable: record.get('related').properties
      }));
    } finally {
      await session.close();
    }
  }

  private getTableRelationshipsInMemory(tableName: string): any[] {
    const relationships: Record<string, any[]> = {
      'fact_trading_orders': [
        { relatedTable: { name: 'dim_security' }, relationship: { foreignKey: 'security_id' } },
        { relatedTable: { name: 'dim_trader' }, relationship: { foreignKey: 'trader_id' } },
        { relatedTable: { name: 'dim_time' }, relationship: { foreignKey: 'time_id' } },
        { relatedTable: { name: 'dim_counterparty' }, relationship: { foreignKey: 'counterparty_id' } },
        { relatedTable: { name: 'dim_order_type' }, relationship: { foreignKey: 'order_type_id' } }
      ],
      'dim_security': [{ relatedTable: { name: 'fact_trading_orders' }, relationship: { primaryKey: 'security_id' } }],
      'dim_trader': [{ relatedTable: { name: 'fact_trading_orders' }, relationship: { primaryKey: 'trader_id' } }],
      'dim_time': [{ relatedTable: { name: 'fact_trading_orders' }, relationship: { primaryKey: 'time_id' } }],
      'dim_counterparty': [{ relatedTable: { name: 'fact_trading_orders' }, relationship: { primaryKey: 'counterparty_id' } }],
      'dim_order_type': [{ relatedTable: { name: 'fact_trading_orders' }, relationship: { primaryKey: 'order_type_id' } }]
    };

    return relationships[tableName] || [];
  }

  async getSchemaGraph(): Promise<{ nodes: any[], edges: any[] }> {
    if (!this.driver) {
      return this.getSchemaGraphInMemory();
    }

    const session = this.driver.session();
    try {
      // Get all tables and their columns
      const tablesResult = await session.run(
        `MATCH (t:Table)
         OPTIONAL MATCH (t)-[:HAS_COLUMN]->(c:Column)
         RETURN t, collect(c) as columns`
      );

      // Get all relationships
      const relationshipsResult = await session.run(
        `MATCH (from:Table)-[r:JOINS_TO]->(to:Table)
         RETURN from, r, to`
      );

      const nodes = tablesResult.records.map(record => {
        const table = record.get('t').properties;
        const columns = record.get('columns').map((col: any) => col.properties);
        return {
          id: table.name,
          data: {
            ...table,
            columns
          }
        };
      });

      const edges = relationshipsResult.records.map((record, index) => {
        const from = record.get('from').properties.name;
        const to = record.get('to').properties.name;
        const rel = record.get('r').properties;
        return {
          id: `edge-${index}`,
          source: from,
          target: to,
          label: rel.foreignKey,
          data: rel
        };
      });

      return { nodes, edges };
    } finally {
      await session.close();
    }
  }

  private getSchemaGraphInMemory(): { nodes: any[], edges: any[] } {
    // Return the same structure as DatabaseGraphVisualization
    const nodes = [
      {
        id: 'fact_trading_orders',
        data: {
          name: 'fact_trading_orders',
          type: 'fact',
          columnCount: 15,
          columns: [
            { name: 'order_id', dataType: 'VARCHAR', isPrimary: true },
            { name: 'time_id', dataType: 'INTEGER', isForeign: true },
            { name: 'security_id', dataType: 'INTEGER', isForeign: true },
            { name: 'trader_id', dataType: 'INTEGER', isForeign: true },
            { name: 'counterparty_id', dataType: 'INTEGER', isForeign: true }
          ]
        }
      },
      {
        id: 'dim_security',
        data: {
          name: 'dim_security',
          type: 'dimension',
          columnCount: 9,
          columns: [
            { name: 'security_id', dataType: 'INTEGER', isPrimary: true },
            { name: 'symbol', dataType: 'VARCHAR' },
            { name: 'security_name', dataType: 'VARCHAR' }
          ]
        }
      },
      {
        id: 'dim_trader',
        data: {
          name: 'dim_trader',
          type: 'dimension',
          columnCount: 8,
          columns: [
            { name: 'trader_id', dataType: 'INTEGER', isPrimary: true },
            { name: 'trader_code', dataType: 'VARCHAR' },
            { name: 'trader_name', dataType: 'VARCHAR' }
          ]
        }
      },
      {
        id: 'dim_time',
        data: {
          name: 'dim_time',
          type: 'dimension',
          columnCount: 12,
          columns: [
            { name: 'time_id', dataType: 'INTEGER', isPrimary: true },
            { name: 'full_datetime', dataType: 'TIMESTAMP' },
            { name: 'date', dataType: 'DATE' }
          ]
        }
      },
      {
        id: 'dim_counterparty',
        data: {
          name: 'dim_counterparty',
          type: 'dimension',
          columnCount: 7,
          columns: [
            { name: 'counterparty_id', dataType: 'INTEGER', isPrimary: true },
            { name: 'counterparty_code', dataType: 'VARCHAR' },
            { name: 'counterparty_name', dataType: 'VARCHAR' }
          ]
        }
      },
      {
        id: 'dim_order_type',
        data: {
          name: 'dim_order_type',
          type: 'dimension',
          columnCount: 6,
          columns: [
            { name: 'order_type_id', dataType: 'INTEGER', isPrimary: true },
            { name: 'order_type', dataType: 'VARCHAR' },
            { name: 'order_side', dataType: 'VARCHAR' }
          ]
        }
      }
    ];

    const edges = [
      { id: 'edge-0', source: 'fact_trading_orders', target: 'dim_security', label: 'security_id' },
      { id: 'edge-1', source: 'fact_trading_orders', target: 'dim_trader', label: 'trader_id' },
      { id: 'edge-2', source: 'fact_trading_orders', target: 'dim_time', label: 'time_id' },
      { id: 'edge-3', source: 'fact_trading_orders', target: 'dim_counterparty', label: 'counterparty_id' },
      { id: 'edge-4', source: 'fact_trading_orders', target: 'dim_order_type', label: 'order_type_id' }
    ];

    return { nodes, edges };
  }
}

// Export singleton instance
export const neo4jSchemaService = new Neo4jSchemaService();
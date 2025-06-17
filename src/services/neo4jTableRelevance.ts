import neo4j, { Driver, Session } from 'neo4j-driver';

interface TableRelevance {
  table: string;
  relevanceScore: number;
  reasons: string[];
  relatedTables: Array<{ table: string; relationship: string; weight: number }>;
  suggestedColumns: string[];
}

interface QueryContext {
  keywords: string[];
  entities: string[];
  aggregations: string[];
  timeContext?: string;
}

export class Neo4jTableRelevanceService {
  private driver: Driver | null = null;
  private uri: string;
  private user: string;
  private password: string;

  // Enhanced keyword mappings with weights
  private keywordTableWeights: Record<string, Record<string, number>> = {
    // Trading and order keywords
    'order': { 'fact_trading_orders': 1.0, 'dim_order_type': 0.7 },
    'trade': { 'fact_trading_orders': 1.0, 'dim_trader': 0.5 },
    'trading': { 'fact_trading_orders': 1.0, 'dim_trader': 0.6 },
    'transaction': { 'fact_trading_orders': 1.0 },
    'execution': { 'fact_trading_orders': 0.9, 'dim_order_type': 0.4 },
    'fill': { 'fact_trading_orders': 0.9 },
    'pnl': { 'fact_trading_orders': 1.0 },
    'profit': { 'fact_trading_orders': 1.0 },
    'loss': { 'fact_trading_orders': 1.0 },
    'commission': { 'fact_trading_orders': 0.9 },
    'notional': { 'fact_trading_orders': 0.8 },
    'volume': { 'fact_trading_orders': 0.9 },
    
    // Security keywords
    'security': { 'dim_security': 1.0, 'fact_trading_orders': 0.4 },
    'stock': { 'dim_security': 1.0, 'fact_trading_orders': 0.5 },
    'equity': { 'dim_security': 1.0, 'fact_trading_orders': 0.5 },
    'bond': { 'dim_security': 1.0, 'fact_trading_orders': 0.5 },
    'option': { 'dim_security': 1.0, 'fact_trading_orders': 0.5 },
    'future': { 'dim_security': 1.0, 'fact_trading_orders': 0.5 },
    'derivative': { 'dim_security': 1.0, 'fact_trading_orders': 0.5 },
    'symbol': { 'dim_security': 1.0 },
    'ticker': { 'dim_security': 1.0 },
    'instrument': { 'dim_security': 0.9 },
    'isin': { 'dim_security': 0.9 },
    'exchange': { 'dim_security': 0.8 },
    'sector': { 'dim_security': 0.8 },
    
    // Trader keywords
    'trader': { 'dim_trader': 1.0, 'fact_trading_orders': 0.5 },
    'desk': { 'dim_trader': 1.0, 'fact_trading_orders': 0.4 },
    'department': { 'dim_trader': 0.9 },
    'employee': { 'dim_trader': 0.8 },
    'team': { 'dim_trader': 0.8 },
    'region': { 'dim_trader': 0.7 },
    
    // Time keywords
    'date': { 'dim_time': 1.0, 'fact_trading_orders': 0.3 },
    'time': { 'dim_time': 1.0, 'fact_trading_orders': 0.3 },
    'today': { 'dim_time': 1.0, 'fact_trading_orders': 0.4 },
    'yesterday': { 'dim_time': 1.0, 'fact_trading_orders': 0.4 },
    'week': { 'dim_time': 1.0, 'fact_trading_orders': 0.4 },
    'month': { 'dim_time': 1.0, 'fact_trading_orders': 0.4 },
    'quarter': { 'dim_time': 1.0, 'fact_trading_orders': 0.4 },
    'year': { 'dim_time': 1.0, 'fact_trading_orders': 0.4 },
    'hourly': { 'dim_time': 0.9, 'fact_trading_orders': 0.3 },
    'daily': { 'dim_time': 0.9, 'fact_trading_orders': 0.3 },
    
    // Counterparty keywords
    'counterparty': { 'dim_counterparty': 1.0, 'fact_trading_orders': 0.5 },
    'client': { 'dim_counterparty': 1.0, 'fact_trading_orders': 0.5 },
    'customer': { 'dim_counterparty': 1.0, 'fact_trading_orders': 0.5 },
    'institution': { 'dim_counterparty': 0.9 },
    'bank': { 'dim_counterparty': 0.8 },
    'broker': { 'dim_counterparty': 0.8 },
    'rating': { 'dim_counterparty': 0.7 },
    
    // Order type keywords
    'limit': { 'dim_order_type': 1.0, 'fact_trading_orders': 0.5 },
    'market': { 'dim_order_type': 1.0, 'fact_trading_orders': 0.5 },
    'stop': { 'dim_order_type': 1.0, 'fact_trading_orders': 0.5 },
    'buy': { 'dim_order_type': 0.9, 'fact_trading_orders': 0.6 },
    'sell': { 'dim_order_type': 0.9, 'fact_trading_orders': 0.6 },
    'algorithmic': { 'dim_order_type': 0.9, 'fact_trading_orders': 0.4 },
    'algo': { 'dim_order_type': 0.9, 'fact_trading_orders': 0.4 }
  };

  constructor(uri: string = 'bolt://localhost:7687', user: string = 'neo4j', password: string = 'password') {
    this.uri = uri;
    this.user = user;
    this.password = password;
  }

  async connect() {
    try {
      this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.user, this.password));
      await this.driver.verifyConnectivity();
      await this.enhanceSchemaWithMetadata();
    } catch (error) {
      console.error('Neo4j connection failed, using in-memory relevance:', error);
      this.driver = null;
    }
  }

  private async enhanceSchemaWithMetadata() {
    if (!this.driver) return;
    
    const session = this.driver.session();
    try {
      // Add query patterns and usage statistics
      await session.run(`
        MATCH (t:Table)
        SET t.queryCount = 0, t.lastQueried = null
        RETURN t
      `);

      // Add semantic tags to tables
      const tableTags: Record<string, string[]> = {
        'fact_trading_orders': ['transactional', 'core', 'metrics', 'performance'],
        'dim_security': ['reference', 'instrument', 'market'],
        'dim_trader': ['personnel', 'organizational', 'hierarchy'],
        'dim_time': ['temporal', 'calendar', 'period'],
        'dim_counterparty': ['external', 'relationship', 'credit'],
        'dim_order_type': ['classification', 'execution', 'strategy']
      };

      for (const [table, tags] of Object.entries(tableTags)) {
        await session.run(`
          MATCH (t:Table {name: $table})
          SET t.tags = $tags
        `, { table, tags });
      }

      // Create keyword nodes and relationships
      for (const [keyword, tableWeights] of Object.entries(this.keywordTableWeights)) {
        await session.run(`
          MERGE (k:Keyword {word: $keyword})
        `, { keyword });

        for (const [table, weight] of Object.entries(tableWeights)) {
          await session.run(`
            MATCH (t:Table {name: $table}), (k:Keyword {word: $keyword})
            MERGE (k)-[:RELATES_TO {weight: $weight}]->(t)
          `, { table, keyword, weight });
        }
      }
    } finally {
      await session.close();
    }
  }

  async calculateTableRelevance(query: string): Promise<TableRelevance[]> {
    const context = this.extractQueryContext(query);
    
    if (this.driver) {
      return this.calculateRelevanceWithNeo4j(context);
    } else {
      return this.calculateRelevanceInMemory(context);
    }
  }

  private extractQueryContext(query: string): QueryContext {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);
    
    const context: QueryContext = {
      keywords: [],
      entities: [],
      aggregations: []
    };

    // Extract keywords
    for (const word of words) {
      if (this.keywordTableWeights[word]) {
        context.keywords.push(word);
      }
    }

    // Extract potential entity names (capitalized words)
    const entityMatches = query.match(/\b[A-Z][A-Za-z0-9]+\b/g);
    if (entityMatches) {
      context.entities = entityMatches;
    }

    // Extract aggregations
    const aggPatterns = ['sum', 'count', 'average', 'avg', 'max', 'min', 'total'];
    for (const pattern of aggPatterns) {
      if (lowerQuery.includes(pattern)) {
        context.aggregations.push(pattern);
      }
    }

    // Extract time context
    if (lowerQuery.includes('today') || lowerQuery.includes('current')) {
      context.timeContext = 'current';
    } else if (lowerQuery.includes('yesterday') || lowerQuery.includes('previous')) {
      context.timeContext = 'past';
    }

    return context;
  }

  private async calculateRelevanceWithNeo4j(context: QueryContext): Promise<TableRelevance[]> {
    const session = this.driver!.session();
    try {
      // Calculate relevance scores using graph algorithms
      const relevanceMap = new Map<string, TableRelevance>();

      // 1. Keyword-based relevance
      for (const keyword of context.keywords) {
        const result = await session.run(`
          MATCH (k:Keyword {word: $keyword})-[r:RELATES_TO]->(t:Table)
          RETURN t.name as table, r.weight as weight, t.tags as tags
          ORDER BY r.weight DESC
        `, { keyword });

        for (const record of result.records) {
          const table = record.get('table');
          const weight = record.get('weight');
          const tags = record.get('tags') || [];

          if (!relevanceMap.has(table)) {
            relevanceMap.set(table, {
              table,
              relevanceScore: 0,
              reasons: [],
              relatedTables: [],
              suggestedColumns: []
            });
          }

          const relevance = relevanceMap.get(table)!;
          relevance.relevanceScore += weight * 0.4; // 40% weight for keywords
          relevance.reasons.push(`Keyword match: "${keyword}" (weight: ${weight})`);
        }
      }

      // 2. Relationship-based relevance (tables connected to relevant tables)
      const relevantTables = Array.from(relevanceMap.keys());
      if (relevantTables.length > 0) {
        const result = await session.run(`
          MATCH (t1:Table)-[j:JOINS_TO]-(t2:Table)
          WHERE t1.name IN $tables
          RETURN DISTINCT t2.name as table, t1.name as source, j.foreignKey as fk
        `, { tables: relevantTables });

        for (const record of result.records) {
          const table = record.get('table');
          const source = record.get('source');
          const fk = record.get('fk');

          if (!relevanceMap.has(table)) {
            relevanceMap.set(table, {
              table,
              relevanceScore: 0,
              reasons: [],
              relatedTables: [],
              suggestedColumns: []
            });
          }

          const relevance = relevanceMap.get(table)!;
          relevance.relevanceScore += 0.2; // 20% weight for relationships
          relevance.reasons.push(`Related to ${source} via ${fk}`);
          relevance.relatedTables.push({ table: source, relationship: fk, weight: 0.2 });
        }
      }

      // 3. Query pattern matching
      if (context.aggregations.length > 0) {
        // Fact tables are more relevant for aggregations
        const factRelevance = relevanceMap.get('fact_trading_orders');
        if (factRelevance) {
          factRelevance.relevanceScore += 0.3;
          factRelevance.reasons.push('Contains aggregatable metrics');
        }
      }

      // 4. Time context relevance
      if (context.timeContext) {
        const timeRelevance = relevanceMap.get('dim_time');
        if (timeRelevance) {
          timeRelevance.relevanceScore += 0.2;
          timeRelevance.reasons.push('Time context detected in query');
        }
      }

      // 5. Update query statistics
      for (const table of relevanceMap.keys()) {
        await session.run(`
          MATCH (t:Table {name: $table})
          SET t.queryCount = COALESCE(t.queryCount, 0) + 1,
              t.lastQueried = datetime()
        `, { table });
      }

      // 6. Get suggested columns for each relevant table
      for (const [table, relevance] of relevanceMap.entries()) {
        const columnResult = await session.run(`
          MATCH (t:Table {name: $table})-[:HAS_COLUMN]->(c:Column)
          WHERE c.isPrimary = true OR c.isForeign = true OR c.name IN $keywords
          RETURN c.name as column
          LIMIT 5
        `, { table, keywords: context.keywords });

        relevance.suggestedColumns = columnResult.records.map(r => r.get('column'));
      }

      // Convert map to sorted array
      const results = Array.from(relevanceMap.values())
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map(r => ({
          ...r,
          relevanceScore: Math.min(r.relevanceScore, 1.0) // Normalize to 0-1
        }));

      return results;
    } finally {
      await session.close();
    }
  }

  private calculateRelevanceInMemory(context: QueryContext): TableRelevance[] {
    const relevanceMap = new Map<string, TableRelevance>();

    // Initialize all tables
    const allTables = ['fact_trading_orders', 'dim_security', 'dim_trader', 'dim_time', 'dim_counterparty', 'dim_order_type'];
    for (const table of allTables) {
      relevanceMap.set(table, {
        table,
        relevanceScore: 0,
        reasons: [],
        relatedTables: [],
        suggestedColumns: []
      });
    }

    // Calculate keyword-based relevance
    for (const keyword of context.keywords) {
      const tableWeights = this.keywordTableWeights[keyword] || {};
      for (const [table, weight] of Object.entries(tableWeights)) {
        const relevance = relevanceMap.get(table)!;
        relevance.relevanceScore += weight * 0.5;
        relevance.reasons.push(`Keyword match: "${keyword}"`);
      }
    }

    // Boost fact table for aggregations
    if (context.aggregations.length > 0) {
      const factRelevance = relevanceMap.get('fact_trading_orders')!;
      factRelevance.relevanceScore += 0.3;
      factRelevance.reasons.push('Query requires aggregation');
    }

    // Add time dimension if time context exists
    if (context.timeContext) {
      const timeRelevance = relevanceMap.get('dim_time')!;
      timeRelevance.relevanceScore += 0.2;
      timeRelevance.reasons.push('Time context in query');
    }

    // Add suggested columns
    const columnSuggestions: Record<string, string[]> = {
      'fact_trading_orders': ['order_quantity', 'order_price', 'pnl', 'order_status'],
      'dim_security': ['symbol', 'security_name', 'security_type'],
      'dim_trader': ['trader_name', 'desk', 'department'],
      'dim_time': ['date', 'hour', 'is_trading_day'],
      'dim_counterparty': ['counterparty_name', 'counterparty_type'],
      'dim_order_type': ['order_type', 'order_side']
    };

    for (const [table, columns] of Object.entries(columnSuggestions)) {
      const relevance = relevanceMap.get(table)!;
      relevance.suggestedColumns = columns;
    }

    // Sort by relevance score
    return Array.from(relevanceMap.values())
      .filter(r => r.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(r => ({
        ...r,
        relevanceScore: Math.min(r.relevanceScore, 1.0)
      }));
  }

  async getQuerySuggestions(partialQuery: string): Promise<string[]> {
    const context = this.extractQueryContext(partialQuery);
    const relevantTables = await this.calculateTableRelevance(partialQuery);
    
    const suggestions: string[] = [];
    
    // Suggest completions based on relevant tables
    if (relevantTables.length > 0) {
      const topTable = relevantTables[0];
      
      if (topTable.table === 'fact_trading_orders') {
        suggestions.push(`${partialQuery} with total volume > 1000`);
        suggestions.push(`${partialQuery} grouped by security type`);
        suggestions.push(`${partialQuery} where PnL > 0`);
      } else if (topTable.table === 'dim_security') {
        suggestions.push(`${partialQuery} for equity securities`);
        suggestions.push(`${partialQuery} in technology sector`);
      } else if (topTable.table === 'dim_trader') {
        suggestions.push(`${partialQuery} from equity desk`);
        suggestions.push(`${partialQuery} with experience level = 'Senior'`);
      }
    }

    return suggestions.slice(0, 5);
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
    }
  }
}

export const tableRelevanceService = new Neo4jTableRelevanceService();
import { neo4jSchemaService } from './neo4jSchemaService';

interface QueryIntent {
  tables: string[];
  columns: string[];
  aggregations: string[];
  conditions: string[];
  timeRange?: string;
}

export class EnhancedTextToSQLService {
  private tableKeywords: Record<string, string[]> = {
    'fact_trading_orders': ['order', 'orders', 'trade', 'trades', 'trading', 'transaction', 'transactions', 'pnl', 'profit', 'loss', 'commission'],
    'dim_security': ['security', 'securities', 'stock', 'stocks', 'bond', 'bonds', 'symbol', 'ticker', 'instrument', 'equity', 'derivative'],
    'dim_trader': ['trader', 'traders', 'desk', 'department', 'employee', 'person', 'user'],
    'dim_time': ['time', 'date', 'day', 'month', 'year', 'quarter', 'hour', 'minute', 'when', 'today', 'yesterday', 'week'],
    'dim_counterparty': ['counterparty', 'counterparties', 'client', 'clients', 'customer', 'customers', 'institution'],
    'dim_order_type': ['order type', 'limit', 'market', 'stop', 'side', 'buy', 'sell', 'algorithm', 'algorithmic']
  };

  private aggregationKeywords = {
    'COUNT': ['count', 'number', 'how many', 'total number'],
    'SUM': ['sum', 'total', 'aggregate', 'combined'],
    'AVG': ['average', 'avg', 'mean'],
    'MAX': ['maximum', 'max', 'highest', 'largest', 'biggest', 'top'],
    'MIN': ['minimum', 'min', 'lowest', 'smallest', 'least']
  };

  async parseQueryIntent(query: string): Promise<QueryIntent> {
    const lowerQuery = query.toLowerCase();
    const intent: QueryIntent = {
      tables: [],
      columns: [],
      aggregations: [],
      conditions: []
    };

    // Detect tables based on keywords
    for (const [table, keywords] of Object.entries(this.tableKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        intent.tables.push(table);
      }
    }

    // If no tables detected, default to fact table
    if (intent.tables.length === 0) {
      intent.tables.push('fact_trading_orders');
    }

    // Detect aggregations
    for (const [func, keywords] of Object.entries(this.aggregationKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        intent.aggregations.push(func);
      }
    }

    // Detect time ranges
    if (lowerQuery.includes('today')) {
      intent.timeRange = 'DATE(dt.date) = DATE(NOW())';
    } else if (lowerQuery.includes('yesterday')) {
      intent.timeRange = 'DATE(dt.date) = DATE(NOW() - INTERVAL 1 DAY)';
    } else if (lowerQuery.includes('this week')) {
      intent.timeRange = 'dt.date >= DATE(NOW() - INTERVAL 7 DAY)';
    } else if (lowerQuery.includes('this month')) {
      intent.timeRange = 'dt.date >= DATE(NOW() - INTERVAL 30 DAY)';
    }

    // Detect specific conditions
    const conditionPatterns = [
      { pattern: /pnl\s*>\s*(\d+)/i, condition: 'fo.pnl > $1' },
      { pattern: /volume\s*>\s*(\d+)/i, condition: 'fo.order_quantity > $1' },
      { pattern: /failed|cancelled|rejected/i, condition: "fo.order_status IN ('CANCELLED', 'REJECTED')" },
      { pattern: /successful|filled|completed/i, condition: "fo.order_status = 'FILLED'" },
      { pattern: /buy\s+orders?/i, condition: "dot.order_side = 'BUY'" },
      { pattern: /sell\s+orders?/i, condition: "dot.order_side = 'SELL'" }
    ];

    for (const { pattern, condition } of conditionPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        intent.conditions.push(condition.replace('$1', match[1] || ''));
      }
    }

    return intent;
  }

  async generateSQL(query: string): Promise<{ sql: string; explanation: string }> {
    const intent = await this.parseQueryIntent(query);
    
    // Get optimal join path
    const joinPath = await neo4jSchemaService.findOptimalJoinPath(intent.tables);
    
    // Build SELECT clause
    let selectClause = 'SELECT ';
    if (intent.aggregations.length > 0) {
      const aggClauses: string[] = [];
      
      if (intent.aggregations.includes('COUNT')) {
        aggClauses.push('COUNT(*) as count');
      }
      if (intent.aggregations.includes('SUM')) {
        if (query.toLowerCase().includes('volume')) {
          aggClauses.push('SUM(fo.order_quantity) as total_volume');
        }
        if (query.toLowerCase().includes('value')) {
          aggClauses.push('SUM(fo.notional_value) as total_value');
        }
        if (query.toLowerCase().includes('pnl')) {
          aggClauses.push('SUM(fo.pnl) as total_pnl');
        }
      }
      if (intent.aggregations.includes('AVG')) {
        aggClauses.push('AVG(fo.order_price) as avg_price');
      }
      
      // Add grouping columns
      if (query.toLowerCase().includes('by security')) {
        selectClause = 'ds.symbol, ds.security_type, ' + aggClauses.join(', ');
      } else if (query.toLowerCase().includes('by trader')) {
        selectClause = 'dt.trader_name, dt.desk, ' + aggClauses.join(', ');
      } else if (query.toLowerCase().includes('by type')) {
        selectClause = 'ds.security_type, ' + aggClauses.join(', ');
      } else {
        selectClause += aggClauses.join(', ');
      }
    } else {
      // Default selection
      if (joinPath.includes('dim_security')) {
        selectClause += 'ds.symbol, ds.security_name, ';
      }
      if (joinPath.includes('dim_trader')) {
        selectClause += 'dt.trader_name, ';
      }
      selectClause += 'fo.order_quantity, fo.order_price, fo.order_status, fo.pnl';
    }

    // Build FROM clause with joins
    let fromClause = '\nFROM ' + joinPath[0] + ' fo';
    const tableAliases: Record<string, string> = {
      'fact_trading_orders': 'fo',
      'dim_security': 'ds',
      'dim_trader': 'dt',
      'dim_time': 'dti',
      'dim_counterparty': 'dc',
      'dim_order_type': 'dot'
    };

    // Add joins based on the path
    for (let i = 1; i < joinPath.length; i++) {
      const table = joinPath[i];
      const alias = tableAliases[table];
      
      if (table === 'dim_security') {
        fromClause += `\nJOIN dim_security ${alias} ON fo.security_id = ${alias}.security_id`;
      } else if (table === 'dim_trader') {
        fromClause += `\nJOIN dim_trader ${alias} ON fo.trader_id = ${alias}.trader_id`;
      } else if (table === 'dim_time') {
        fromClause += `\nJOIN dim_time ${alias} ON fo.time_id = ${alias}.time_id`;
      } else if (table === 'dim_counterparty') {
        fromClause += `\nJOIN dim_counterparty ${alias} ON fo.counterparty_id = ${alias}.counterparty_id`;
      } else if (table === 'dim_order_type') {
        fromClause += `\nJOIN dim_order_type ${alias} ON fo.order_type_id = ${alias}.order_type_id`;
      }
    }

    // Build WHERE clause
    let whereClause = '';
    const conditions = [...intent.conditions];
    if (intent.timeRange && joinPath.includes('dim_time')) {
      conditions.push(intent.timeRange);
    }
    
    if (conditions.length > 0) {
      whereClause = '\nWHERE ' + conditions.join(' AND ');
    }

    // Build GROUP BY clause
    let groupByClause = '';
    if (intent.aggregations.length > 0) {
      const groupByCols: string[] = [];
      if (query.toLowerCase().includes('by security')) {
        groupByCols.push('ds.symbol', 'ds.security_type');
      } else if (query.toLowerCase().includes('by trader')) {
        groupByCols.push('dt.trader_name', 'dt.desk');
      } else if (query.toLowerCase().includes('by type')) {
        groupByCols.push('ds.security_type');
      }
      
      if (groupByCols.length > 0) {
        groupByClause = '\nGROUP BY ' + groupByCols.join(', ');
      }
    }

    // Build ORDER BY clause
    let orderByClause = '';
    if (intent.aggregations.includes('COUNT')) {
      orderByClause = '\nORDER BY count DESC';
    } else if (intent.aggregations.includes('SUM')) {
      if (query.toLowerCase().includes('volume')) {
        orderByClause = '\nORDER BY total_volume DESC';
      } else if (query.toLowerCase().includes('pnl')) {
        orderByClause = '\nORDER BY total_pnl DESC';
      }
    }

    // Add LIMIT
    const limitMatch = query.match(/top\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 20;
    const limitClause = '\nLIMIT ' + limit;

    const sql = selectClause + fromClause + whereClause + groupByClause + orderByClause + limitClause;
    
    const explanation = `This query ${intent.aggregations.length > 0 ? 'aggregates' : 'retrieves'} data from ${joinPath.join(' → ')} tables. ` +
      `${intent.conditions.length > 0 ? 'It filters by: ' + intent.conditions.join(', ') + '. ' : ''}` +
      `${intent.aggregations.length > 0 ? 'It calculates: ' + intent.aggregations.join(', ') + '. ' : ''}`;

    return { sql, explanation };
  }

  generateFollowUpQuestions(query: string, results: any[]): string[] {
    const questions: string[] = [];
    
    // Analyze the query and results to suggest relevant follow-ups
    if (query.toLowerCase().includes('trader')) {
      questions.push('What is the PnL breakdown for each trader?');
      questions.push('Show me the top performing traders by volume');
    }
    
    if (query.toLowerCase().includes('security')) {
      questions.push('Which securities have the highest trading volume?');
      questions.push('Compare equity vs derivative trading patterns');
    }
    
    if (results.length > 0 && results[0].hasOwnProperty('pnl')) {
      questions.push('What are the factors contributing to negative PnL?');
      questions.push('Show me the PnL trend over the last week');
    }
    
    if (!query.toLowerCase().includes('time')) {
      questions.push('How does this data look over the past month?');
      questions.push('Show me the hourly distribution of this activity');
    }
    
    return questions.slice(0, 3); // Return top 3 suggestions
  }
}

export const enhancedTextToSQL = new EnhancedTextToSQLService();
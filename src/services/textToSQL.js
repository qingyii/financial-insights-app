import OpenAI from 'openai';
import { z } from 'zod';
import { db } from './database.ts';

const SQLQuerySchema = z.object({
  sql: z.string(),
  explanation: z.string(),
  ambiguities: z.array(z.object({
    term: z.string(),
    possibleMeanings: z.array(z.string()).optional(),
    selectedMeaning: z.string().optional()
  })).optional(),
  followUpQuestions: z.array(z.string()).optional()
});

export class TextToSQLService {
  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ 
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Financial Trading Insights"
        }
      });
    } else {
      console.warn('OpenRouter API key not configured. Text-to-SQL features will be limited.');
      this.openai = null;
    }
    
    this.schemaCache = null;
    this.queryHistory = [];
  }

  async getSchemaInfo() {
    if (this.schemaCache) return this.schemaCache;
    
    const tables = await db.executeQuery(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    const schema = {};
    for (const table of tables) {
      const columns = await db.executeQuery(`PRAGMA table_info(${table.name})`);
      schema[table.name] = {
        sql: table.sql,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          pk: col.pk === 1,
          notnull: col.notnull === 1
        }))
      };
    }
    
    this.schemaCache = schema;
    return schema;
  }

  async processQuery(userQuery, context = {}, isFollowUp = false) {
    if (!this.openai) {
      return {
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
        sql: '',
        results: [],
        insights: ['Text-to-SQL features require an OpenAI API key.']
      };
    }
    
    try {
      const schema = await this.getSchemaInfo();
      const recentContext = isFollowUp ? this.queryHistory.slice(-3) : [];
      
      const systemPrompt = `You are a SQL expert for a financial trading database with a star schema.

Database Schema:
${JSON.stringify(schema, null, 2)}

${recentContext.length > 0 ? `Recent queries:\n${recentContext.map(q => `- ${q.query}: ${q.sql}`).join('\n')}` : ''}

User Query: ${userQuery}
Additional Context: ${JSON.stringify(context)}

Generate a SQL query to answer the user's question. Consider:
1. Identify any ambiguous terms and clarify them
2. Use appropriate JOINs between fact and dimension tables
3. Apply relevant filters and aggregations
4. Consider time ranges if mentioned
5. Handle derivatives (options, OTC) differently from equities

Return a JSON object with:
- sql: The SQL query
- explanation: Brief explanation of what the query does
- ambiguities: Array of any ambiguous terms and how they were interpreted
- followUpQuestions: Suggested follow-up questions

Common abbreviations:
- PnL: Profit and Loss
- VWAP: Volume Weighted Average Price
- OTC: Over The Counter
- Notional: Notional value (quantity × price)

Response must be valid JSON only.`;

      const response = await this.openai.chat.completions.create({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      let content = response.choices[0].message.content;
      // Handle markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      const parsed = SQLQuerySchema.parse(JSON.parse(content));
      
      // Execute the query
      const results = await db.executeQuery(parsed.sql);
      
      // Generate insights
      const insights = await this.generateInsights(userQuery, results, parsed.sql);
      
      // Store in history
      this.queryHistory.push({
        query: userQuery,
        sql: parsed.sql,
        timestamp: new Date()
      });
      
      return {
        sql: parsed.sql,
        results,
        insights,
        explanation: parsed.explanation,
        ambiguities: parsed.ambiguities,
        followUpQuestions: parsed.followUpQuestions
      };
      
    } catch (error) {
      console.error('Text-to-SQL error:', error);
      
      // Try to handle ambiguity
      if (error.message && error.message.includes('ambiguous')) {
        return this.handleAmbiguity(userQuery, error);
      }
      
      throw error;
    }
  }

  async handleAmbiguity(query, error) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `The following query is ambiguous: "${query}"
Error: ${error.message}

Suggest clarifications for the user. Return JSON with:
- clarificationNeeded: true
- suggestions: Array of clarification questions
- examples: Array of example queries that are more specific`
        }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    let content = response.choices[0].message.content;
    if (content.includes('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    return JSON.parse(content);
  }

  async generateInsights(query, results, sql) {
    if (!results || results.length === 0) {
      return ['No data found for the specified query.'];
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `Analyze these query results and provide business insights:

User Query: ${query}
SQL Used: ${sql}
Results (first 10 rows): ${JSON.stringify(results.slice(0, 10), null, 2)}

Generate 3-5 actionable insights based on the data. Consider:
1. Trends or patterns in the data
2. Outliers or unusual values
3. Performance metrics (PnL, volume, success rates)
4. Risk indicators
5. Recommendations for traders or risk managers

Return JSON with a single key "insights" containing an array of insight strings.`
        }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    let content = response.choices[0].message.content;
    if (content.includes('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    const parsed = JSON.parse(content);
    return parsed.insights || [];
  }

  async updateDataStructure(tableName, operation, definition) {
    try {
      let sql;
      
      switch (operation) {
        case 'ADD_COLUMN':
          sql = `ALTER TABLE ${tableName} ADD COLUMN ${definition.columnName} ${definition.dataType}`;
          break;
          
        case 'MODIFY_COLUMN':
          // SQLite doesn't support direct column modification
          throw new Error('Column modification requires table recreation in SQLite');
          
        case 'ADD_TABLE':
          sql = definition.createStatement;
          break;
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
      
      await db.executeQuery(sql);
      
      // Clear schema cache
      this.schemaCache = null;
      
      return {
        success: true,
        message: `Successfully executed: ${operation} on ${tableName}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
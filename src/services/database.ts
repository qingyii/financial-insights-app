import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { mockDataGenerator } from './mockDataGenerator';
import { createViewsSQL } from './createViews';
import type { 
  DimSecurity, 
  DimTrader, 
  DimCounterparty,
  FactTradingOrder 
} from '@/models/types';

export class DatabaseService {
  private db: sqlite3.Database;
  private initialized = false;
  private run: (sql: string, params?: any) => Promise<void>;
  private all: (sql: string, params?: any) => Promise<any[]>;
  private get: (sql: string, params?: any) => Promise<any>;

  constructor(dbPath: string = './data/trading.db') {
    this.db = new sqlite3.Database(dbPath);
    
    // Promisify database methods
    this.run = promisify(this.db.run.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    
    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Disable foreign keys during initialization
      await this.run('PRAGMA foreign_keys = OFF');
      
      // Check if tables already exist
      const tables = await this.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='dim_time'
      `);
      
      if (tables.length === 0) {
        // Create schema only if tables don't exist
        const schemaPath = join(process.cwd(), 'src/models/schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');
        
        // Split and execute statements
        const statements = schema.split(';').filter(stmt => stmt.trim());
        for (const stmt of statements) {
          if (stmt.trim()) {
            await this.run(stmt);
          }
        }
        
        // Populate dimensions only for new database
        await this.populateDimensions();
        
        // Generate initial historical data
        await this.generateHistoricalData();
      } else {
        console.log('Database already exists, skipping initialization');
      }
      
      // Create or update views (always run this to ensure views exist)
      console.log('Creating/updating database views...');
      const viewStatements = createViewsSQL.split(';').filter(stmt => stmt.trim());
      for (const stmt of viewStatements) {
        if (stmt.trim()) {
          try {
            await this.run(stmt);
          } catch (error) {
            console.error('Error creating view:', error);
          }
        }
      }
      
      // Re-enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async populateDimensions() {
    // Populate securities
    const securities = mockDataGenerator.getSecurities();
    for (const security of securities) {
      await this.run(`
        INSERT OR REPLACE INTO dim_security (
          security_id, symbol, security_name, security_type, exchange,
          sector, industry, market_cap_category, currency,
          underlying_symbol, strike_price, expiration_date, option_type,
          contract_size, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        security.security_id,
        security.symbol,
        security.security_name,
        security.security_type,
        security.exchange,
        security.sector,
        security.industry,
        security.market_cap_category,
        security.currency,
        security.underlying_symbol,
        security.strike_price,
        security.expiration_date?.toISOString().split('T')[0],
        security.option_type,
        security.contract_size,
        security.is_active ? 1 : 0
      ]);
    }

    // Populate traders
    const traders = mockDataGenerator.getTraders();
    for (const trader of traders) {
      await this.run(`
        INSERT OR REPLACE INTO dim_trader (
          trader_id, trader_code, trader_name, desk, department,
          experience_level, region, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        trader.trader_id,
        trader.trader_code,
        trader.trader_name,
        trader.desk,
        trader.department,
        trader.experience_level,
        trader.region,
        trader.is_active ? 1 : 0
      ]);
    }

    // Populate counterparties
    const counterparties = mockDataGenerator.getCounterparties();
    for (const counterparty of counterparties) {
      await this.run(`
        INSERT OR REPLACE INTO dim_counterparty (
          counterparty_id, counterparty_code, counterparty_name,
          counterparty_type, country, credit_rating, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        counterparty.counterparty_id,
        counterparty.counterparty_code,
        counterparty.counterparty_name,
        counterparty.counterparty_type,
        counterparty.country,
        counterparty.credit_rating,
        counterparty.is_active ? 1 : 0
      ]);
    }

    // Populate time dimension (simplified)
    await this.populateTimeDimension();
    
    // Populate order types
    await this.populateOrderTypes();
  }

  private async populateTimeDimension() {
    const now = new Date();
    
    // Generate time entries for the past 30 days
    for (let d = 0; d < 30; d++) {
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 5) { // 5-minute intervals
          const date = new Date(now);
          date.setDate(date.getDate() - d);
          date.setHours(h, m, 0, 0);
          
          const timeId = Math.floor(date.getTime() / 1000);
          const dayOfWeek = date.getDay();
          const isTradingDay = dayOfWeek > 0 && dayOfWeek < 6;
          const isMarketHours = isTradingDay && h >= 9 && h < 16;
          
          await this.run(`
            INSERT OR REPLACE INTO dim_time (
              time_id, full_datetime, date, year, quarter, month, week,
              day_of_month, day_of_week, hour, minute, is_trading_day, is_market_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            timeId,
            date.toISOString(),
            date.toISOString().split('T')[0],
            date.getFullYear(),
            Math.floor(date.getMonth() / 3) + 1,
            date.getMonth() + 1,
            Math.ceil(date.getDate() / 7),
            date.getDate(),
            dayOfWeek,
            h,
            m,
            isTradingDay ? 1 : 0,
            isMarketHours ? 1 : 0
          ]);
        }
      }
    }
  }

  private async populateOrderTypes() {
    const orderTypes = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TRAILING_STOP'];
    const orderSides = ['BUY', 'SELL'];
    const timeInForces = ['DAY', 'GTC', 'IOC', 'FOK'];
    
    let orderTypeId = 1;
    for (const orderType of orderTypes) {
      for (const orderSide of orderSides) {
        await this.run(`
          INSERT OR REPLACE INTO dim_order_type (
            order_type_id, order_type, order_side, time_in_force, is_algorithmic, algorithm_name
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          orderTypeId++,
          orderType,
          orderSide,
          timeInForces[0], // Default to DAY
          0,
          null
        ]);
      }
    }
  }

  private async generateHistoricalData() {
    const orders = mockDataGenerator.generateHistoricalOrders(1000);
    await this.insertOrders(orders);
  }

  async insertOrders(orders: FactTradingOrder[]) {
    for (const order of orders) {
      await this.run(`
        INSERT INTO fact_trading_orders (
          order_id, time_id, security_id, trader_id, counterparty_id, order_type_id,
          order_quantity, order_price, filled_quantity, average_fill_price, commission,
          order_status, order_timestamp, fill_timestamp,
          notional_value, market_value, pnl,
          order_source, execution_venue, settlement_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        order.order_id.toString(),
        order.time_id,
        order.security_id,
        order.trader_id,
        order.counterparty_id,
        order.order_type_id,
        order.order_quantity,
        order.order_price,
        order.filled_quantity,
        order.average_fill_price,
        order.commission,
        order.order_status,
        order.order_timestamp.toISOString(),
        order.fill_timestamp?.toISOString() || null,
        order.notional_value,
        order.market_value,
        order.pnl,
        order.order_source,
        order.execution_venue,
        order.settlement_date?.toISOString().split('T')[0] || null
      ]);
    }
  }

  async executeQuery(sql: string): Promise<any[]> {
    try {
      return await this.all(sql);
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  }

  async getRecentOrders(limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT * FROM v_recent_orders
      LIMIT ?
    `;
    return await this.all(sql, [limit]);
  }

  async getDailySummary(securityId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        ds.symbol,
        dt.date,
        COUNT(*) as total_trades,
        SUM(CASE WHEN dot.order_side = 'BUY' THEN fo.filled_quantity ELSE 0 END) as buy_volume,
        SUM(CASE WHEN dot.order_side = 'SELL' THEN fo.filled_quantity ELSE 0 END) as sell_volume,
        AVG(fo.average_fill_price) as avg_price,
        SUM(fo.notional_value) as total_notional,
        SUM(fo.pnl) as total_pnl
      FROM fact_trading_orders fo
      JOIN dim_time dt ON fo.time_id = dt.time_id
      JOIN dim_security ds ON fo.security_id = ds.security_id
      JOIN dim_order_type dot ON fo.order_type_id = dot.order_type_id
    `;

    const params = [];
    if (securityId) {
      sql += ` WHERE fo.security_id = ?`;
      params.push(securityId);
    }

    sql += `
      GROUP BY ds.symbol, dt.date
      ORDER BY dt.date DESC
      LIMIT 30
    `;

    return await this.all(sql, params);
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
export const db = new DatabaseService();
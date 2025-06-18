// Temporary in-memory database for Vercel deployment
// Replace this with a real database like Vercel Postgres or Supabase

let mockData = {
  orders: [],
  schema: {
    fact_trading_orders: {
      columns: [
        { name: 'order_id', type: 'VARCHAR(20)', pk: true },
        { name: 'time_id', type: 'INTEGER' },
        { name: 'security_id', type: 'INTEGER' },
        { name: 'trader_id', type: 'INTEGER' },
        { name: 'counterparty_id', type: 'INTEGER' },
        { name: 'order_type_id', type: 'INTEGER' },
        { name: 'order_quantity', type: 'DECIMAL(15,2)' },
        { name: 'order_price', type: 'DECIMAL(15,4)' },
        { name: 'filled_quantity', type: 'DECIMAL(15,2)' },
        { name: 'average_fill_price', type: 'DECIMAL(15,4)' },
        { name: 'order_status', type: 'VARCHAR(20)' },
        { name: 'pnl', type: 'DECIMAL(15,2)' }
      ]
    },
    dim_security: {
      columns: [
        { name: 'security_id', type: 'INTEGER', pk: true },
        { name: 'symbol', type: 'VARCHAR(20)' },
        { name: 'security_name', type: 'VARCHAR(100)' },
        { name: 'security_type', type: 'VARCHAR(20)' },
        { name: 'exchange', type: 'VARCHAR(10)' },
        { name: 'sector', type: 'VARCHAR(50)' },
        { name: 'currency', type: 'VARCHAR(3)' }
      ]
    },
    dim_trader: {
      columns: [
        { name: 'trader_id', type: 'INTEGER', pk: true },
        { name: 'trader_code', type: 'VARCHAR(10)' },
        { name: 'trader_name', type: 'VARCHAR(100)' },
        { name: 'desk', type: 'VARCHAR(50)' },
        { name: 'department', type: 'VARCHAR(50)' },
        { name: 'experience_level', type: 'VARCHAR(20)' }
      ]
    },
    dim_time: {
      columns: [
        { name: 'time_id', type: 'INTEGER', pk: true },
        { name: 'date', type: 'DATE' },
        { name: 'time', type: 'TIME' },
        { name: 'hour', type: 'INTEGER' },
        { name: 'day_of_week', type: 'VARCHAR(10)' },
        { name: 'month', type: 'INTEGER' },
        { name: 'quarter', type: 'INTEGER' },
        { name: 'year', type: 'INTEGER' }
      ]
    },
    dim_counterparty: {
      columns: [
        { name: 'counterparty_id', type: 'INTEGER', pk: true },
        { name: 'counterparty_code', type: 'VARCHAR(20)' },
        { name: 'counterparty_name', type: 'VARCHAR(100)' },
        { name: 'counterparty_type', type: 'VARCHAR(20)' },
        { name: 'country', type: 'VARCHAR(50)' },
        { name: 'credit_rating', type: 'VARCHAR(10)' }
      ]
    },
    dim_order_type: {
      columns: [
        { name: 'order_type_id', type: 'INTEGER', pk: true },
        { name: 'order_type', type: 'VARCHAR(20)' },
        { name: 'order_side', type: 'VARCHAR(10)' },
        { name: 'time_in_force', type: 'VARCHAR(10)' },
        { name: 'is_algorithmic', type: 'BOOLEAN' }
      ]
    },
    // Views
    v_recent_orders: {
      columns: [
        { name: 'order_id', type: 'VIEW_COLUMN' },
        { name: 'timestamp', type: 'VIEW_COLUMN' },
        { name: 'symbol', type: 'VIEW_COLUMN' },
        { name: 'trader_name', type: 'VIEW_COLUMN' },
        { name: 'side', type: 'VIEW_COLUMN' },
        { name: 'quantity', type: 'VIEW_COLUMN' },
        { name: 'price', type: 'VIEW_COLUMN' },
        { name: 'status', type: 'VIEW_COLUMN' },
        { name: 'pnl', type: 'VIEW_COLUMN' }
      ]
    },
    v_trader_performance: {
      columns: [
        { name: 'trader_id', type: 'VIEW_COLUMN' },
        { name: 'trader_name', type: 'VIEW_COLUMN' },
        { name: 'desk', type: 'VIEW_COLUMN' },
        { name: 'total_orders', type: 'VIEW_COLUMN' },
        { name: 'total_pnl', type: 'VIEW_COLUMN' },
        { name: 'avg_pnl_per_order', type: 'VIEW_COLUMN' },
        { name: 'win_rate', type: 'VIEW_COLUMN' }
      ]
    },
    v_daily_trading_summary: {
      columns: [
        { name: 'trade_date', type: 'VIEW_COLUMN' },
        { name: 'total_orders', type: 'VIEW_COLUMN' },
        { name: 'total_volume', type: 'VIEW_COLUMN' },
        { name: 'total_pnl', type: 'VIEW_COLUMN' },
        { name: 'unique_traders', type: 'VIEW_COLUMN' },
        { name: 'unique_securities', type: 'VIEW_COLUMN' }
      ]
    },
    v_security_statistics: {
      columns: [
        { name: 'symbol', type: 'VIEW_COLUMN' },
        { name: 'security_name', type: 'VIEW_COLUMN' },
        { name: 'total_orders', type: 'VIEW_COLUMN' },
        { name: 'total_volume', type: 'VIEW_COLUMN' },
        { name: 'avg_price', type: 'VIEW_COLUMN' },
        { name: 'total_pnl', type: 'VIEW_COLUMN' }
      ]
    }
  }
};

// Generate some mock orders
function generateMockOrder() {
  const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  const traders = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emily Davis', 'Robert Wilson'];
  const statuses = ['FILLED', 'PARTIAL', 'PENDING', 'CANCELLED'];
  
  return {
    order_id: orderId,
    timestamp: new Date().toISOString(),
    security_id: Math.floor(Math.random() * 5) + 1,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    trader_id: Math.floor(Math.random() * 5) + 1,
    trader_name: traders[Math.floor(Math.random() * traders.length)],
    order_quantity: Math.floor(Math.random() * 1000) + 100,
    order_price: (Math.random() * 200 + 50).toFixed(2),
    order_status: statuses[Math.floor(Math.random() * statuses.length)],
    pnl: (Math.random() * 2000 - 1000).toFixed(2)
  };
}

// Initialize with some mock data
for (let i = 0; i < 50; i++) {
  mockData.orders.push(generateMockOrder());
}

export const db = {
  getRecentOrders: (limit = 50) => {
    return mockData.orders.slice(-limit).reverse();
  },
  
  getDailySummary: () => {
    const summary = {
      total_orders: mockData.orders.length,
      total_volume: mockData.orders.reduce((sum, o) => sum + o.order_quantity, 0),
      total_pnl: mockData.orders.reduce((sum, o) => sum + parseFloat(o.pnl), 0).toFixed(2),
      unique_traders: 5,
      unique_securities: 5
    };
    return [summary];
  },
  
  getSchema: () => {
    return mockData.schema;
  },
  
  executeQuery: (sql) => {
    // Simple mock query execution
    if (sql.toLowerCase().includes('select * from v_recent_orders')) {
      return mockData.orders.slice(-10).reverse();
    }
    return [];
  },
  
  addOrder: (order) => {
    mockData.orders.push(order);
    return order;
  }
};
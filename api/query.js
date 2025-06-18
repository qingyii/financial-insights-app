import { db } from './_lib/db.js';

// Mock text-to-SQL functionality for Vercel
// In production, this would use your OpenAI integration
function processQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Simple pattern matching for demo
  if (lowerQuery.includes('recent') || lowerQuery.includes('latest')) {
    return {
      sql: 'SELECT * FROM v_recent_orders LIMIT 10',
      results: db.getRecentOrders(10),
      insights: [
        'Showing the most recent 10 orders',
        'Orders are sorted by timestamp in descending order',
        'Average order size is approximately 500 shares'
      ],
      explanation: 'Retrieved recent trading orders from the database'
    };
  }
  
  if (lowerQuery.includes('summary') || lowerQuery.includes('daily')) {
    return {
      sql: 'SELECT * FROM v_daily_trading_summary',
      results: db.getDailySummary(),
      insights: [
        'Today\'s trading volume is within normal range',
        'PnL is positive for the day',
        'All traders are active'
      ],
      explanation: 'Generated daily trading summary'
    };
  }
  
  // Default response
  return {
    sql: 'SELECT * FROM fact_trading_orders LIMIT 5',
    results: db.getRecentOrders(5),
    insights: ['Showing sample trading data'],
    explanation: 'Retrieved sample orders'
  };
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { query } = req.body;
    
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }
    
    const result = processQuery(query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
import { db } from './_lib/db.js';

// Server-Sent Events endpoint for real-time updates
// This replaces WebSocket functionality
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection message
  res.write('data: {"type": "connected", "message": "Connected to real-time feed"}\n\n');
  
  // Generate and send mock orders periodically
  const interval = setInterval(() => {
    const order = generateOrder();
    db.addOrder(order);
    
    const data = {
      type: 'order',
      data: order
    };
    
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 3000); // Send new order every 3 seconds
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}

function generateOrder() {
  const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  const traders = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emily Davis', 'Robert Wilson'];
  const statuses = ['FILLED', 'PARTIAL', 'PENDING'];
  const sides = ['BUY', 'SELL'];
  
  return {
    order_id: orderId,
    timestamp: new Date().toISOString(),
    security_id: Math.floor(Math.random() * 5) + 1,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    trader_id: Math.floor(Math.random() * 5) + 1,
    trader_name: traders[Math.floor(Math.random() * traders.length)],
    side: sides[Math.floor(Math.random() * sides.length)],
    order_quantity: Math.floor(Math.random() * 1000) + 100,
    order_price: (Math.random() * 200 + 50).toFixed(2),
    order_status: statuses[Math.floor(Math.random() * statuses.length)],
    pnl: (Math.random() * 2000 - 1000).toFixed(2)
  };
}
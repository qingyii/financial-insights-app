import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { db } from './services/database.ts';
import { mockDataGenerator } from './services/mockDataGenerator.ts';
import { TextToSQLService } from './services/textToSQL.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize database on startup
await db.initialize();

// Initialize text-to-SQL service
const textToSQL = new TextToSQLService();

// REST API Endpoints

// Get recent orders
app.get('/api/orders/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const orders = await db.getRecentOrders(limit);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily summary
app.get('/api/summary/daily', async (req, res) => {
  try {
    const securityId = req.query.securityId ? parseInt(req.query.securityId) : undefined;
    const summary = await db.getDailySummary(securityId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Natural language query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { query, context, followUp } = req.body;
    const result = await textToSQL.processQuery(query, context, followUp);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schema information
app.get('/api/schema', async (req, res) => {
  try {
    const schema = await textToSQL.getSchemaInfo();
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update data structure
app.post('/api/schema/update', async (req, res) => {
  try {
    const { tableName, operation, definition } = req.body;
    const result = await textToSQL.updateDataStructure(tableName, operation, definition);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket for real-time order flow
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  clients.add(ws);
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Generate and broadcast real-time orders
setInterval(() => {
  if (clients.size > 0) {
    const order = mockDataGenerator.generateRealtimeOrder();
    
    // Insert into database
    db.insertOrders([order]).catch(console.error);
    
    // Broadcast to all connected clients
    const orderData = {
      type: 'order',
      data: {
        order_id: order.order_id.toString(),
        timestamp: order.order_timestamp,
        security_id: order.security_id,
        trader_id: order.trader_id,
        order_quantity: order.order_quantity,
        order_price: order.order_price,
        order_status: order.order_status,
        pnl: order.pnl
      }
    };
    
    clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(orderData));
      }
    });
  }
}, 2000); // Generate new order every 2 seconds

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});
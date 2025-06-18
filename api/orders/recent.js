import { db } from '../_lib/db.js';

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
  
  try {
    const limit = parseInt(req.query.limit) || 50;
    const orders = db.getRecentOrders(limit);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
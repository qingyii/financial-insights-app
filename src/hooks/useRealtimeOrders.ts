import { useEffect, useState, useRef } from 'react';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

interface Order {
  order_id: string;
  timestamp: string;
  symbol: string;
  trader_name: string;
  side: string;
  order_quantity: number;
  order_price: string;
  order_status: string;
  pnl: string;
}

export const useRealtimeOrders = (maxOrders = 50) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect in browser environment
    if (typeof window === 'undefined') return;

    const connectToRealtime = () => {
      try {
        // For development, use polling instead of SSE due to Vite proxy limitations
        if (import.meta.env.DEV) {
          // Polling fallback for development
          const pollInterval = setInterval(async () => {
            try {
              const response = await fetch(buildApiUrl(API_ENDPOINTS.RECENT_ORDERS, { limit: 5 }));
              if (response.ok) {
                const newOrders = await response.json();
                setOrders(prev => {
                  const combined = [...newOrders, ...prev];
                  return combined.slice(0, maxOrders);
                });
                setIsConnected(true);
              }
            } catch (err) {
              console.error('Polling error:', err);
            }
          }, 3000);

          return () => clearInterval(pollInterval);
        }

        // SSE for production
        const eventSource = new EventSource(buildApiUrl(API_ENDPOINTS.REALTIME));
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('Connected to real-time feed');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'order') {
              setOrders(prevOrders => {
                const newOrders = [data.data, ...prevOrders];
                return newOrders.slice(0, maxOrders);
              });
            }
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE error:', err);
          setIsConnected(false);
          setError('Connection lost. Retrying...');
          
          // Reconnect after 5 seconds
          setTimeout(() => {
            eventSource.close();
            connectToRealtime();
          }, 5000);
        };

      } catch (err) {
        console.error('Failed to connect to real-time feed:', err);
        setError('Failed to connect to real-time feed');
        setIsConnected(false);
      }
    };

    connectToRealtime();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [maxOrders]);

  return {
    orders,
    isConnected,
    error
  };
};
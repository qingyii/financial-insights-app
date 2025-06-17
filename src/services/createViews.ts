export const createViewsSQL = `
-- View: Recent Orders with Full Details
CREATE VIEW IF NOT EXISTS v_recent_orders AS
SELECT 
  fo.order_id,
  dt.date || ' ' || dt.time AS full_datetime,
  dt.date,
  dt.time,
  dt.hour,
  ds.symbol,
  ds.security_name,
  ds.security_type,
  ds.exchange,
  dtr.trader_code,
  dtr.trader_name,
  dtr.desk,
  dc.counterparty_code,
  dc.counterparty_name,
  dot.order_type,
  dot.order_side,
  fo.order_quantity,
  fo.order_price,
  fo.filled_quantity,
  fo.average_fill_price,
  fo.commission,
  fo.order_status,
  fo.notional_value,
  fo.market_value,
  fo.pnl,
  fo.order_source,
  fo.execution_venue,
  fo.order_timestamp,
  fo.fill_timestamp
FROM fact_trading_orders fo
JOIN dim_time dt ON fo.time_id = dt.time_id
JOIN dim_security ds ON fo.security_id = ds.security_id
JOIN dim_trader dtr ON fo.trader_id = dtr.trader_id
JOIN dim_counterparty dc ON fo.counterparty_id = dc.counterparty_id
JOIN dim_order_type dot ON fo.order_type_id = dot.order_type_id
ORDER BY fo.order_timestamp DESC;

-- View: Trader Performance Summary
CREATE VIEW IF NOT EXISTS v_trader_performance AS
SELECT 
  dtr.trader_id,
  dtr.trader_code,
  dtr.trader_name,
  dtr.desk,
  dtr.department,
  COUNT(DISTINCT fo.order_id) as total_orders,
  COUNT(DISTINCT CASE WHEN fo.order_status = 'FILLED' THEN fo.order_id END) as filled_orders,
  SUM(fo.filled_quantity) as total_volume,
  SUM(fo.notional_value) as total_notional,
  SUM(fo.pnl) as total_pnl,
  AVG(fo.pnl) as avg_pnl_per_trade,
  CASE 
    WHEN COUNT(DISTINCT fo.order_id) > 0 
    THEN CAST(COUNT(DISTINCT CASE WHEN fo.order_status = 'FILLED' THEN fo.order_id END) AS REAL) * 100 / COUNT(DISTINCT fo.order_id)
    ELSE 0 
  END as fill_rate
FROM dim_trader dtr
LEFT JOIN fact_trading_orders fo ON dtr.trader_id = fo.trader_id
WHERE dtr.is_active = 1
GROUP BY dtr.trader_id, dtr.trader_code, dtr.trader_name, dtr.desk, dtr.department;

-- View: Security Trading Statistics
CREATE VIEW IF NOT EXISTS v_security_statistics AS
SELECT 
  ds.security_id,
  ds.symbol,
  ds.security_name,
  ds.security_type,
  ds.exchange,
  ds.sector,
  COUNT(DISTINCT fo.order_id) as total_trades,
  SUM(fo.filled_quantity) as total_volume,
  AVG(fo.average_fill_price) as avg_price,
  MIN(fo.average_fill_price) as min_price,
  MAX(fo.average_fill_price) as max_price,
  SUM(fo.notional_value) as total_notional,
  COUNT(DISTINCT fo.trader_id) as unique_traders,
  COUNT(DISTINCT fo.counterparty_id) as unique_counterparties
FROM dim_security ds
LEFT JOIN fact_trading_orders fo ON ds.security_id = fo.security_id
WHERE ds.is_active = 1
GROUP BY ds.security_id, ds.symbol, ds.security_name, ds.security_type, ds.exchange, ds.sector;

-- View: Daily Trading Summary
CREATE VIEW IF NOT EXISTS v_daily_trading_summary AS
SELECT 
  dt.date,
  dt.day_of_week,
  dt.week_of_year,
  dt.month,
  dt.quarter,
  COUNT(DISTINCT fo.order_id) as total_orders,
  COUNT(DISTINCT fo.security_id) as unique_securities,
  COUNT(DISTINCT fo.trader_id) as unique_traders,
  SUM(CASE WHEN dot.order_side = 'BUY' THEN fo.filled_quantity ELSE 0 END) as buy_volume,
  SUM(CASE WHEN dot.order_side = 'SELL' THEN fo.filled_quantity ELSE 0 END) as sell_volume,
  SUM(fo.filled_quantity) as total_volume,
  SUM(fo.notional_value) as total_notional,
  SUM(fo.commission) as total_commission,
  SUM(fo.pnl) as total_pnl,
  COUNT(CASE WHEN fo.order_status = 'FILLED' THEN 1 END) as filled_orders,
  COUNT(CASE WHEN fo.order_status = 'CANCELLED' THEN 1 END) as cancelled_orders,
  COUNT(CASE WHEN fo.order_status = 'REJECTED' THEN 1 END) as rejected_orders
FROM dim_time dt
LEFT JOIN fact_trading_orders fo ON dt.time_id = fo.time_id
LEFT JOIN dim_order_type dot ON fo.order_type_id = dot.order_type_id
GROUP BY dt.date, dt.day_of_week, dt.week_of_year, dt.month, dt.quarter;

-- View: Order Type Analysis
CREATE VIEW IF NOT EXISTS v_order_type_analysis AS
SELECT 
  dot.order_type,
  dot.order_side,
  dot.is_algorithmic,
  dot.algorithm_name,
  COUNT(DISTINCT fo.order_id) as order_count,
  SUM(fo.filled_quantity) as total_volume,
  AVG(fo.filled_quantity) as avg_order_size,
  SUM(fo.notional_value) as total_notional,
  AVG(fo.commission) as avg_commission,
  COUNT(CASE WHEN fo.order_status = 'FILLED' THEN 1 END) as filled_count,
  COUNT(CASE WHEN fo.order_status = 'PARTIAL' THEN 1 END) as partial_count,
  COUNT(CASE WHEN fo.order_status = 'CANCELLED' THEN 1 END) as cancelled_count
FROM dim_order_type dot
LEFT JOIN fact_trading_orders fo ON dot.order_type_id = fo.order_type_id
GROUP BY dot.order_type, dot.order_side, dot.is_algorithmic, dot.algorithm_name;

-- View: Counterparty Exposure
CREATE VIEW IF NOT EXISTS v_counterparty_exposure AS
SELECT 
  dc.counterparty_id,
  dc.counterparty_code,
  dc.counterparty_name,
  dc.counterparty_type,
  dc.country,
  dc.credit_rating,
  COUNT(DISTINCT fo.order_id) as total_trades,
  COUNT(DISTINCT fo.security_id) as unique_securities,
  COUNT(DISTINCT fo.trader_id) as unique_traders,
  SUM(fo.notional_value) as total_exposure,
  SUM(CASE WHEN dot.order_side = 'BUY' THEN fo.notional_value ELSE 0 END) as buy_exposure,
  SUM(CASE WHEN dot.order_side = 'SELL' THEN fo.notional_value ELSE 0 END) as sell_exposure,
  AVG(fo.notional_value) as avg_trade_size,
  MAX(fo.notional_value) as max_single_exposure
FROM dim_counterparty dc
LEFT JOIN fact_trading_orders fo ON dc.counterparty_id = fo.counterparty_id
LEFT JOIN dim_order_type dot ON fo.order_type_id = dot.order_type_id
WHERE dc.is_active = 1
GROUP BY dc.counterparty_id, dc.counterparty_code, dc.counterparty_name, 
         dc.counterparty_type, dc.country, dc.credit_rating;

-- View: Hourly Trading Activity
CREATE VIEW IF NOT EXISTS v_hourly_trading_activity AS
SELECT 
  dt.hour,
  COUNT(DISTINCT fo.order_id) as order_count,
  SUM(fo.filled_quantity) as total_volume,
  AVG(fo.filled_quantity) as avg_volume,
  COUNT(DISTINCT fo.security_id) as unique_securities,
  COUNT(DISTINCT fo.trader_id) as active_traders,
  SUM(CASE WHEN dot.order_side = 'BUY' THEN 1 ELSE 0 END) as buy_orders,
  SUM(CASE WHEN dot.order_side = 'SELL' THEN 1 ELSE 0 END) as sell_orders,
  AVG(CASE WHEN fo.order_status = 'FILLED' THEN 
    (julianday(fo.fill_timestamp) - julianday(fo.order_timestamp)) * 24 * 60 * 60 
  END) as avg_fill_time_seconds
FROM dim_time dt
LEFT JOIN fact_trading_orders fo ON dt.time_id = fo.time_id
LEFT JOIN dim_order_type dot ON fo.order_type_id = dot.order_type_id
GROUP BY dt.hour
ORDER BY dt.hour;

-- View: Top Trading Pairs
CREATE VIEW IF NOT EXISTS v_top_trading_pairs AS
SELECT 
  dtr.trader_name,
  dc.counterparty_name,
  ds.symbol,
  COUNT(*) as trade_count,
  SUM(fo.filled_quantity) as total_volume,
  SUM(fo.notional_value) as total_notional,
  AVG(fo.pnl) as avg_pnl
FROM fact_trading_orders fo
JOIN dim_trader dtr ON fo.trader_id = dtr.trader_id
JOIN dim_counterparty dc ON fo.counterparty_id = dc.counterparty_id
JOIN dim_security ds ON fo.security_id = ds.security_id
WHERE fo.order_status = 'FILLED'
GROUP BY dtr.trader_name, dc.counterparty_name, ds.symbol
HAVING COUNT(*) >= 5
ORDER BY total_notional DESC
LIMIT 100;
`;
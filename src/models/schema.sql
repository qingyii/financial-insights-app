-- Star Schema for Financial Trading Data

-- Dimension Tables

-- Time Dimension
CREATE TABLE dim_time (
    time_id INTEGER PRIMARY KEY,
    full_datetime TIMESTAMP NOT NULL,
    date DATE NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month INTEGER NOT NULL,
    week INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    is_trading_day BOOLEAN NOT NULL,
    is_market_hours BOOLEAN NOT NULL
);

-- Security Dimension
CREATE TABLE dim_security (
    security_id INTEGER PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    security_name VARCHAR(255) NOT NULL,
    security_type VARCHAR(50) NOT NULL, -- 'EQUITY', 'OPTION', 'FUTURE', 'BOND', 'OTC_DERIVATIVE'
    exchange VARCHAR(50),
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap_category VARCHAR(20), -- 'LARGE', 'MID', 'SMALL', 'MICRO'
    currency VARCHAR(3),
    -- Derivative specific fields
    underlying_symbol VARCHAR(20),
    strike_price DECIMAL(15,4),
    expiration_date DATE,
    option_type VARCHAR(10), -- 'CALL', 'PUT'
    contract_size INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- Trader Dimension
CREATE TABLE dim_trader (
    trader_id INTEGER PRIMARY KEY,
    trader_code VARCHAR(50) NOT NULL,
    trader_name VARCHAR(255) NOT NULL,
    desk VARCHAR(100),
    department VARCHAR(100),
    experience_level VARCHAR(20), -- 'JUNIOR', 'MID', 'SENIOR', 'PRINCIPAL'
    region VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Counterparty Dimension
CREATE TABLE dim_counterparty (
    counterparty_id INTEGER PRIMARY KEY,
    counterparty_code VARCHAR(50) NOT NULL,
    counterparty_name VARCHAR(255) NOT NULL,
    counterparty_type VARCHAR(50), -- 'BROKER', 'BANK', 'HEDGE_FUND', 'MARKET_MAKER', 'RETAIL'
    country VARCHAR(50),
    credit_rating VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE
);

-- Order Type Dimension
CREATE TABLE dim_order_type (
    order_type_id INTEGER PRIMARY KEY,
    order_type VARCHAR(50) NOT NULL, -- 'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TRAILING_STOP'
    order_side VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    time_in_force VARCHAR(20), -- 'DAY', 'GTC', 'IOC', 'FOK'
    is_algorithmic BOOLEAN DEFAULT FALSE,
    algorithm_name VARCHAR(100)
);

-- Fact Table - Trading Orders
CREATE TABLE fact_trading_orders (
    order_id BIGINT PRIMARY KEY,
    time_id INTEGER REFERENCES dim_time(time_id),
    security_id INTEGER REFERENCES dim_security(security_id),
    trader_id INTEGER REFERENCES dim_trader(trader_id),
    counterparty_id INTEGER REFERENCES dim_counterparty(counterparty_id),
    order_type_id INTEGER REFERENCES dim_order_type(order_type_id),
    
    -- Measures
    order_quantity DECIMAL(15,4) NOT NULL,
    order_price DECIMAL(15,4),
    filled_quantity DECIMAL(15,4) DEFAULT 0,
    average_fill_price DECIMAL(15,4),
    commission DECIMAL(15,4) DEFAULT 0,
    
    -- Order lifecycle
    order_status VARCHAR(20) NOT NULL, -- 'NEW', 'PARTIAL', 'FILLED', 'CANCELLED', 'REJECTED'
    order_timestamp TIMESTAMP NOT NULL,
    fill_timestamp TIMESTAMP,
    
    -- Risk metrics
    notional_value DECIMAL(20,4),
    market_value DECIMAL(20,4),
    pnl DECIMAL(15,4),
    
    -- Additional attributes
    order_source VARCHAR(50), -- 'MANUAL', 'ALGO', 'API', 'MOBILE'
    execution_venue VARCHAR(50),
    settlement_date DATE
);

-- Create indexes separately
CREATE INDEX idx_time ON fact_trading_orders(time_id);
CREATE INDEX idx_security ON fact_trading_orders(security_id);
CREATE INDEX idx_trader ON fact_trading_orders(trader_id);
CREATE INDEX idx_status ON fact_trading_orders(order_status);
CREATE INDEX idx_timestamp ON fact_trading_orders(order_timestamp);

-- Aggregate Fact Table - Daily Trading Summary
CREATE TABLE fact_daily_trading_summary (
    summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_id INTEGER REFERENCES dim_time(time_id),
    security_id INTEGER REFERENCES dim_security(security_id),
    
    -- Volume metrics
    total_volume DECIMAL(20,4),
    buy_volume DECIMAL(20,4),
    sell_volume DECIMAL(20,4),
    
    -- Price metrics
    open_price DECIMAL(15,4),
    high_price DECIMAL(15,4),
    low_price DECIMAL(15,4),
    close_price DECIMAL(15,4),
    vwap DECIMAL(15,4), -- Volume Weighted Average Price
    
    -- Trade counts
    total_trades INTEGER,
    successful_trades INTEGER,
    cancelled_trades INTEGER,
    
    -- Value metrics
    total_notional DECIMAL(25,4),
    total_commission DECIMAL(15,4),
    net_pnl DECIMAL(15,4)
);

-- Create indexes for daily trading summary
CREATE INDEX idx_date ON fact_daily_trading_summary(date_id);
CREATE INDEX idx_security_date ON fact_daily_trading_summary(security_id, date_id);

-- Views for common queries
CREATE VIEW v_recent_orders AS
SELECT 
    fo.order_id,
    fo.order_timestamp as full_datetime,
    ds.symbol,
    ds.security_name,
    ds.security_type,
    dtr.trader_name,
    dot.order_type,
    dot.order_side,
    fo.order_quantity,
    fo.order_price,
    fo.average_fill_price,
    fo.filled_quantity,
    fo.order_status,
    fo.pnl
FROM fact_trading_orders fo
LEFT JOIN dim_time dt ON fo.time_id = dt.time_id
JOIN dim_security ds ON fo.security_id = ds.security_id
JOIN dim_trader dtr ON fo.trader_id = dtr.trader_id
JOIN dim_order_type dot ON fo.order_type_id = dot.order_type_id
WHERE fo.order_timestamp >= datetime('now', '-7 days')
ORDER BY fo.order_timestamp DESC;
// Star Schema Type Definitions

// Enums
export enum SecurityType {
  EQUITY = 'EQUITY',
  OPTION = 'OPTION',
  FUTURE = 'FUTURE',
  BOND = 'BOND',
  OTC_DERIVATIVE = 'OTC_DERIVATIVE',
  MONEY_MARKET = 'MONEY_MARKET',
  CASH = 'CASH',
  FX_SPOT = 'FX_SPOT',
  FX_FORWARD = 'FX_FORWARD',
  SWAP = 'SWAP',
  CREDIT_DEFAULT_SWAP = 'CREDIT_DEFAULT_SWAP',
  REPO = 'REPO',
  COMMODITY = 'COMMODITY',
  ETF = 'ETF'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TRAILING_STOP = 'TRAILING_STOP'
}

export enum OrderStatus {
  NEW = 'NEW',
  PARTIAL = 'PARTIAL',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum TimeInForce {
  DAY = 'DAY',
  GTC = 'GTC',
  IOC = 'IOC',
  FOK = 'FOK'
}

// Dimension Interfaces
export interface DimTime {
  time_id: number;
  full_datetime: Date;
  date: Date;
  year: number;
  quarter: number;
  month: number;
  week: number;
  day_of_month: number;
  day_of_week: number;
  hour: number;
  minute: number;
  is_trading_day: boolean;
  is_market_hours: boolean;
}

export interface DimSecurity {
  security_id: number;
  symbol: string;
  security_name: string;
  security_type: SecurityType;
  exchange?: string;
  sector?: string;
  industry?: string;
  market_cap_category?: 'LARGE' | 'MID' | 'SMALL' | 'MICRO';
  currency?: string;
  // Derivative specific
  underlying_symbol?: string;
  strike_price?: number;
  expiration_date?: Date;
  option_type?: 'CALL' | 'PUT';
  contract_size?: number;
  is_active: boolean;
}

export interface DimTrader {
  trader_id: number;
  trader_code: string;
  trader_name: string;
  desk?: string;
  department?: string;
  experience_level?: 'JUNIOR' | 'MID' | 'SENIOR' | 'PRINCIPAL';
  region?: string;
  is_active: boolean;
}

export interface DimCounterparty {
  counterparty_id: number;
  counterparty_code: string;
  counterparty_name: string;
  counterparty_type?: 'BROKER' | 'BANK' | 'HEDGE_FUND' | 'MARKET_MAKER' | 'RETAIL';
  country?: string;
  credit_rating?: string;
  is_active: boolean;
}

export interface DimOrderType {
  order_type_id: number;
  order_type: OrderType;
  order_side: OrderSide;
  time_in_force?: TimeInForce;
  is_algorithmic: boolean;
  algorithm_name?: string;
}

// Fact Interfaces
export interface FactTradingOrder {
  order_id: bigint;
  time_id: number;
  security_id: number;
  trader_id: number;
  counterparty_id: number;
  order_type_id: number;
  
  // Measures
  order_quantity: number;
  order_price?: number;
  filled_quantity: number;
  average_fill_price?: number;
  commission: number;
  
  // Order lifecycle
  order_status: OrderStatus;
  order_timestamp: Date;
  fill_timestamp?: Date;
  
  // Risk metrics
  notional_value?: number;
  market_value?: number;
  pnl?: number;
  
  // Additional
  order_source?: 'MANUAL' | 'ALGO' | 'API' | 'MOBILE';
  execution_venue?: string;
  settlement_date?: Date;
}

export interface FactDailyTradingSummary {
  summary_id: bigint;
  date_id: number;
  security_id: number;
  
  // Volume metrics
  total_volume: number;
  buy_volume: number;
  sell_volume: number;
  
  // Price metrics
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  vwap: number;
  
  // Trade counts
  total_trades: number;
  successful_trades: number;
  cancelled_trades: number;
  
  // Value metrics
  total_notional: number;
  total_commission: number;
  net_pnl: number;
}

// API Response Types
export interface OrderFlow {
  order_id: string;
  timestamp: Date;
  symbol: string;
  security_type: SecurityType;
  trader_name: string;
  order_type: OrderType;
  order_side: OrderSide;
  quantity: number;
  price: number;
  status: OrderStatus;
  pnl?: number;
}

export interface QueryRequest {
  query: string;
  context?: Record<string, any>;
  followUp?: boolean;
}

export interface QueryResponse {
  sql: string;
  results: any[];
  insights: string[];
  clarificationNeeded?: {
    ambiguity: string;
    suggestions: string[];
  };
}

export interface DataStructureUpdate {
  tableName: string;
  operation: 'ADD_COLUMN' | 'MODIFY_COLUMN' | 'ADD_TABLE';
  definition: Record<string, any>;
}
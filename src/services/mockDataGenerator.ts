import { 
  SecurityType, 
  OrderSide, 
  OrderType, 
  OrderStatus,
  TimeInForce,
  DimSecurity,
  DimTrader,
  DimCounterparty,
  FactTradingOrder
} from '@/models/types';

// Mock data pools with realistic market data
const EQUITY_DATA = {
  'AAPL': { name: 'Apple Inc.', price: 195.89, description: 'Technology company that designs and manufactures consumer electronics, software, and services' },
  'GOOGL': { name: 'Alphabet Inc. Class A', price: 175.43, description: 'Multinational technology company specializing in internet services and products' },
  'MSFT': { name: 'Microsoft Corporation', price: 425.17, description: 'Technology company developing computer software, consumer electronics, and cloud services' },
  'AMZN': { name: 'Amazon.com Inc.', price: 186.51, description: 'E-commerce and cloud computing company offering online retail and web services' },
  'TSLA': { name: 'Tesla Inc.', price: 248.98, description: 'Electric vehicle and clean energy company manufacturing electric cars and energy storage' },
  'JPM': { name: 'JPMorgan Chase & Co.', price: 249.85, description: 'Multinational investment bank and financial services holding company' },
  'BAC': { name: 'Bank of America Corp.', price: 45.78, description: 'Multinational investment bank and financial services holding company' },
  'NVDA': { name: 'NVIDIA Corporation', price: 878.54, description: 'Technology company designing graphics processing units for gaming and professional markets' },
  'META': { name: 'Meta Platforms Inc.', price: 563.33, description: 'Technology company operating social networking platforms including Facebook and Instagram' },
  'NFLX': { name: 'Netflix Inc.', price: 825.73, description: 'Streaming entertainment service with TV series, documentaries and feature films' }
};

const SECURITY_TYPE_DESCRIPTIONS = {
  'EQUITY': 'Common stock representing ownership shares in a corporation',
  'OPTION': 'Financial derivative giving the right to buy or sell an underlying asset at a specific price',
  'OTC_DERIVATIVE': 'Over-the-counter derivative contract traded directly between parties outside formal exchanges'
};

const ORDER_TYPE_DESCRIPTIONS = {
  'MARKET': 'Order to buy or sell immediately at the best available current price',
  'LIMIT': 'Order to buy or sell at a specific price or better',
  'STOP': 'Order that becomes a market order when the stop price is reached',
  'STOP_LIMIT': 'Order that becomes a limit order when the stop price is reached',
  'TRAILING_STOP': 'Stop order that adjusts with favorable price movements'
};

const EQUITY_SYMBOLS = Object.keys(EQUITY_DATA);
const OPTION_UNDERLYINGS = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA'];
const EXCHANGES = ['NYSE', 'NASDAQ', 'CBOE', 'CME', 'OTC'];
const DESKS = ['Equity Trading', 'Derivatives', 'Fixed Income', 'FX', 'Commodities'];
const COUNTERPARTY_NAMES = ['Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'Citadel', 'Virtu', 'Jane Street'];

export class MockDataGenerator {
  private securities: DimSecurity[] = [];
  private traders: DimTrader[] = [];
  private counterparties: DimCounterparty[] = [];
  private currentOrderId = 1000000;

  constructor() {
    this.initializeDimensions();
  }

  private initializeDimensions() {
    // Generate securities
    this.generateEquities();
    this.generateDerivatives();
    
    // Generate traders
    this.generateTraders();
    
    // Generate counterparties
    this.generateCounterparties();
  }

  private generateEquities() {
    EQUITY_SYMBOLS.forEach((symbol, idx) => {
      const equityData = EQUITY_DATA[symbol as keyof typeof EQUITY_DATA];
      this.securities.push({
        security_id: idx + 1,
        symbol,
        security_name: equityData.name,
        security_type: SecurityType.EQUITY,
        exchange: ['AAPL', 'MSFT', 'JPM', 'BAC'].includes(symbol) ? 'NASDAQ' : 'NYSE',
        sector: this.getSectorForSymbol(symbol),
        industry: this.getIndustryForSymbol(symbol),
        market_cap_category: this.randomFrom(['LARGE', 'MID'] as any),
        currency: 'USD',
        is_active: true
      });
    });
  }

  private getSectorForSymbol(symbol: string): string {
    const sectorMap: Record<string, string> = {
      'AAPL': 'Technology',
      'GOOGL': 'Technology', 
      'MSFT': 'Technology',
      'AMZN': 'Consumer Discretionary',
      'TSLA': 'Consumer Discretionary',
      'JPM': 'Financials',
      'BAC': 'Financials',
      'NVDA': 'Technology',
      'META': 'Communication Services',
      'NFLX': 'Communication Services'
    };
    return sectorMap[symbol] || 'Technology';
  }

  private getIndustryForSymbol(symbol: string): string {
    const industryMap: Record<string, string> = {
      'AAPL': 'Consumer Electronics',
      'GOOGL': 'Internet & Direct Marketing',
      'MSFT': 'Software',
      'AMZN': 'Internet Retail',
      'TSLA': 'Electric Vehicles', 
      'JPM': 'Investment Banking',
      'BAC': 'Commercial Banking',
      'NVDA': 'Semiconductors',
      'META': 'Social Media',
      'NFLX': 'Entertainment Streaming'
    };
    return industryMap[symbol] || 'Software';
  }

  private generateDerivatives() {
    let secId = this.securities.length + 1;
    
    // Options
    OPTION_UNDERLYINGS.forEach(underlying => {
      const strikes = [90, 95, 100, 105, 110].map(pct => {
        const basePrice = 100 + Math.random() * 400;
        return Math.round(basePrice * pct / 100);
      });
      
      strikes.forEach(strike => {
        ['CALL', 'PUT'].forEach(optionType => {
          this.securities.push({
            security_id: secId++,
            symbol: `${underlying}${strike}${optionType[0]}`,
            security_name: `${underlying} ${strike} ${optionType}`,
            security_type: SecurityType.OPTION,
            exchange: 'CBOE',
            currency: 'USD',
            underlying_symbol: underlying,
            strike_price: strike,
            expiration_date: this.futureDate(30, 90),
            option_type: optionType as any,
            contract_size: 100,
            is_active: true
          });
        });
      });
    });

    // OTC Derivatives
    for (let i = 0; i < 10; i++) {
      this.securities.push({
        security_id: secId++,
        symbol: `OTC_SWAP_${i}`,
        security_name: `Interest Rate Swap ${i}`,
        security_type: SecurityType.OTC_DERIVATIVE,
        exchange: 'OTC',
        currency: 'USD',
        is_active: true
      });
    }
  }

  private generateTraders() {
    const names = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Wang', 'Tom Brown', 
                   'Emma Davis', 'Alex Kim', 'Maria Garcia', 'James Wilson', 'Olivia Taylor'];
    
    names.forEach((name, idx) => {
      this.traders.push({
        trader_id: idx + 1,
        trader_code: `TR${String(idx + 1).padStart(3, '0')}`,
        trader_name: name,
        desk: this.randomFrom(DESKS),
        department: 'Trading',
        experience_level: this.randomFrom(['JUNIOR', 'MID', 'SENIOR', 'PRINCIPAL'] as any),
        region: this.randomFrom(['Americas', 'EMEA', 'APAC']),
        is_active: true
      });
    });
  }

  private generateCounterparties() {
    COUNTERPARTY_NAMES.forEach((name, idx) => {
      this.counterparties.push({
        counterparty_id: idx + 1,
        counterparty_code: `CP${String(idx + 1).padStart(3, '0')}`,
        counterparty_name: name,
        counterparty_type: this.randomFrom(['BROKER', 'BANK', 'MARKET_MAKER'] as any),
        country: 'USA',
        credit_rating: this.randomFrom(['AAA', 'AA', 'A', 'BBB']),
        is_active: true
      });
    });
  }

  public generateRealtimeOrder(): FactTradingOrder {
    const security = this.randomFrom(this.securities);
    const trader = this.randomFrom(this.traders);
    const counterparty = this.randomFrom(this.counterparties);
    
    const orderType = this.randomFrom(Object.values(OrderType));
    const orderSide = this.randomFrom(Object.values(OrderSide));
    const quantity = Math.round(Math.random() * 10000 + 100);
    // Use realistic market prices
    let basePrice = 100;
    if (security.security_type === SecurityType.EQUITY && EQUITY_DATA[security.symbol as keyof typeof EQUITY_DATA]) {
      const equityData = EQUITY_DATA[security.symbol as keyof typeof EQUITY_DATA];
      basePrice = equityData.price + (Math.random() - 0.5) * equityData.price * 0.02; // ±2% variation
    } else if (security.security_type === SecurityType.OPTION) {
      basePrice = 5 + Math.random() * 45; // Options typically $5-50
    } else {
      basePrice = 50 + Math.random() * 450; // OTC derivatives
    }
    
    const orderPrice = orderType === OrderType.MARKET ? undefined : Math.round(basePrice * 100) / 100;
    
    const status = this.randomFrom(Object.values(OrderStatus));
    const fillRatio = status === OrderStatus.FILLED ? 1 : 
                     status === OrderStatus.PARTIAL ? Math.random() * 0.8 : 0;
    
    const filledQuantity = Math.round(quantity * fillRatio);
    const avgFillPrice = filledQuantity > 0 ? basePrice + (Math.random() - 0.5) * 2 : undefined;
    
    const notionalValue = filledQuantity * (avgFillPrice || basePrice);
    const pnl = filledQuantity > 0 ? (Math.random() - 0.5) * notionalValue * 0.02 : 0;
    
    return {
      order_id: BigInt(this.currentOrderId++),
      time_id: this.getCurrentTimeId(),
      security_id: security.security_id,
      trader_id: trader.trader_id,
      counterparty_id: counterparty.counterparty_id,
      order_type_id: this.getOrderTypeId(orderType, orderSide),
      
      order_quantity: quantity,
      order_price: orderPrice,
      filled_quantity: filledQuantity,
      average_fill_price: avgFillPrice,
      commission: filledQuantity * 0.001,
      
      order_status: status,
      order_timestamp: new Date(),
      fill_timestamp: filledQuantity > 0 ? new Date() : undefined,
      
      notional_value: notionalValue,
      market_value: notionalValue,
      pnl: Math.round(pnl * 100) / 100,
      
      order_source: this.randomFrom(['MANUAL', 'ALGO', 'API'] as any),
      execution_venue: security.exchange,
      settlement_date: this.futureDate(1, 3)
    };
  }

  public generateHistoricalOrders(count: number): FactTradingOrder[] {
    const orders: FactTradingOrder[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now - daysAgo * dayMs + Math.random() * dayMs);
      
      const order = this.generateRealtimeOrder();
      order.order_timestamp = timestamp;
      if (order.fill_timestamp) {
        order.fill_timestamp = new Date(timestamp.getTime() + Math.random() * 60000);
      }
      
      orders.push(order);
    }
    
    return orders.sort((a, b) => 
      b.order_timestamp.getTime() - a.order_timestamp.getTime()
    );
  }

  public getSecurities(): DimSecurity[] {
    return this.securities;
  }

  public getTraders(): DimTrader[] {
    return this.traders;
  }

  public getCounterparties(): DimCounterparty[] {
    return this.counterparties;
  }

  public getSymbolDescription(symbol: string): string {
    return EQUITY_DATA[symbol as keyof typeof EQUITY_DATA]?.description || 'Financial instrument';
  }

  public getSecurityTypeDescription(securityType: string): string {
    return SECURITY_TYPE_DESCRIPTIONS[securityType as keyof typeof SECURITY_TYPE_DESCRIPTIONS] || 'Financial security';
  }

  public getOrderTypeDescription(orderType: string): string {
    return ORDER_TYPE_DESCRIPTIONS[orderType as keyof typeof ORDER_TYPE_DESCRIPTIONS] || 'Trading order';
  }

  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private futureDate(minDays: number, maxDays: number): Date {
    const days = minDays + Math.random() * (maxDays - minDays);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private getCurrentTimeId(): number {
    // Generate a time_id that matches existing records in dim_time
    // Round to nearest 5-minute interval to match the time dimension
    const now = new Date();
    now.setSeconds(0, 0); // Reset seconds and milliseconds
    now.setMinutes(Math.floor(now.getMinutes() / 5) * 5); // Round to 5-minute intervals
    return Math.floor(now.getTime() / 1000);
  }

  private getOrderTypeId(orderType: OrderType, orderSide: OrderSide): number {
    // In real implementation, this would map to dim_order_type table
    return parseInt(`${Object.values(OrderType).indexOf(orderType)}${orderSide === OrderSide.BUY ? 1 : 2}`);
  }
}

// Singleton instance
export const mockDataGenerator = new MockDataGenerator();
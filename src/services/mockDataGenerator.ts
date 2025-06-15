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

// Mock data pools
const EQUITY_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'JPM', 'BAC', 'NVDA', 'META', 'NFLX'];
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
      this.securities.push({
        security_id: idx + 1,
        symbol,
        security_name: `${symbol} Common Stock`,
        security_type: SecurityType.EQUITY,
        exchange: Math.random() > 0.5 ? 'NYSE' : 'NASDAQ',
        sector: this.randomFrom(['Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy']),
        industry: this.randomFrom(['Software', 'Banks', 'Biotech', 'Retail', 'Oil & Gas']),
        market_cap_category: this.randomFrom(['LARGE', 'MID'] as any),
        currency: 'USD',
        is_active: true
      });
    });
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
    const basePrice = 50 + Math.random() * 450;
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

  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private futureDate(minDays: number, maxDays: number): Date {
    const days = minDays + Math.random() * (maxDays - minDays);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private getCurrentTimeId(): number {
    // In real implementation, this would map to dim_time table
    return Math.floor(Date.now() / 1000);
  }

  private getOrderTypeId(orderType: OrderType, orderSide: OrderSide): number {
    // In real implementation, this would map to dim_order_type table
    return parseInt(`${Object.values(OrderType).indexOf(orderType)}${orderSide === OrderSide.BUY ? 1 : 2}`);
  }
}

// Singleton instance
export const mockDataGenerator = new MockDataGenerator();
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
  'AAPL.O': { name: 'Apple Inc.', price: 195.89, description: 'Technology company that designs and manufactures consumer electronics, software, and services' },
  'GOOGL.O': { name: 'Alphabet Inc. Class A', price: 175.43, description: 'Multinational technology company specializing in internet services and products' },
  'MSFT.O': { name: 'Microsoft Corporation', price: 425.17, description: 'Technology company developing computer software, consumer electronics, and cloud services' },
  'AMZN.O': { name: 'Amazon.com Inc.', price: 186.51, description: 'E-commerce and cloud computing company offering online retail and web services' },
  'TSLA.O': { name: 'Tesla Inc.', price: 248.98, description: 'Electric vehicle and clean energy company manufacturing electric cars and energy storage' },
  'JPM.N': { name: 'JPMorgan Chase & Co.', price: 249.85, description: 'Multinational investment bank and financial services holding company' },
  'BAC.N': { name: 'Bank of America Corp.', price: 45.78, description: 'Multinational investment bank and financial services holding company' },
  'NVDA.O': { name: 'NVIDIA Corporation', price: 878.54, description: 'Technology company designing graphics processing units for gaming and professional markets' },
  'META.O': { name: 'Meta Platforms Inc.', price: 563.33, description: 'Technology company operating social networking platforms including Facebook and Instagram' },
  'NFLX.O': { name: 'Netflix Inc.', price: 825.73, description: 'Streaming entertainment service with TV series, documentaries and feature films' }
};

const SECURITY_TYPE_DESCRIPTIONS = {
  'EQUITY': 'Common stock representing ownership shares in a corporation',
  'OPTION': 'Financial derivative giving the right to buy or sell an underlying asset at a specific price',
  'OTC_DERIVATIVE': 'Over-the-counter derivative contract traded directly between parties outside formal exchanges',
  'BOND': 'Fixed income instrument representing a loan made by an investor to a borrower',
  'FUTURE': 'Standardized forward contract to buy or sell an asset at a predetermined price at a specified time',
  'MONEY_MARKET': 'Short-term debt securities with high liquidity and very short maturities',
  'CASH': 'Currency holdings and demand deposits used for immediate transactions',
  'FX_SPOT': 'Foreign exchange transaction for immediate delivery and settlement',
  'FX_FORWARD': 'Agreement to exchange currencies at a future date at a predetermined rate',
  'SWAP': 'Derivative contract to exchange cash flows or liabilities from two different financial instruments',
  'CREDIT_DEFAULT_SWAP': 'Credit derivative providing protection against credit risk of a reference entity',
  'REPO': 'Repurchase agreement for short-term borrowing through sale and buyback of securities',
  'COMMODITY': 'Physical goods such as metals, energy, or agricultural products traded on exchanges',
  'ETF': 'Exchange-traded fund tracking an index, commodity, bonds, or basket of assets'
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
    this.generateOtherAssetClasses();
    
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
        exchange: symbol.endsWith('.O') ? 'NASDAQ' : 'NYSE',
        sector: this.getSectorForSymbol(symbol),
        industry: this.getIndustryForSymbol(symbol),
        market_cap_category: this.randomFrom(['LARGE', 'MID'] as any),
        currency: 'USD',
        is_active: true
      });
    });
  }

  private getSectorForSymbol(symbol: string): string {
    const baseSymbol = symbol.split('.')[0];
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
    return sectorMap[baseSymbol] || 'Technology';
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

  private generateOtherAssetClasses() {
    let secId = this.securities.length + 100;
    
    // Add sample securities for each asset class
    // Bonds - Government and Corporate
    const bonds = [
      'US10Y=RR', 'US5Y=RR', 'US2Y=RR', 'US30Y=RR',
      'DE10Y=RR', 'GB10Y=RR', 'JP10Y=RR', 'FR10Y=RR',
      'XS1234567890=', 'XS0987654321=' // Corporate bonds ISIN
    ];
    bonds.forEach(symbol => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: symbol.startsWith('XS') ? 
          `Corporate Bond ${symbol}` : 
          `${symbol.replace('=RR', '')} Government Bond Yield`,
        security_type: SecurityType.BOND,
        exchange: 'FIXED_INCOME',
        currency: 'USD',
        is_active: true
      });
    });
    
    // ETFs
    const etfs = {
      'SPY.P': 'SPDR S&P 500 ETF Trust',
      'QQQ.O': 'Invesco QQQ Trust',
      'IWM.P': 'iShares Russell 2000 ETF',
      'GLD.P': 'SPDR Gold Shares',
      'TLT.O': 'iShares 20+ Year Treasury Bond ETF'
    };
    Object.entries(etfs).forEach(([symbol, name]) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.ETF,
        exchange: symbol.endsWith('.O') ? 'NASDAQ' : 'NYSE',
        currency: 'USD',
        is_active: true
      });
    });
    
    // FX Spot and Forward
    const fxSpot = ['EUR=', 'GBP=', 'JPY=', 'CHF=', 'AUD=', 'CAD='];
    fxSpot.forEach(symbol => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: `${symbol.replace('=', '')}/USD Spot Exchange Rate`,
        security_type: SecurityType.FX_SPOT,
        exchange: 'FX',
        currency: 'USD',
        is_active: true
      });
    });
    
    // FX Forwards
    const fxForwards = ['EUR1M=', 'EUR3M=', 'GBP1M=', 'JPY3M='];
    fxForwards.forEach(symbol => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: `${symbol} Forward`,
        security_type: SecurityType.FX_FORWARD,
        exchange: 'FX',
        currency: 'USD',
        is_active: true
      });
    });
    
    // Commodities
    const commodities = [
      { symbol: 'GCc1', name: 'Gold Front Month' },
      { symbol: 'SIc1', name: 'Silver Front Month' },
      { symbol: 'CLc1', name: 'WTI Crude Oil Front Month' },
      { symbol: 'COc1', name: 'Brent Crude Oil Front Month' },
      { symbol: 'NGc1', name: 'Natural Gas Front Month' },
      { symbol: 'Cc1', name: 'Corn Front Month' },
      { symbol: 'Wc1', name: 'Wheat Front Month' }
    ];
    commodities.forEach(({ symbol, name }) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.COMMODITY,
        exchange: 'CME',
        currency: 'USD',
        is_active: true
      });
    });
    
    // Money Market Instruments
    const moneyMarket = [
      { symbol: 'USCP3M=', name: 'US Commercial Paper 3M' },
      { symbol: 'EURIBOR3M=', name: 'EURIBOR 3 Month' },
      { symbol: 'SOFR=', name: 'SOFR Rate' },
      { symbol: 'USTB3M=', name: 'US T-Bill 3 Month' }
    ];
    moneyMarket.forEach(({ symbol, name }) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.MONEY_MARKET,
        exchange: 'MONEY_MARKET',
        currency: 'USD',
        is_active: true
      });
    });
    
    // Interest Rate Swaps
    const swaps = [
      { symbol: 'USDSW10Y=', name: 'USD 10Y Interest Rate Swap' },
      { symbol: 'EURSW5Y=', name: 'EUR 5Y Interest Rate Swap' },
      { symbol: 'GBPSW10Y=', name: 'GBP 10Y Interest Rate Swap' }
    ];
    swaps.forEach(({ symbol, name }) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.SWAP,
        exchange: 'OTC',
        currency: 'USD',
        is_active: true
      });
    });
    
    // Repos
    const repos = [
      { symbol: 'USREPO/ON=', name: 'US Treasury Overnight Repo' },
      { symbol: 'EUREPO/TN=', name: 'EUR Tomorrow/Next Repo' },
      { symbol: 'GCREPO/1W=', name: 'General Collateral 1 Week Repo' }
    ];
    repos.forEach(({ symbol, name }) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.REPO,
        exchange: 'REPO',
        currency: 'USD',
        is_active: true
      });
    });
    
    // Credit Default Swaps
    const cds = [
      { symbol: 'CDXIG5Y=', name: 'CDX IG 5Y Index' },
      { symbol: 'CDXHY5Y=', name: 'CDX HY 5Y Index' },
      { symbol: 'ITRX5Y=', name: 'iTraxx Europe 5Y' }
    ];
    cds.forEach(({ symbol, name }) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.CREDIT_DEFAULT_SWAP,
        exchange: 'OTC',
        currency: 'USD',
        is_active: true
      });
    });
    
    // Futures
    const futures = [
      { symbol: 'ESH5:', name: 'E-mini S&P 500 Mar 2025' },
      { symbol: 'NQM5:', name: 'E-mini NASDAQ Jun 2025' },
      { symbol: 'YMZ4:', name: 'E-mini Dow Dec 2024' },
      { symbol: 'ZBH5:', name: 'US 30Y Treasury Bond Mar 2025' }
    ];
    futures.forEach(({ symbol, name }) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.FUTURE,
        exchange: 'CME',
        currency: 'USD',
        is_active: true
      });
    });
    
    // Cash
    const cash = [
      { symbol: 'USD=X', name: 'US Dollar Cash' },
      { symbol: 'EUR=X', name: 'Euro Cash' },
      { symbol: 'GBP=X', name: 'British Pound Cash' }
    ];
    cash.forEach(({ symbol, name }) => {
      this.securities.push({
        security_id: secId++,
        symbol,
        security_name: name,
        security_type: SecurityType.CASH,
        exchange: 'CASH',
        currency: symbol.substring(0, 3),
        is_active: true
      });
    });
  }

  private getOrCreateSecurityByType(securityType: SecurityType): DimSecurity {
    // Try to find existing security of this type
    const existing = this.securities.find(s => s.security_type === securityType);
    if (existing && Math.random() > 0.5) return existing;
    
    // Create new security
    const securityId = this.securities.length + 2000 + Math.floor(Math.random() * 1000);
    let symbol = '';
    let name = '';
    let exchange = 'OTC';
    
    switch (securityType) {
      case SecurityType.BOND:
        symbol = `${this.randomFrom(['US', 'DE', 'JP', 'GB'])}${this.randomFrom(['2Y', '5Y', '10Y', '30Y'])}=RR`;
        name = `${symbol} Government Bond`;
        exchange = 'FIXED_INCOME';
        break;
      case SecurityType.MONEY_MARKET:
        symbol = `${this.randomFrom(['USCP', 'USCD', 'EUBA', 'USTB'])}${Math.floor(Math.random() * 90 + 1)}D=`;
        name = `${symbol} Money Market`;
        break;
      case SecurityType.FX_SPOT:
        symbol = `${this.randomFrom(['EUR', 'GBP', 'JPY', 'CHF'])}=`;
        name = `${symbol} Spot`;
        exchange = 'FX';
        break;
      case SecurityType.FX_FORWARD:
        symbol = `${this.randomFrom(['EUR', 'GBP', 'JPY'])}${this.randomFrom(['1M', '3M', '6M'])}=`;
        name = `${symbol} Forward`;
        exchange = 'FX';
        break;
      case SecurityType.SWAP:
        symbol = `IRS-${this.randomFrom(['USD', 'EUR'])}-${this.randomFrom(['5Y', '10Y', '30Y'])}`;
        name = `${symbol} Interest Rate Swap`;
        break;
      case SecurityType.CREDIT_DEFAULT_SWAP:
        symbol = `CDS-${this.randomFrom(['IG', 'HY', 'EM'])}-${this.randomFrom(['5Y', '10Y'])}`;
        name = `${symbol} Credit Default Swap`;
        break;
      case SecurityType.REPO:
        symbol = `REPO-${this.randomFrom(['ON', 'TN', '1W', '1M'])}`;
        name = `${symbol} Repurchase Agreement`;
        break;
      case SecurityType.COMMODITY:
        const commodities = [
          { sym: 'CLc1', n: 'WTI Crude Oil Front Month' },
          { sym: 'GCc1', n: 'Gold Front Month' },
          { sym: 'SIc1', n: 'Silver Front Month' },
          { sym: 'NGc1', n: 'Natural Gas Front Month' }
        ];
        const commodity = this.randomFrom(commodities);
        symbol = commodity.sym;
        name = commodity.n;
        exchange = 'CME';
        break;
      case SecurityType.ETF:
        const etfMap = {
          'SPY.P': 'SPDR S&P 500 ETF Trust',
          'QQQ.O': 'Invesco QQQ Trust',
          'IWM.P': 'iShares Russell 2000 ETF',
          'DIA.P': 'SPDR Dow Jones Industrial Average ETF',
          'GLD.P': 'SPDR Gold Shares',
          'TLT.O': 'iShares 20+ Year Treasury Bond ETF',
          'VXX.P': 'iPath S&P 500 VIX Short-Term Futures ETN'
        };
        const etfSymbol = this.randomFrom(Object.keys(etfMap));
        symbol = etfSymbol;
        name = etfMap[etfSymbol as keyof typeof etfMap];
        exchange = 'NYSE';
        break;
      case SecurityType.FUTURE:
        const futureMonth = this.randomFrom(['H', 'M', 'U', 'Z']);
        const futureYear = new Date().getFullYear();
        symbol = `${this.randomFrom(['ES', 'NQ', 'YM'])}${futureMonth}${futureYear}:`;
        name = `${symbol} Future`;
        exchange = 'CME';
        break;
      case SecurityType.CASH:
        symbol = this.randomFrom(['USD', 'EUR', 'GBP', 'JPY', 'CHF']);
        name = `${symbol} Cash`;
        break;
      case SecurityType.EQUITY:
        return this.randomFrom(this.securities.filter(s => s.security_type === SecurityType.EQUITY));
      case SecurityType.OPTION:
        return this.randomFrom(this.securities.filter(s => s.security_type === SecurityType.OPTION));
      default:
        return this.randomFrom(this.securities);
    }
    
    const newSecurity: DimSecurity = {
      security_id: securityId,
      symbol,
      security_name: name,
      security_type: securityType,
      exchange,
      currency: 'USD',
      is_active: true
    };
    
    this.securities.push(newSecurity);
    return newSecurity;
  }

  public generateRealtimeOrder(): FactTradingOrder {
    // Always create diverse order types for better distribution
    const securityType = this.randomFrom([
      SecurityType.EQUITY,
      SecurityType.BOND,
      SecurityType.OTC_DERIVATIVE,
      SecurityType.FX_SPOT,
      SecurityType.SWAP,
      SecurityType.MONEY_MARKET,
      SecurityType.REPO,
      SecurityType.CREDIT_DEFAULT_SWAP,
      SecurityType.COMMODITY,
      SecurityType.ETF,
      SecurityType.FX_FORWARD,
      SecurityType.FUTURE,
      SecurityType.OPTION,
      SecurityType.CASH
    ]);
    
    // Get or create security of this type
    const security = this.getOrCreateSecurityByType(securityType);
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
    } else if (security.security_type === SecurityType.BOND) {
      basePrice = 95 + Math.random() * 10; // Bonds typically trade near par (100)
    } else if (security.security_type === SecurityType.FX_SPOT || security.security_type === SecurityType.FX_FORWARD) {
      basePrice = 0.8 + Math.random() * 1.5; // FX rates
    } else if (security.security_type === SecurityType.COMMODITY) {
      basePrice = 20 + Math.random() * 150; // Commodity prices vary widely
    } else if (security.security_type === SecurityType.MONEY_MARKET || security.security_type === SecurityType.REPO) {
      basePrice = 99 + Math.random() * 2; // Money market instruments trade near par
    } else if (security.security_type === SecurityType.ETF) {
      basePrice = 100 + Math.random() * 400; // ETF prices
    } else {
      basePrice = 50 + Math.random() * 450; // Other derivatives
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
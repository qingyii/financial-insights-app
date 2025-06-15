# Financial Trading Insights Platform

A comprehensive financial trading analysis platform with real-time order flow visualization, natural language SQL querying, and dynamic data structure management.

## Features

- **Star Schema Data Model**: Optimized for financial trading data analysis
- **Real-time Order Flow**: Animated visualization of trading orders across securities
- **Natural Language Querying**: Convert English questions to SQL with ambiguity resolution
- **Insight Generation**: AI-powered analysis of query results
- **Dynamic Data Structure**: Update schema on-the-fly
- **Mock Data Generation**: Realistic trading data for equities, options, and OTC derivatives

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI, D3.js, Framer Motion
- **Backend**: Node.js, Express, SQLite, WebSocket
- **AI**: OpenAI GPT-4 for text-to-SQL conversion
- **Package Manager**: pnpm

## Installation

1. Clone the repository and navigate to the project:
```bash
cd financial-insights-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. Create data directory:
```bash
mkdir data
```

## Running the Application

1. Start the backend server:
```bash
pnpm run server
```

2. In a new terminal, start the frontend:
```bash
pnpm run dev
```

3. Open http://localhost:5173 in your browser

## Usage

### Dashboard
- View real-time trading metrics
- Monitor volume trends and P&L
- See security type distribution

### Order Flow
- Watch animated order flow visualization
- Track real-time order status updates
- Monitor P&L for each trade

### Query Analysis
- Ask questions in natural language:
  - "Show me top traders by PnL today"
  - "What's the total volume for options?"
  - "List failed orders in the last hour"
- View generated SQL queries
- Get AI-powered insights
- Handle ambiguous queries with suggestions

### Data Structure
- View star schema tables
- Add new columns to existing tables
- Create new dimension or fact tables
- Modify schema without restarting

## Example Queries

- "Show total trading volume by security type"
- "What are the top performing traders this week?"
- "List all option trades with PnL > $1000"
- "Compare equity vs derivative trading volumes"
- "Show failed orders in the last hour"
- "What's the average order size for each desk?"
- "Show me OTC derivatives traded today"

## Data Model

### Fact Tables
- `fact_trading_orders`: Core trading order data
- `fact_daily_trading_summary`: Aggregated daily metrics

### Dimension Tables
- `dim_time`: Time hierarchy
- `dim_security`: Securities including equities, options, OTC
- `dim_trader`: Trader information
- `dim_counterparty`: Trading counterparties
- `dim_order_type`: Order types and characteristics

## API Endpoints

- `GET /api/orders/recent`: Recent trading orders
- `GET /api/summary/daily`: Daily trading summaries
- `POST /api/query`: Natural language query processing
- `GET /api/schema`: Current database schema
- `POST /api/schema/update`: Update data structure
- `WebSocket ws://localhost:3000`: Real-time order updates

## Development

The project uses:
- Vite for fast development
- TypeScript for type safety
- ESLint for code quality
- SQLite for lightweight data storage
- Better-sqlite3 for synchronous database operations

## License

MIT
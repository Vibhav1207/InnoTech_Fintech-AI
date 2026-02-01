# InnoTech Fintech AI - Agentic Portfolio Manager

A simulated autonomous trading agent system powered by a Master Decision Agent and specialized sub-agents. This project demonstrates a complete agentic workflow for portfolio management, from data analysis to trade execution, within a safe, simulated environment.

[Website](https://inno-tech-fintech-ai.vercel.app)

---

## Features (Expanded)

This section expands the core capabilities so you can quickly understand what each piece does and how they interact.

- Master Decision Agent (Judge)
  - Implements a nine-step decision flow (gather context, aggregate signals, apply weights/quality multipliers, enforce liquidity veto, pick top candidates, compute signed intent, apply thresholding, map to final action).
  - Returns a detailed decision object: finalAction (BUY_MORE / REDUCE / EXIT / HOLD, SELL), finalIntentScore, top4Candidates, scoringBreakdown, vetoApplied, and logs.
  - Main file: agents/master/index.js

- Sub-agents (modular & testable)
  - Technical Agent: trend, momentum, breakout detection (agents/technical — default implementation referenced by master).
  - Quant / Momentum Agent: momentum metrics, z-score, breakout detection, scoring (agents/quant/index.js).
  - Sentiment Agent: simple heuristic “LLM-like” analyzer to synthesize headline mood (services/llmService.js, agents/sentiment).
  - Risk / Liquidity Agent: volatility and liquidity proxies (Amihud-like), position concentration checks, and an exitRiskState (LOW/MEDIUM/HIGH) that can trigger liquidity vetoes (agents/risk/index.js).
  - Each agent returns action recommendations, confidence, reasoning and logs so the Master can create an auditable decision.

- UI & Observability
  - Dark themed Next.js + Tailwind dashboard (pages/dashboard.js) shows cash, total value, PnL, positions and an activity log containing agent decisions & execution outcomes.
  - Decisions are persisted as AgentDecision documents and runtime activities are written to ActivityLog for debugging and audit.

---

## Tech Stack

- Node.js + Next.js (frontend & backend API routes)
- React for UI
- Tailwind CSS for styling
- MongoDB + Mongoose for persistence
- Axios (HTTP calls)
- Recharts (charts, used in UI)
- Alpha Vantage service integration (optional API key)
- Small in-repo LLM-like analyzer (services/llmService.js) for sentiment heuristics

Key files:
- agents/master/index.js — Master Decision Agent
- agents/quant/index.js, agents/risk/index.js, agents/sentiment/index.js, agents/liquidity/index.js — sub-agents
- lib/execution-engine.js — Executes batch decisions and applies slippage/trade-costs
- lib/portfolio-manager.js — Portfolio & position reads/updates, PnL
- pages/dashboard.js, pages/trade.js — UI
- pages/api/agent/loop.js — autonomous loop endpoint
- pages/api/run-agents/index.js — run decision analysis per symbol
- services/alphaVantageService.js — market data integrations (optional API key)
- services/llmService.js — simple sentiment/mood heuristic

---

## Prerequisites

- Node.js >= 18 (matching Next.js 16+)
- npm (or pnpm/yarn)
- MongoDB instance (local or cloud). For local quick testing you may use MongoDB Atlas or run a local mongod / mongosh.
- (Optional) AlphaVantage API key if you want live market data: https://www.alphavantage.co

---

## Environment Variables

- MONGODB_URI - MongoDB connection URI (required)
- ALPHAVANTAGE_API_KEY - (required) for services/alphaVantageService.js to fetch real historical prices
- NEXT_PUBLIC_APP_PORT - (optional) port for Next.js dev server (default port in package.json is 3002)

Example .env.local:
```env
MONGODB_URI=your_mongodb_connection_address
ALPHAVANTAGE_API_KEY=YOUR_ALPHAVANTAGE_KEY
NEXT_PUBLIC_APP_PORT=3002
```

---

## Cloning & Running Locally (Step-by-step)

Follow these numbered steps to clone the repo and run the project on your machine.

1. Check prerequisites
   - Node: node -v  (should be >= 18)
   - npm: npm -v
   - MongoDB: make sure a mongod instance or Atlas cluster is available. For local testing, run: mongod --dbpath ./data/db

2. Clone the repository
```bash
git clone https://github.com/Vibhav1207/InnoTech_Fintech-AI.git
cd InnoTech_Fintech-AI
```

3. Install dependencies
```bash
npm install
```
(Optionally use npm ci in CI environments.)

4. Configure environment variables
- Create a file named .env.local in the repository root and paste:
```env
MONGODB_URI=your_mongodb_connection_address
ALPHAVANTAGE_API_KEY=YOUR_ALPHAVANTAGE_KEY  
NEXT_PUBLIC_APP_PORT=3002
```
- On MongoDB Atlas, replace MONGODB_URI with your connection string (include credentials and database name).

5. Start the dev server
```bash
npm run dev
```
- This starts Next.js on port 3002 (per package.json). Visit: http://localhost:3002

6. Initialize demo account (one-time)
- Preferred: use the reset API (if present in your repo)
```bash
curl -X POST http://localhost:3002/api/account/reset
```
- If the reset endpoint is not present or returns an error, you can seed a simple user directly in MongoDB (example using mongosh):
```js
// using mongosh
use innotech-fintech-ai
db.users.insertOne({ name: 'Demo User', email: 'demo@example.com', createdAt: new Date() })
```
- The agent loop expects at least one User document available via User.findOne({}) — the exact shape isn't strict for the demo, but ensure a User exists.


7. Trigger the loop and try the UI
- Manually trigger a single analysis run for a symbol:
```bash
curl -X POST http://localhost:3002/api/run-agents \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL"}'
```
- Trigger the autonomous loop (analyzes wishlist + positions and may execute simulated trades):
```bash
curl -X POST http://localhost:3002/api/agent/loop
```
- Open the Dashboard to monitor: http://localhost:3002/dashboard

8. Execute a manual trade (manual override)
```bash
curl -X POST http://localhost:3002/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "<portfolioId>",
    "symbol": "AAPL",
    "decision": "BUY",
    "confidence": 0.7,
    "quantity": 1
  }'
```
- Replace portfolioId with the Portfolio._id from your DB if needed. You can also inspect Portfolio and Position collections to find IDs.

10. Production build (optional)
```bash
npm run build
npm start
```
- Ensure environment variables (MONGODB_URI, etc.) are set for production.

---

## Usage — API Examples (summary)

1. Run master analysis for a single symbol:
```bash
curl -X POST http://localhost:3002/api/run-agents \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL"}'
```

2. Trigger the autonomous agent loop:
```bash
curl -X POST http://localhost:3002/api/agent/loop
```

3. Execute a manual trade (manual override):
```bash
curl -X POST http://localhost:3002/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "<portfolioId>",
    "symbol": "AAPL",
    "decision": "BUY",
    "confidence": 0.7,
    "quantity": 1
  }'
```

---

## Agent Architecture & Decision Flow (high level)

This project follows the multi-stage flow described in `Flow.md`. Short summary:

- Stage 1: Context — gather portfolio state, wishlist, market & news data.
- Stage 2: Sub-agent analysis (parallel):
  - Technical: trend, momentum, breakout detection.
  - Quant: momentum, z-score, statistical signals.
  - Sentiment: (via services/llmService.js), mood from headlines.
  - Risk/Liquidity: volatility, volume stability, Amihud-like proxy, portfolio concentration.
- Stage 3: Risk & portfolio governance: portfolio-level constraints and risk score (exitRiskState: LOW/MEDIUM/HIGH).
- Master Decision Engine (agents/master/index.js):
  - Expand candidates: each sub-agent proposes actions (BUY, BUY_MORE, HOLD, REDUCE, EXIT,SELL).
  - Apply domain weights and quality multipliers.
  - Liquidity veto: if risk agent signals SELL/EXIT or REDUCE with HIGH exitRiskState, remove buy candidates.
  - Score candidates, pick top-4 with diversity constraint (max 2 per agent), compute final intent (signed sum) and threshold it.
  - Translate signed intent into actions: BUY_MORE | REDUCE | EXIT | HOLD| SELL; mark reallocation candidates if capital is freed.
- Execution: lib/execution-engine.js receives finalAction and simulates BUY/SELL with slippage and trade-cost accounting before calling PortfolioManager.updatePosition to persist changes.

---


## Database & Models

Main persisted models (Mongoose):
- User — single demo user expected by loop logic (User.findOne({})).
- Portfolio — cashAvailable, totalValue, PnL fields.
- Position — symbol, qty, avgPrice, currentPrice.
- TradeLog — each executed trade.
- AgentDecision — saved master decisions & reasoning.
- ActivityLog — runtime loop activity entries.
- DailyPnLSnapshot — end-of-day snapshot.

---

## Example: Running a simple demo scenario

1. Start server:
```
npm run dev
```

2. Initialize demo user:
```
curl -X POST http://localhost:3002/api/account/reset
```

3. Trigger full loop:
```
curl -X POST http://localhost:3002/api/agent/loop
```

4. Monitor Dashboard:
Open http://localhost:3002/dashboard and observe activity log and positions updating.

---

## Security & Disclaimer

- This project runs entirely as a simulation — no real exchange connectivity nor real money handling.
- Do not use this code for live trading without rigorous testing, risk controls, compliance, and real exchange integrations.
- Treat the model outputs as technical demonstrations only.

---

## Contributing

- Fork the repo, create feature branches, add tests, and open a PR.
- Suggested improvements:
  - Add unit tests for master decision aggregation and execution engine.
  - Add rate-limited background worker for agent loop.
  - Integrate a real market-feed and execution adapters for real brokers (with proper sandboxing).
  - Improve UI charts and trade history visualizations.

If you'd like, I can draft a CONTRIBUTING.md with a PR checklist and examples for tests and code style.

---

## License

This repository includes a LICENSE file. Review it for usage and contribution rules.

---

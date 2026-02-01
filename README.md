# InnoTech Fintech AI - Agentic Portfolio Manager

A simulated autonomous trading agent system powered by a Master Decision Agent and specialized sub-agents. This project demonstrates a complete agentic workflow for portfolio management, from data analysis to trade execution, within a safe, simulated environment.

## 🚀 Key Features

- **Master Decision Agent (Judge):** A sophisticated 9-step decision engine that aggregates inputs from specialized sub-agents (Liquidity, Technical, Sentiment, Momentum) using domain weights, veto logic, and intent mapping.
- **Autonomous Agent Loop:** Continuous operating cycle that analyzes wishlist stocks, makes decisions, and executes trades without human intervention.
- **Real-time Portfolio Management:** Tracks cash, positions, realized/unrealized PnL, and enforces risk controls (e.g., max trades per day, capital limits).
- **Professional Dashboard:** A fintech-grade dark-themed UI (Next.js) for monitoring agent status, live trade logs, and portfolio performance history.
- **Simulation Engine:** Realistic execution simulation with slippage, partial fills (logic ready), and transaction cost modeling.

## 🛠️ Architecture

Built as a single-repo **Next.js** application, combining frontend UI and backend API routes.

- **Frontend:** React, Tailwind CSS, Recharts (Dark Theme / Glassmorphism-inspired).
- **Backend:** Next.js API Routes (Node.js).
- **Database:** MongoDB (Mongoose models for User, Portfolio, Positions, TradeLog, AgentSession).
- **Agents:** Modular agent logic in `/agents/` (Master, Quant, Risk, etc.).

## 📂 Project Structure

```
/agents          # Agent Logic (Master, Technical, Sentiment, etc.)
/context         # React Context for Global State (AgentContext)
/lib             # Shared Utilities (Portfolio Manager, Execution Engine)
/models          # MongoDB Schemas (Portfolio, TradeLog, AgentSession)
/pages           # Next.js Pages (Dashboard, Trade) & API Routes
/styles          # Global Styles & Tailwind Config
```

## ⚡ Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Ensure you have a `.env` or `.env.local` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

3. **Run the Application:**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## 🤖 Agent Logic Flow

1. **Initialization:** User configures wishlist and risk limits.
2. **Analysis:** Sub-agents analyze each symbol and output decisions (BUY/SELL/HOLD) with confidence scores.
3. **Master Judgment:** The Master Agent aggregates decisions:
   - Applies **Liquidity Veto** (hard constraint).
   - Weights inputs (Liquidity > Technical > Momentum > Sentiment).
   - Calculates a final **Action Score**.
4. **Execution:** Validates against portfolio constraints (Capital, Max Trades) and executes the simulated trade.
5. **Loop:** Repeats after a cooldown period.

## ⚠️ Disclaimer

This is a **simulation only**. No real money is involved, and no real trades are executed on any exchange.

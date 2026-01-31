# Agentic Portfolio Management System (Demo)

A demo-only, agentic portfolio management system for hackathon use.

## Monorepo structure

| Service         | Stack                    | Port | Health / entry          |
|----------------|--------------------------|------|--------------------------|
| **backend**    | Node.js + TypeScript     | 3001 | `GET /health`            |
| **agent_service** | Python + FastAPI      | 8000 | `GET /health`            |
| **frontend**   | Next.js 14 (app router)  | 3000 | `/health` page           |

Each service runs independently.

- **Backend:** `cd backend && npm install && npm run dev` → http://localhost:3001/health  
- **Agent service:** `cd agent_service`, create venv, `pip install -r requirements.txt`, then `uvicorn main:app --reload --port 8000` → http://localhost:8000/health  
- **Frontend:** `cd frontend && npm install && npm run dev` → http://localhost:3000 and http://localhost:3000/health  

--- It simulates managing open positions over time with modular agents (signals, risk, portfolio, decision, feedback), logs everything to a database, and exposes APIs for a read-only frontend dashboard. No real trades or broker integrations—paper trading only.

**Problem:** Managing open positions over time in a simulated environment—tracking PnL, risk, and agent decisions—without real execution.

**High-level flow:** Data (fetchers/models) → agents (signals, risk, portfolio, decision, feedback) → decisions → logs to DB → APIs → dashboard (positions, PnL, risk, logs).

---

**Disclaimer:** This system is for simulation and demonstration only. It does not place real trades, connect to real brokers, or handle real money. Use only in a hackathon or learning context.

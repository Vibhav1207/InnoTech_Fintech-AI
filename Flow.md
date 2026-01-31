```text
┌────────────────────────────────────────────────────────────────────────┐
│                     Smart Portfolio Decision Architecture              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 1: CONTEXT INVESTIGATION                                        │
│  ─────────────────────────                                             │
│  • User Preferences (risk, capital, horizon)                           │
│  • Live Market Data (price, volume, volatility)                        │
│  • News & Sentiment Streams                                            │
│  • Current Portfolio State                                             │
│    - Open positions                                                    │
│    - Sector exposure                                                   │
│    - Capital locked                                                    │
│                                                                        │
│  → Unified Context Object                                              │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 2: PARALLEL SIGNAL & STRATEGY ANALYSIS                          │
│  ──────────────────────────────────────────                            │
│                                                                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
│  │ Technical     │  │ Sentiment     │  │ Quant         │               │
│  │ Strategy      │  │ Strategy      │  │ Strategy      │               │
│  │ Agent         │  │ Agent         │  │ Agent         │               │
│  │ • Trend       │  │ • News/FOMO   │  │ • Momentum    │               │
│  │ • Volatility  │  │ • Fear        │  │ • Statistics  │               │
│  └───────────────┘  └───────────────┘  └───────────────┘               │
│            │                   │                   │                   │
│            └────────────┬──────┴───────────────────┘                   │
│                         │                                              │
│                   ┌───────────────┐                                    │
│                   │ Liquidity     │                                    │
│                   │ Strategy      │                                    │
│                   │ Agent         │                                    │
│                   │ • Volume      │                                    │
│                   │ • Exit risk   │                                    │
│                   └───────────────┘                                    │
│                                                                        │
│  → Strategy Signals (action + confidence + reasoning)                  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 3: RISK & PORTFOLIO GOVERNANCE                                  │
│  ───────────────────────────────────                                   │
│                                                                        │
│  ┌──────────────────────────────┐                                      │
│  │ Risk Assessment Agent        │                                      │
│  │ • Position drawdown risk     │                                      │
│  │ • Volatility spikes          │                                      │
│  │ • Capital concentration      │                                      │
│  └──────────────────────────────┘                                      │
│                  │                                                     │
│                  ▼                                                     │
│  ┌──────────────────────────────┐                                      │
│  │ Portfolio-Level Agent        │                                      │
│  │ • Sector overexposure        │                                      │
│  │ • Correlation risk           │                                      │
│  │ • Diversification quality    │                                      │
│  └──────────────────────────────┘                                      │
│                                                                        │
│  → Portfolio Risk State (LOW / MEDIUM / HIGH / CRITICAL)               │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 4: OPPORTUNITY COST EVALUATION                                  │
│  ─────────────────────────────────                                     │
│                                                                        │
│  ┌──────────────────────────────┐                                      │
│  │ Opportunity Cost Agent       │                                      │
│  │ • Return of current trades   │                                      │
│  │ • Return of new setups       │                                      │
│  │ • Risk-adjusted comparison   │                                      │
│  └──────────────────────────────┘                                      │
│                                                                        │
│  → Capital Efficiency Recommendation                                   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 5: STRATEGY PERFORMANCE & PRIORITY ADJUSTMENT                   │
│  ────────────────────────────────────────────────                      │
│                                                                        │
│  ┌──────────────────────────────────────────┐                          │
│  │ Strategy Performance Agent               │                          │
│  │ • Tracks daily / recent PnL per strategy │                          │
│  │ • Measures drawdown contribution         │                          │
│  │ • Detects dominant market regime         │                          │
│  │ • Applies capped confidence boost        │                          │
│  │   (with decay & regime lock)             │                          │
│  └──────────────────────────────────────────┘                          │
│                                                                        │
│  → Dynamic Strategy Weights (safe & temporary)                         │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 6: MASTER DECISION ENGINE                                       │
│  ─────────────────────────────                                         │
│                                                                        │
│  ┌──────────────────────────────────────────┐                          │
│  │ Master Decision Agent                    │                          │
│  │ • Resolves strategy conflicts            │                          │
│  │ • Applies priority weights               │                          │
│  │ • Enforces risk & portfolio constraints  │                          │
│  └──────────────────────────────────────────┘                          │
│                                                                        │
│ Final Action:                                                          │
│  • Hold                                                                │
│  • Reduce (% based on capital & risk)                                  │
│  • Exit                                                                │
│  • Reallocate to better opportunity                                    │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 7: SIMULATED EXECUTION                                          │
│  ─────────────────────────────                                         │
│                                                                        │
│  • Partial exits / rebalancing                                         │
│  • Cooldown enforcement                                                │
│  • Slippage & liquidity simulation                                     │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STAGE 8: FEEDBACK & LEARNING LOOP                                     │
│  ──────────────────────────────                                        │
│                                                                        │
│  ┌──────────────────────────────────────────┐                          │
│  │ Feedback & Learning Agent                │                          │
│  │ • Outcome vs expectation tracking        │                          │
│  │ • Risk prediction accuracy               │                          │
│  │ • Feeds performance data to Stage 5      │                          │
│  └──────────────────────────────────────────┘                          │
│                                                                        │
│  → Loops back into next cycle                                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

```

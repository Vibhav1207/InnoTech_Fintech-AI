import dbConnect from '../../../lib/db';
import AgentSession from '../../../models/AgentSession';
import User from '../../../models/User';
import ActivityLog from '../../../models/ActivityLog';
import * as PortfolioManager from '../../../lib/portfolio-manager';
import * as ExecutionEngine from '../../../lib/execution-engine';
import { makeDecision } from '../../../agents/master';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    await dbConnect();

    try {
        const user = await User.findOne({});
        if (!user) return res.status(404).json({ error: 'User not found' });
        const userId = user._id;

        let session = await AgentSession.findOne({ userId });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const now = new Date();
        const lastLoop = session.lastLoopTime ? new Date(session.lastLoopTime) : new Date(0);
        
        if (now.getTime() - lastLoop.getTime() < 10000) {
            return res.status(200).json({ status: 'SKIPPED', message: 'Loop debounce active.' });
        }

        if (now.getDate() !== lastLoop.getDate() || now.getMonth() !== lastLoop.getMonth()) {
            session.tradesUsedToday = 0;
            await PortfolioManager.snapshotDailyPnL(userId);
        }

        if (session.status !== 'RUNNING') {
            return res.status(200).json({ status: 'STOPPED', message: 'Agent is not running.' });
        }

        if (session.tradesUsedToday >= session.maxTradesPerDay) {
            return res.status(200).json({ status: 'LIMIT_REACHED', message: 'Daily trade limit reached.' });
        }

        const { portfolio, positions } = await PortfolioManager.getPortfolio(userId);
        const portfolioSymbols = positions.map(p => p.symbol);
        const wishlistSymbols = session.wishlist || [];
        
        const allSymbols = [...new Set([...portfolioSymbols, ...wishlistSymbols])];

        if (allSymbols.length === 0) {
            return res.status(200).json({ status: 'IDLE', message: 'No symbols to analyze.' });
        }

        const decisions = [];
        const currentPrices = {};

        await Promise.all(allSymbols.map(async (symbol) => {
            try {
                const decision = await makeDecision(symbol, portfolio);
                decisions.push(decision);
                if (decision.marketPrice) {
                    currentPrices[symbol] = decision.marketPrice;
                }
            } catch (err) {
                console.error(`Analysis error for ${symbol}:`, err);
            }
        }));

        const executionResult = await ExecutionEngine.executeBatch(
            userId,
            decisions,
            currentPrices,
            {
                maxTradesPerDay: session.maxTradesPerDay,
                tradesUsedToday: session.tradesUsedToday,
                maxCapital: session.maxCapital
            }
        );

        const logsToSave = decisions.map(d => {
            const result = executionResult.results.find(r => r.symbol === d.symbol);
            return {
                sessionId: session._id,
                loopIteration: Date.now(),
                symbol: d.symbol,
                agentName: 'Master',
                decision: d.finalAction,
                confidence: d.finalIntentScore,
                executionResult: result ? result.status : 'SKIPPED',
                pnlImpact: 0,
                details: d.scoringBreakdown.map(b => `${b.agent}: ${b.action} (${b.score.toFixed(2)})`),
                timestamp: new Date()
            };
        });

        if (logsToSave.length > 0) {
            await ActivityLog.insertMany(logsToSave);
        }

        await PortfolioManager.updatePrices(userId, currentPrices);

        session.tradesUsedToday += executionResult.tradesExecuted;
        session.lastLoopTime = new Date();

        executionResult.results.forEach(r => {
            if (r.status === 'EXECUTED' && r.action === 'SELL' && r.realizedPnL !== undefined) {
                session.lastTradePnL = r.realizedPnL;
                if (r.realizedPnL > 0) {
                    session.consecutiveWins += 1;
                    session.consecutiveLosses = 0;
                } else if (r.realizedPnL < 0) {
                    session.consecutiveLosses += 1;
                    session.consecutiveWins = 0;
                }
            }
        });

        let riskStop = false;
        let riskMessage = '';

        if (session.consecutiveLosses >= 3) {
            riskStop = true;
            riskMessage = 'Risk Governor Triggered: 3 Consecutive Losses. Agent Stopped to prevent further drawdown.';
        } else if (session.consecutiveWins >= 3) {
            riskStop = true;
            riskMessage = 'Risk Governor Triggered: 3 Consecutive Wins. Agent Stopped to lock in profits.';
        }

        if (riskStop) {
            session.status = 'STOPPED';
            session.stoppedAt = new Date();
            await session.save();

            return res.status(200).json({
                status: 'RISK_STOP',
                message: riskMessage,
                tradesExecuted: executionResult.tradesExecuted,
                tradesUsedToday: session.tradesUsedToday,
                tradesRemaining: session.maxTradesPerDay - session.tradesUsedToday,
                sessionStats: {
                    wins: session.consecutiveWins,
                    losses: session.consecutiveLosses,
                    lastPnL: session.lastTradePnL
                },
                results: executionResult.results,
                decisions: decisions.map(d => ({
                    symbol: d.symbol,
                    action: d.finalAction,
                    score: d.finalIntentScore,
                    breakdown: d.scoringBreakdown.map(b => `${b.agent}: ${b.action} (${b.score.toFixed(2)})`)
                })),
                portfolioSummary: {
                    cash: portfolio.cashAvailable,
                    totalValue: portfolio.totalValue,
                    unrealizedPnL: portfolio.unrealizedPnL
                }
            });
        }

        await session.save();

        res.status(200).json({
            status: 'SUCCESS',
            tradesExecuted: executionResult.tradesExecuted,
            tradesUsedToday: session.tradesUsedToday,
            tradesRemaining: session.maxTradesPerDay - session.tradesUsedToday,
            sessionStats: {
                wins: session.consecutiveWins,
                losses: session.consecutiveLosses,
                lastPnL: session.lastTradePnL
            },
            results: executionResult.results,
            decisions: decisions.map(d => ({
                symbol: d.symbol,
                action: d.finalAction,
                score: d.finalIntentScore,
                breakdown: d.scoringBreakdown.map(b => `${b.agent}: ${b.action} (${b.score.toFixed(2)})`)
            })),
            portfolioSummary: {
                cash: portfolio.cashAvailable,
                totalValue: portfolio.totalValue,
                unrealizedPnL: portfolio.unrealizedPnL
            }
        });

    } catch (error) {
        console.error('Loop Error:', error);
        res.status(500).json({ error: error.message });
    }
}

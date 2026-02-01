import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AgentContext = createContext();

export function AgentProvider({ children }) {
    const [session, setSession] = useState(null);
    const [logs, setLogs] = useState([]);
    const [portfolio, setPortfolio] = useState(null);
    const [positions, setPositions] = useState([]);
    const [isLooping, setIsLooping] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [modalState, setModalState] = useState({ isOpen: false, reason: '', stats: {} });
    const loopRef = useRef(null);
    const cooldownRef = useRef(null);

    useEffect(() => {
        fetchSession();
        fetchPortfolio();
        fetchLogs();
    }, []);

    const fetchSession = async () => {
        try {
            const res = await axios.get('/api/agent/session');
            setSession(res.data);
            if (res.data.status === 'RUNNING') {
                setIsLooping(true);
            }
        } catch (err) {
            console.error('Error fetching session:', err);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get('/api/logs');
            if (res.data.logs) {
                const formattedLogs = res.data.logs.map(log => ({
                    time: new Date(log.timestamp).toLocaleTimeString(),
                    symbol: log.symbol,
                    action: log.decision,
                    score: log.confidence,
                    result: log.executionResult,
                    details: log.details
                }));
                setLogs(formattedLogs);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        }
    };

    const fetchPortfolio = async () => {
        try {
            const res = await axios.get('/api/portfolio');
            setPortfolio(res.data.portfolio);
            setPositions(res.data.positions);
        } catch (err) {
           
        }
    };

    const startAgent = async (config) => {
        try {
            const res = await axios.post('/api/agent/session', { ...config, status: 'RUNNING' });
            setSession(res.data);
            setIsLooping(true);
        } catch (err) {
            console.error(err);
        }
    };

    const stopAgent = async () => {
        try {
            const res = await axios.post('/api/agent/session', { status: 'STOPPED' });
            setSession(res.data);
            setIsLooping(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isLooping) {
            const runLoop = async () => {
                try {
                    setCooldown(30);
                    const res = await axios.post('/api/agent/loop');
                    
                    if (res.data.tradesUsedToday !== undefined) {
                        setSession(prev => ({
                            ...prev,
                            tradesUsedToday: res.data.tradesUsedToday
                        }));
                    }

                    fetchLogs();

                    if (res.data.portfolioSummary) {
                        fetchPortfolio(); 
                    }
                    
                    if (res.data.status === 'LIMIT_REACHED') {
                        setIsLooping(false);
                        await axios.post('/api/agent/session', { status: 'PAUSED' });
                        fetchSession();
                        
                        setModalState({
                            isOpen: true,
                            reason: 'Daily Trade Limit Reached',
                            stats: {
                                lastPnL: session?.sessionPnL || session?.lastTradePnL || 0,
                                tradesUsedToday: res.data.tradesUsedToday || session.maxTradesPerDay,
                                maxTradesPerDay: session.maxTradesPerDay,
                                wins: session.consecutiveWins,
                                losses: session.consecutiveLosses
                            }
                        });
                    }

                    if (res.data.status === 'STOPPED') {
                        setIsLooping(false);
                        fetchSession();
                    }

                    if (res.data.status === 'RISK_STOP') {
                        setIsLooping(false);
                        fetchSession();
                        
                        setModalState({
                            isOpen: true,
                            reason: res.data.message || 'Risk Governor Triggered',
                            stats: res.data.sessionStats ? {
                                lastPnL: res.data.sessionStats.sessionPnL || res.data.sessionStats.lastPnL || 0,
                                tradesUsedToday: res.data.tradesUsedToday,
                                maxTradesPerDay: session.maxTradesPerDay,
                                wins: res.data.sessionStats.wins,
                                losses: res.data.sessionStats.losses
                            } : {
                                lastPnL: session.sessionPnL || 0,
                                tradesUsedToday: session.tradesUsedToday,
                                maxTradesPerDay: session.maxTradesPerDay,
                                wins: 0,
                                losses: 0
                            }
                        });
                    }

                    if (res.data.portfolioSummary && res.data.portfolioSummary.cash < 10 && positions.length === 0) {
                          setIsLooping(false);
                          await axios.post('/api/agent/session', { status: 'STOPPED' });
                          fetchSession();
                          
                          setModalState({
                            isOpen: true,
                            reason: 'Insufficient Capital to Trade (Cash < $10)',
                            stats: {
                                lastPnL: session?.lastTradePnL || 0,
                                tradesUsedToday: res.data.tradesUsedToday,
                                maxTradesPerDay: session.maxTradesPerDay,
                                wins: session.consecutiveWins,
                                losses: session.consecutiveLosses
                            }
                         });
                    }

                } catch (err) {
                    console.error('Loop Error', err);
                    setIsLooping(false);
                }
            };

            runLoop();
            
            loopRef.current = setInterval(runLoop, 30000);

            return () => clearInterval(loopRef.current);
        }
    }, [isLooping]);

    useEffect(() => {
        if (isLooping && cooldown > 0) {
            cooldownRef.current = setInterval(() => {
                setCooldown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(cooldownRef.current);
        }
    }, [isLooping, cooldown]);

    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        fetchSession();
        fetchPortfolio();
        fetchLogs();
    }, []);

    // ... existing fetch functions ...

    useEffect(() => {
        const pollInterval = setInterval(async () => {
            if (isPolling) return; // Skip if previous poll is still running
            setIsPolling(true);
            try {
                await Promise.all([
                    fetchPortfolio(),
                    fetchSession(),
                    fetchLogs()
                ]);
            } catch (err) {
                console.error("Polling error", err);
            } finally {
                setIsPolling(false);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [isPolling]);

    const closeModal = () => setModalState({ ...modalState, isOpen: false });

    return (
        <AgentContext.Provider value={{ 
            session, 
            logs, 
            portfolio, 
            positions, 
            startAgent, 
            stopAgent, 
            isLooping, 
            cooldown,
            modalState,
            closeModal
        }}>
            {children}
        </AgentContext.Provider>
    );
}

export const useAgent = () => useContext(AgentContext);

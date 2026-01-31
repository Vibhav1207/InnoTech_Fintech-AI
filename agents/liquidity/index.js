export async function analyze(symbol) {
  
  return {
    agent: 'liquidity',
    symbol,
    action: 'HOLD', 
    isLiquid: true,
    confidence: 0.9,
    reason: 'Sufficient volume'
  };
}

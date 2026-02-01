import * as defaultTechnicalAgent from '../technical';
import * as defaultSentimentAgent from '../sentiment';
import * as defaultQuantAgent from '../quant';
import * as defaultRiskAgent from '../risk';

export async function makeDecision(symbol, portfolio, dependencies = {}) {
  const {
      technicalAgent = defaultTechnicalAgent,
      sentimentAgent = defaultSentimentAgent,
      quantAgent = defaultQuantAgent,
      riskAgent = defaultRiskAgent
  } = dependencies;

  const masterLogs = [];
  const log = (msg) => {
      console.log(msg);
      masterLogs.push(`[MASTER] ${msg}`);
  };

  log(`--- Master Agent (Judge) Initiated for ${symbol} ---`);

  const runAgent = async (agent, name, ...args) => {
    try {

      log(`Delegating analysis to ${name} agent...`);
      const result = await agent.analyze(...args);
      if (!result) throw new Error('Empty result');
      return result;
    } catch (err) {
      const errorMsg = `Error in ${name} Agent for ${symbol}: ${err.message}`;
      console.error(errorMsg);
      masterLogs.push(`[MASTER ERROR] ${errorMsg}`);
      return {
        agent: name,
        action: 'HOLD',
        decisions: ['HOLD', 'HOLD'],
        confidence: 0,
        reason: `Agent failed: ${err.message}`,
        data: {},
        logs: [`[${name.toUpperCase()} ERROR] ${err.message}`]
      };
    }
  };

  const tech = await runAgent(technicalAgent, 'technical', symbol);

  const sent = await runAgent(sentimentAgent, 'sentiment', symbol);
  const quant = await runAgent(quantAgent, 'quant', symbol);
  const risk = await runAgent(riskAgent, 'risk', symbol, portfolio);

  const marketPrice = (tech && tech.data && tech.data.price) ? tech.data.price : 0;


  let allLogs = [...masterLogs];
  [tech, sent, quant, risk].forEach(agentResult => {
      if (agentResult && agentResult.logs) {
          allLogs = [...allLogs, ...agentResult.logs];
      }
  });

  log('--- JUDGE LOGIC START ---');

  let candidates = [];

  
  const processAgent = (agentRes, agentName) => {
      if (!agentRes || !agentRes.decisions) return;
      agentRes.decisions.forEach(action => {
          candidates.push({
              agentName: agentName,
              action: action,
              agentConfidence: agentRes.confidence || 0,
              agentMetrics: agentRes.data || {}
          });
      });
  };

  processAgent(risk, 'Liquidity Agent');
  processAgent(tech, 'Technical Agent');
  processAgent(quant, 'Momentum/Stats Agent');
  processAgent(sent, 'Sentiment Agent');

  log(`Step 0: Expanded candidates. Total: ${candidates.length}`);
  candidates.forEach(c => log(`  - ${c.agentName}: ${c.action} (Conf: ${c.agentConfidence.toFixed(2)})`));

  const AGENT_WEIGHTS = {
      'Liquidity Agent': 1.00,
      'Technical Agent': 0.85,
      'Momentum/Stats Agent': 0.75,
      'Sentiment Agent': 0.60
  };
  
  log('Step 1: Applied Domain Priority Weights.');

  const ACTION_SCORES = {
      'BUY_MORE': 2,

      'HOLD': 0,
      'REDUCE': -1,
      'EXIT': -2,
      'REALLOCATE': 0,
      'BUY': 2,
      'SELL': -2
  };


  log('Step 2: Mapped actions to intent strength.');

  const exitRiskState = risk.data && risk.data.exitRiskState ? risk.data.exitRiskState : 'LOW';
  const liquidityAction = risk.action;
  
  let vetoApplied = false;

  if (liquidityAction === 'SELL' || liquidityAction === 'EXIT' || (liquidityAction === 'REDUCE' && exitRiskState === 'HIGH')) {
      log(`Step 3: LIQUIDITY VETO TRIGGERED (Risk State: ${exitRiskState}, Action: ${liquidityAction})`);
      log('  -> Removing ALL BUY_MORE candidates.');
      
      const beforeCount = candidates.length;
      candidates = candidates.filter(c => c.action !== 'BUY_MORE' && c.action !== 'BUY');
      const afterCount = candidates.length;
      
      if (beforeCount !== afterCount) vetoApplied = true;
      log(`  -> Removed ${beforeCount - afterCount} candidates.`);
  } else {
      log('Step 3: No Liquidity Veto applied.');
  }

  const getQualityMultiplier = (c) => {
      let multiplier = 1.0;
      const m = c.agentMetrics;

      if (c.agentName === 'Technical Agent') {
           multiplier = 1.0; 
      } else if (c.agentName === 'Momentum/Stats Agent') {
           if (m.momentum5d > 0.02 && m.momentum20d > 0.05) multiplier = 1.2;
           if (m.zScore > 2 || m.zScore < -2) multiplier = 0.9;
      } else if (c.agentName === 'Liquidity Agent') {
           if (m.exitRiskState === 'LOW') multiplier = 1.2;
           if (m.exitRiskState === 'HIGH') multiplier = 0.8;
      } else if (c.agentName === 'Sentiment Agent') {
           if (m.mood === 'BULLISH' && m.volumeIntensity === 'HIGH') multiplier = 1.1;
      }

      return Math.max(0.5, Math.min(1.5, multiplier));
  };

  candidates = candidates.map(c => {
      const weight = AGENT_WEIGHTS[c.agentName] || 0.5;
      const intentScore = ACTION_SCORES[c.action] || 0;
      const actionStrength = Math.abs(intentScore);
      const quality = getQualityMultiplier(c);
      
      const score = weight * c.agentConfidence * actionStrength * quality;
      
      return {
          ...c,
          score: score,
          intentScore: intentScore,
          quality: quality
      };
  });

  log('Step 4: Candidates Scored.');

  candidates.sort((a, b) => b.score - a.score);
  log('Step 5: Candidates Ranked by Score (Descending).');

  const top4 = [];
  const agentCounts = {};
  
  for (const c of candidates) {
      if (top4.length >= 4) break;
      
      const count = agentCounts[c.agentName] || 0;
      if (count < 2) {
          top4.push(c);
          agentCounts[c.agentName] = count + 1;
      }
  }

  log('Step 6: Selected TOP 4 with Diversity Constraint (Max 2 per agent).');
  top4.forEach((c, i) => log(`  #${i+1}: ${c.agentName} -> ${c.action} (Score: ${c.score.toFixed(3)})`));

  let finalIntentScore = 0;
  top4.forEach(c => {
      const sign = Math.sign(c.intentScore);
      
      finalIntentScore += (c.score * sign);
  });

  log(`Step 7: Aggregated Intent Score: ${finalIntentScore.toFixed(3)}`);

  // Profit Taking Logic
  if (portfolio && portfolio.positions) {
      const position = portfolio.positions.find(p => p.symbol === symbol);
      if (position) {
          const currentPrice = marketPrice || position.currentPrice || position.avgPrice;
          const unrealizedPnL = (currentPrice - position.avgPrice) * position.qty;
          const returnPct = (unrealizedPnL / (position.avgPrice * position.qty)) * 100;

          log(`Profit Check: Return ${returnPct.toFixed(2)}% ($${unrealizedPnL.toFixed(2)})`);

          if (returnPct > 5) {
              log('  -> Profit > 5%: Applying Profit Taking Bias (-0.5 to score)');
              finalIntentScore -= 0.5;
          }
          if (returnPct > 10) {
              log('  -> Profit > 10%: Strong Profit Taking Bias (-1.5 to score)');
              finalIntentScore -= 1.5;
          }
          if (returnPct > 15) {
              log('  -> Profit > 15%: HUGE WIN -> FORCE TAKE PROFIT');
              finalIntentScore = -100;
              finalDecision = 'EXIT';
          }

          // Stop Loss Logic
          if (returnPct < -5) {
               log('  -> Loss < -5%: Applying Stop Loss Bias (-0.5 to score)');
               finalIntentScore -= 0.5;
          }
          if (returnPct < -8) {
               log('  -> Loss < -8%: CRITICAL STOP LOSS -> FORCE EXIT');
               finalIntentScore = -100; // Force score to be extremely negative
               finalDecision = 'EXIT';
          }
      }
  }

  // Force Exit if Risk Agent screams SELL/EXIT with High Confidence
  if (liquidityAction === 'SELL' || liquidityAction === 'EXIT') {
      if (risk.confidence > 0.8) {
          log('  -> Risk Agent CRITICAL signal -> Overriding to EXIT');
          finalIntentScore = -100;
          finalDecision = 'EXIT';
      }
  }

  const T = 0.3; // Lowered threshold from 0.5 to make it more sensitive
  
  // If we haven't already forced an exit
  if (finalIntentScore > -50) {
      if (finalIntentScore > T) {
          finalDecision = 'BUY_MORE';
      } else if (finalIntentScore < -0.25) { 
          finalDecision = 'SELL_PATH';
      } else {
          finalDecision = 'HOLD';
      }
  }

  log(`  -> Preliminary Decision based on Threshold T=${T}: ${finalDecision}`);

  if (finalDecision === 'SELL_PATH') {
      if (exitRiskState === 'HIGH') {
          finalDecision = 'EXIT';
          log('Step 8: High Exit Risk -> FORCE EXIT');
      } else {
          finalDecision = 'REDUCE';
          log('Step 8: Moderate/Low Risk -> REDUCE');
      }
  } else {
      log(`Step 8: No sell path resolution needed (Decision is ${finalDecision}).`);
  }

  let reallocate = false;
  if (finalDecision === 'REDUCE' || finalDecision === 'EXIT') {
      reallocate = true; 
      log('Step 9: Capital freed up (REDUCE/EXIT) -> Reallocation candidate.');
  }
  
  const reasoningSummary = `Master Agent decided to ${finalDecision} based on a final intent score of ${finalIntentScore.toFixed(2)}. ` +
                           `Top contributors were ${top4.map(c => c.agentName).join(', ')}. ` +
                           (vetoApplied ? 'Liquidity Veto was active. ' : '') +
                           (reallocate ? 'Capital made available for reallocation.' : '');

  log(`*** FINAL DECISION: ${finalDecision} ***`);

  allLogs = [...allLogs, ...masterLogs];

  return {
      symbol,
      finalAction: finalDecision,
      finalIntentScore,
      marketPrice,
      top4Candidates: top4,
      vetoApplied,
      reallocate,
      scoringBreakdown: top4.map(c => ({
          agent: c.agentName,
          action: c.action,
          score: c.score,
          contribution: c.score * Math.sign(c.intentScore)
      })),
      reasoning: reasoningSummary,
      logs: allLogs
  };
}

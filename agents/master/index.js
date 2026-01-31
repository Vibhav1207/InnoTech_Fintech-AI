import * as technicalAgent from '../technical';
import * as sentimentAgent from '../sentiment';
import * as quantAgent from '../quant';
import * as riskAgent from '../risk';

export async function makeDecision(symbol, portfolio) {
  const masterLogs = [];
  const log = (msg) => {
      console.log(msg);
      masterLogs.push(`[MASTER] ${msg}`);
  };

  log(`--- Master Agent Initiated for ${symbol} ---`);

  // Helper to safely run an agent
  const runAgent = async (agent, name, ...args) => {
    try {
      log(`Delegating analysis to ${name} agent...`);
      const result = await agent.analyze(...args);
      if (!result) throw new Error('Empty result');
      log(`${name} agent returned action: ${result.action} (Confidence: ${result.confidence})`);
      return result;
    } catch (err) {
      const errorMsg = `Error in ${name} Agent for ${symbol}: ${err.message}`;
      console.error(errorMsg);
      masterLogs.push(`[MASTER ERROR] ${errorMsg}`);
      return {
        agent: name,
        action: 'HOLD',
        confidence: 0,
        reason: `Agent failed: ${err.message}`,
        logs: [`[${name.toUpperCase()} ERROR] ${err.message}`]
      };
    }
  };

  const tech = await runAgent(technicalAgent, 'technical', symbol);
  const sent = await runAgent(sentimentAgent, 'sentiment', symbol);
  const quant = await runAgent(quantAgent, 'quant', symbol);
  const risk = await runAgent(riskAgent, 'risk', symbol, portfolio);

  const decisions = [tech, sent, quant, risk].filter(d => d && d.action);
  
  // Aggregate logs from all agents
  let allLogs = [...masterLogs];
  [tech, sent, quant, risk].forEach(agentResult => {
      if (agentResult && agentResult.logs) {
          allLogs = [...allLogs, ...agentResult.logs];
      }
  });

  log('Aggregating sub-agent scores...');
  
  let buyScore = 0;
  let sellScore = 0;
  let holdScore = 0;
  
  decisions.forEach(d => {
      if (d.action === 'BUY') buyScore += d.confidence;
      else if (d.action === 'SELL') sellScore += d.confidence;
      else holdScore += d.confidence;
  });

  log(`Scores - BUY: ${buyScore.toFixed(2)}, SELL: ${sellScore.toFixed(2)}, HOLD: ${holdScore.toFixed(2)}`);

  let finalAction = 'HOLD';
  let finalConfidence = 0;
  let reason = '';

  const THRESHOLD = 1.2;

  if (buyScore > sellScore && buyScore > THRESHOLD) {
      finalAction = 'BUY';
      finalConfidence = buyScore / (decisions.length || 1);
      reason = `Strong BUY consensus (Score: ${buyScore.toFixed(2)})`;
  } else if (sellScore > buyScore && sellScore > THRESHOLD) {
      finalAction = 'SELL';
      finalConfidence = sellScore / (decisions.length || 1);
      reason = `Strong SELL consensus (Score: ${sellScore.toFixed(2)})`;
  } else {
      finalAction = 'HOLD';
      finalConfidence = decisions.reduce((acc, d) => acc + (d.confidence || 0), 0) / (decisions.length || 1);
      reason = `Market is mixed or neutral. Agents suggest waiting. (Buy Score: ${buyScore.toFixed(2)}, Sell Score: ${sellScore.toFixed(2)})`;
  }

  log(`Preliminary decision: ${finalAction}`);

  // Risk Override
  if (finalAction === 'BUY' && risk.action === 'SELL') { // Assuming Risk 'EXIT' maps to SELL or specific logic
      log('RISK VETO TRIGGERED: High Risk detected despite bullish signals.');
      finalAction = 'HOLD';
      finalConfidence = risk.confidence;
      reason = 'Risk Agent VETO: High Risk detected despite bullish signals.';
      
      // Update logs before early return
      allLogs.push(`[MASTER] Risk Veto applied. Switching to HOLD.`);
      
      return {
          action: 'HOLD',
          confidence: finalConfidence,
          reason: reason,
          subDecisions: decisions,
          logs: allLogs
      };
  }

  log(`Final Decision: ${finalAction} (${reason})`);
  
  // Update logs before return
  allLogs.push(`[MASTER] Final Decision: ${finalAction}`);

  return {
      action: finalAction,
      confidence: finalConfidence,
      reason: reason,
      subDecisions: decisions,
      logs: allLogs
  };
}

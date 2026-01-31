const http = require('http');

const data = JSON.stringify({
  symbol: 'IBM',
  portfolioId: 'test-portfolio'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/run-agents',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Triggering Agents (including Risk) for AAPL...');

const req = http.request(options, (res) => {
  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseBody);
      if (parsed.success) {
        console.log('\n--- Master Agent Result ---');
        console.log(`Action: ${parsed.decision.action}`);
        console.log(`Confidence: ${parsed.decision.confidence}`);
        console.log(`Reason: ${parsed.decision.reason}`);
        
        const riskDecision = parsed.decision.subDecisions.find(d => d.agent === 'risk');
        console.log('\n--- Risk Agent Details ---');
        console.log(JSON.stringify(riskDecision, null, 2));
      } else {
        console.error('API Error:', parsed.error || parsed.message);
      }
    } catch (e) {
      console.error('Response parse error:', e);
      console.log('Raw response:', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();

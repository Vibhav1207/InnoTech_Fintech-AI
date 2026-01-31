
async function triggerAgent() {
  console.log('Triggering agents for MSFT...');
  try {
    const res = await fetch('http://localhost:3000/api/run-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'MSFT' })
    });
    console.log('Request sent. Check server logs for detailed output.');
  } catch (err) {
    console.error('Error:', err);
  }
}

triggerAgent();

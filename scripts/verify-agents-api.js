
const http = require('http');

const AGENTS = [
    'technical',
    'sentiment',
    'quant',
    'risk',
    'liquidity',
    'analyze' // Master agent
];

const PORT = 3002; // Using port 3002 to avoid conflicts
const SYMBOL = 'IBM';

function callApi(agent) {
    return new Promise((resolve, reject) => {
        const path = `/api/test/${agent}?symbol=${SYMBOL}`;
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        resolve({ agent, success: true, data: json });
                    } catch (e) {
                        resolve({ agent, success: false, error: 'Invalid JSON' });
                    }
                } else {
                    resolve({ agent, success: false, status: res.statusCode, error: data });
                }
            });
        });

        req.on('error', (e) => {
            resolve({ agent, success: false, error: e.message });
        });

        req.end();
    });
}

async function runTests() {
    console.log(`Testing Agent APIs on port ${PORT} for symbol ${SYMBOL}...`);
    console.log('---------------------------------------------------');

    let allPassed = true;

    for (const agent of AGENTS) {
        process.stdout.write(`Testing ${agent}... `);
        const result = await callApi(agent);
        
        if (result.success) {
            console.log('✅ PASS');
            // console.log(`  Response keys: ${Object.keys(result.data).join(', ')}`);
        } else {
            console.log('❌ FAIL');
            console.log(`  Error: ${result.error || result.status}`);
            allPassed = false;
        }
    }

    console.log('---------------------------------------------------');
    if (allPassed) {
        console.log('🎉 All Agent APIs are working correctly!');
    } else {
        console.error('⚠️ Some Agent APIs failed. Please check the logs.');
        process.exit(1);
    }
}

runTests();

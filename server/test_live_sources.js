const axios = require('axios');

async function testLiveSources() {
  console.log('=== TESTING LIVE VERCEL VIDEO RESOLVER API ===');
  const tests = [
    { source: 'subjav', id: '36104' },
    { source: 'javtiful', id: 'FC2-PPV-4966033' },
    { source: 'javhdz', id: '4003' },
    { source: 'javsub', id: '36019' }
  ];

  for (const t of tests) {
    try {
      const url = `https://phimcuatoi.vercel.app/api/video/${t.source}/${t.id}`;
      console.log(`\nTesting ${url}...`);
      const res = await axios.get(url, { timeout: 10000 });
      console.log(`  [SUCCESS ${t.source.toUpperCase()}] Status:`, res.status, 'Response:', JSON.stringify(res.data));
    } catch (e) {
      console.error(`  [FAIL ${t.source.toUpperCase()}] Error:`, e.message);
    }
  }
}

testLiveSources();

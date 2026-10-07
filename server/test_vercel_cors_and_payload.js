const axios = require('axios');

async function testVercelCorsAndPayload() {
  console.log('=== TESTING VERCEL API CORS & PAYLOADS ===\n');

  const sources = [
    { source: 'javhdz', id: '4003' },
    { source: 'javsub', id: 'co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do' },
    { source: 'javtiful', id: 'fc2-ppv-4966033' },
    { source: 'subjav', id: '36019' }
  ];

  for (const s of sources) {
    console.log(`--- Testing ${s.source.toUpperCase()} (${s.id}) ---`);
    try {
      const url = `https://phimcuatoi.vercel.app/api/video/${s.source}/${encodeURIComponent(s.id)}?_t=${Date.now()}`;
      const res = await axios.get(url, { timeout: 10000 });
      console.log('  Status:', res.status);
      console.log('  Data:', res.data);
      console.log('  Headers:', {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'cache-control': res.headers['cache-control']
      });
    } catch (e) {
      console.error('  FAIL:', e.message);
      if (e.response) {
        console.log('  Response status:', e.response.status, 'data:', e.response.data);
      }
    }
    console.log('\n');
  }
}

testVercelCorsAndPayload();

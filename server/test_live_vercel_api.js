const axios = require('axios');

async function testLiveVercelApi() {
  console.log('=== TESTING LIVE VERCEL API ===');
  const urls = [
    'https://phimcuatoi.vercel.app/api/movies?page=1&limit=50',
    'https://phimcuatoi.vercel.app/api/stats'
  ];

  for (const url of urls) {
    try {
      console.log(`\nFetching ${url}...`);
      const res = await axios.get(url, { timeout: 10000 });
      console.log('  Status:', res.status);
      console.log('  Data snippet:', JSON.stringify(res.data).slice(0, 300));
    } catch (e) {
      console.error(`  Error for ${url}:`, e.message);
      if (e.response) {
        console.log('  Response status:', e.response.status, 'Data:', JSON.stringify(e.response.data).slice(0, 300));
      }
    }
  }
}

testLiveVercelApi();

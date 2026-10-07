const axios = require('axios');

async function testAll4EmbedsLive() {
  console.log('=== TESTING ALL 4 SERVER PROXY EMBED ENDPOINTS ON LIVE VERCEL ===\n');

  const testCases = [
    { name: 'JAVHDz', path: '/api/embed/javhdz/4003' },
    { name: 'JAVSub', path: '/api/embed/javsub/co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do' },
    { name: 'JavTiful', path: '/api/embed/javtiful/fc2-ppv-4966033' },
    { name: 'SubJAV', path: '/api/embed/subjav/36019' }
  ];

  for (const tc of testCases) {
    console.log(`--- Testing ${tc.name} Embed (${tc.path}) ---`);
    try {
      const url = `https://phimcuatoi.vercel.app${tc.path}`;
      const res = await axios.get(url, { timeout: 10000 });
      console.log('  Status:', res.status);
      console.log('  HTML Length:', res.data.length);
      console.log('  Snippet:', res.data.slice(0, 150).replace(/\n/g, ' '));
    } catch (e) {
      console.error('  FAIL:', e.message);
      if (e.response) {
        console.log('  Response Status:', e.response.status, 'Data:', e.response.data);
      }
    }
    console.log('\n');
  }
}

testAll4EmbedsLive();

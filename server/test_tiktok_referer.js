const axios = require('axios');

async function testTiktokReferer() {
  const url = 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-4003-playlist.m3u8';
  console.log('=== TESTING TIKTOK CDN REFERERS ===\n');

  const referers = [
    'https://javhdz.site/',
    'https://javhdz.fit/',
    'https://javhdz.com/',
    'https://tiktok.com/',
    'https://www.tiktok.com/',
    ''
  ];

  for (const ref of referers) {
    try {
      const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
      if (ref) headers['Referer'] = ref;

      const res = await axios.get(url, { timeout: 6000, headers });
      console.log(`[SUCCESS] Referer: "${ref}" -> Status ${res.status}, Length ${res.data.length}`);
    } catch (e) {
      console.log(`[FAIL] Referer: "${ref}" -> Error: ${e.message}`);
    }
  }
}

testTiktokReferer();

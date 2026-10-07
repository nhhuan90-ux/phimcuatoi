const axios = require('axios');

async function testJavhdzFit() {
  console.log('=== TESTING JAVHDZ.FIT AND JAVHDZ.SITE ===');

  const candidates = ['javhdz.fit', 'javhdz.site'];

  for (const domain of candidates) {
    console.log(`\nTesting domain: ${domain}`);
    try {
      const link = `https://${domain}/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html`;
      const res = await axios.get(link, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      console.log('  Page status:', res.status, 'Length:', res.data.length);
      const atobMatch = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (atobMatch) {
        const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf-8');
        console.log('  [SUCCESS JAVHDZ] HLS Stream URL:', decoded);
      } else {
        console.log('  atob match not found');
      }
    } catch (e) {
      console.error('  Error:', e.message);
    }
  }
}

testJavhdzFit();

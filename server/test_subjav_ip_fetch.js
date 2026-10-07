const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavIpFetch() {
  // Try fetching via Host header on Cloudflare IP 2.59.170.20
  const agent = new https.Agent({ rejectUnauthorized: false });
  try {
    const res = await axios.get('https://2.59.170.20/jav-vietsub/', {
      timeout: 8000,
      headers: { 'User-Agent': UA, 'Host': 'subjav.city' },
      httpsAgent: agent
    });
    console.log('[SUCCESS] IP Direct Fetch Status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    console.log('Movies count:', $('.item-video').length);
  } catch (e) {
    console.error('IP Direct Fetch Error:', e.message);
  }
}

testSubjavIpFetch();

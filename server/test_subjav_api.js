const axios = require('axios');
const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const agent = new https.Agent({ rejectUnauthorized: false });

async function testSubjavTiktokApi() {
  const hosts = ['subjav.city', 'subjav.love', 'subjav.st', 'subjav.site', 'subjav.net', 'subjav.vip', 'subjav.app', 'subjav.moe'];
  for (const h of hosts) {
    const url = `https://${h}/wp-json/tiktok/v1/videos/grid?page=1&limit=10`;
    try {
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA }, httpsAgent: agent });
      console.log(`[ALIVE API] ${url} -> Status: ${res.status}, Count: ${res.data?.videos?.length}`);
      if (res.status === 200 && res.data?.videos?.length > 0) {
        console.log(`[VERIFIED SUBJAV API DOMAIN] -> ${h}`);
        return h;
      }
    } catch (e) {
      console.log(`[FAIL API] ${url} -> ${e.message}`);
    }
  }
}

testSubjavTiktokApi();

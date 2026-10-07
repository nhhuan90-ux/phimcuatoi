const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavsubVietnameseTlds() {
  const tlds = ['blog', 'site', 'online', 'in', 'app', 'co', 'fun', 'me', 'moe', 'us', 'info', 'club', 'vip', 'pro', 'live', 'tv', 'cc', 'win', 'today', 'is', 'asia', 'fit', 'one', 'lat', 'icu', 'cam', 'lol', 'ink', 'link', 'work'];
  for (const ext of tlds) {
    const host = `javsub.${ext}`;
    try {
      const res = await axios.get(`https://${host}/`, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      const count = $('.item').length;
      if (res.status === 200 && count > 0) {
        console.log(`[VERIFIED VIETNAMESE JAVSUB DOMAIN] -> https://${host} (${count} movies parsed)`);
        return host;
      }
    } catch (e) {}
  }
  console.log('No Vietnamese JAVSub domain found in scan.');
}

testJavsubVietnameseTlds();

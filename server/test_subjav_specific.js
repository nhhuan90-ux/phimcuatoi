const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavSpecific() {
  const hosts = ['subjav.site', 'subjav.net', 'subjav.vip', 'subjav.app', 'subjav.moe', 'subjav.fun', 'subjav.win'];
  for (const h of hosts) {
    try {
      const res = await axios.get(`https://${h}/`, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      const count = $('.item-video').length || $('article').length || $('.video-item').length;
      console.log(`[ALIVE] https://${h}/ -> Status: ${res.status}, Count: ${count}`);
      if (res.status === 200 && count > 0) {
        console.log(`[VERIFIED SUBJAV DOMAIN] -> ${h}`);
        return h;
      }
    } catch (e) {
      console.log(`[FAIL] https://${h}/ -> ${e.message}`);
    }
  }
}

testSubjavSpecific();

const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavTlds() {
  const domains = ['subjav.phd', 'subjav.st', 'subjav.site', 'subjav.love', 'subjav.net', 'subjav.app', 'subjav.vip', 'subjav.pro', 'subjav.live', 'subjav.tv', 'subjav.is', 'subjav.in'];
  for (const d of domains) {
    try {
      const res = await axios.get(`https://${d}/`, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      const count = $('.item-video').length || $('article').length || $('.video-item').length || $('a[href*="/video/"]').length;
      if (res.status === 200 && count > 0) {
        console.log(`[VERIFIED SUBJAV DOMAIN] -> https://${d} (${count} movies parsed)`);
        return d;
      }
    } catch (e) {}
  }
  console.log('No SubJAV domain found in list.');
}

testSubjavTlds();

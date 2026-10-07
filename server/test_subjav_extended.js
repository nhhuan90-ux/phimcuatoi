const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavTlds() {
  const tlds = ['in', 'pw', 'vip', 'fun', 'cam', 'cfd', 'one', 'icu', 'link', 'org', 'work', 'lol', 'fit', 'run', 'ink', 'pro', 'click', 'info', 'asia', 'store', 'online', 'website', 'live', 'tv', 'cc', 'co', 'biz', 'io', 'us'];
  for (const ext of tlds) {
    const host = `subjav.${ext}`;
    try {
      const res = await axios.get(`https://${host}/jav-vietsub/`, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      const count = $('.item-video').length || $('article').length;
      if (res.status === 200 && count > 0) {
        console.log(`[VERIFIED SUBJAV DOMAIN] -> https://${host} (${count} movies)`);
        return host;
      }
    } catch (e) {}
  }
  console.log('No SubJAV domain found in extended list.');
}

testSubjavTlds();

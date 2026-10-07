const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjav() {
  const domains = ['subjav.city', 'subjav.st', 'subjav.site', 'subjav.love', 'subjav.net', 'subjav.cc', 'subjav.mobi', 'subjav.top', 'subjav.red', 'subjav.club', 'subjav.me'];
  for (const d of domains) {
    try {
      const res = await axios.get(`https://${d}/jav-vietsub/`, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      const count = $('.item-video').length || $('article').length;
      if (res.status === 200 && count > 0) {
        console.log(`[ALIVE SUBJAV DOMAIN] -> https://${d} (${count} movies)`);
        return d;
      }
    } catch (e) {
      console.log(`[DEAD SUBJAV] ${d} -> ${e.message}`);
    }
  }
}

testSubjav();

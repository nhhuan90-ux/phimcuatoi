const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavUserDomains() {
  const domains = ['subjav.bike', 'subjav1.blog', 'subjav.st'];
  for (const d of domains) {
    try {
      const res = await axios.get(`https://${d}/jav-vietsub/`, { timeout: 8000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      const count = $('.item-video').length || $('.video-item').length || $('article').length;
      console.log(`[ALIVE SUBJAV] https://${d}/ Status: ${res.status}, Movies count: ${count}`);
    } catch (e) {
      console.log(`[FAIL SUBJAV] https://${d}/ Error: ${e.message}`);
    }
  }
}

testSubjavUserDomains();

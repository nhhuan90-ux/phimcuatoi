const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavtifulComDetailed() {
  console.log('=== TESTING JAVTIFUL.COM DETAILED ===');
  try {
    const res = await axios.get('https://javtiful.com/', {
      timeout: 12000,
      headers: { 'User-Agent': UA },
      maxRedirects: 5
    });
    console.log('[SUCCESS] https://javtiful.com/ Status:', res.status, 'URL:', res.request.res.responseUrl || res.config.url);
    const $ = cheerio.load(res.data);
    const count = $('a[href*="/video/"]').length;
    console.log(`  Parsed ${count} videos on javtiful.com!`);
  } catch (e) {
    console.log(`[FAIL] https://javtiful.com/ -> ${e.message}`);
  }
}

testJavtifulComDetailed();

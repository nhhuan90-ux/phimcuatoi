const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavSt() {
  const agent = new https.Agent({ rejectUnauthorized: false });
  try {
    const res = await axios.get('https://subjav.st/jav-vietsub/', {
      timeout: 8000,
      headers: { 'User-Agent': UA },
      httpsAgent: agent
    });
    console.log('[SUCCESS] https://subjav.st/jav-vietsub/ -> Status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    const count = $('.item-video').length || $('article').length || $('.video-item').length;
    console.log(`  Parsed movies count on subjav.st: ${count}`);
    return true;
  } catch (e) {
    console.error('subjav.st error:', e.message);
    return false;
  }
}

testSubjavSt();

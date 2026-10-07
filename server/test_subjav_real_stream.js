const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavFollowRedirect(domain) {
  try {
    const res = await axios.get(`https://${domain}/jav-vietsub/`, {
      timeout: 8000,
      headers: { 'User-Agent': UA },
      maxRedirects: 5
    });
    console.log(`[SUCCESS] https://${domain}/jav-vietsub/ -> Status: ${res.status}, Length: ${res.data.length}`);
    const $ = cheerio.load(res.data);
    const count = $('.item-video').length || $('.video-item').length || $('article').length;
    console.log(`  Parsed movies count: ${count}`);
    return count > 0;
  } catch (e) {
    console.log(`[FAIL] https://${domain}/jav-vietsub/ -> ${e.message}`);
    return false;
  }
}

async function run() {
  await testSubjavFollowRedirect('subjav.city');
  await testSubjavFollowRedirect('subjav.st');
  await testSubjavFollowRedirect('subjav.love');
  await testSubjavFollowRedirect('subjav.site');
  await testSubjavFollowRedirect('subjav.net');
}

run();

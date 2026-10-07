const axios = require('axios');
const cheerio = require('cheerio');

async function testFreshJavhdzDecoding() {
  console.log('=== TESTING FRESH JAVHDZ STREAM DECODING ===');

  try {
    const res = await axios.get('https://javgiga.net/fc2ppv-4604524-engsub/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('Javgiga movie page status:', res.status);
    const $ = cheerio.load(res.data);
    const iframes = $('iframe').map((i, el) => $(el).attr('src')).get();
    console.log('Iframes found:', iframes);

    for (const iframeUrl of iframes) {
      if (iframeUrl.includes('morencius.com') || iframeUrl.includes('embed') || iframeUrl.includes('play')) {
        try {
          const iframeRes = await axios.get(iframeUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javgiga.net/' }
          });
          console.log(`  [IFRAME SUCCESS] ${iframeUrl} Status: ${iframeRes.status}, Length: ${iframeRes.data.length}`);
        } catch (e) {
          console.log(`  [IFRAME FAIL] ${iframeUrl}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testFreshJavhdzDecoding();

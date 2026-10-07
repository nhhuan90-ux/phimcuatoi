const axios = require('axios');
const cheerio = require('cheerio');

async function testJur820Embed() {
  const url = 'https://javgiga.net/jur-820-mosaic/';
  console.log('=== TESTING JUR-820-MOSAIC EMBED ===');

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe[src*="morencius"], iframe[src*="vidhide"], iframe').first().attr('src');
    console.log('Extracted VidHide iframe src:', iframeSrc);

    if (iframeSrc) {
      const iframeRes = await axios.get(iframeSrc, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javgiga.net/' }
      });
      console.log('  [SUCCESS VIDHIDE EMBED FETCH] Status:', iframeRes.status, 'Length:', iframeRes.data.length);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJur820Embed();

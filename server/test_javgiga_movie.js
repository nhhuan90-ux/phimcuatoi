const axios = require('axios');
const cheerio = require('cheerio');

async function testJavgigaMovie() {
  console.log('=== TESTING JAVGIGA MOVIE PAGE EXTRACTION ===');
  const code = 'goji-111';
  const url = `https://javgiga.net/${code}/`;

  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('Javgiga status:', res.status, 'HTML length:', res.data.length);
    const $ = cheerio.load(res.data);
    const iframes = $('iframe').map((i, el) => $(el).attr('src')).get();
    console.log('Iframes found on page:', iframes);

    const vidhideIframe = iframes.find(src => src.includes('morencius.com') || src.includes('vidhide') || src.includes('play'));
    console.log('VidHide embed player iframe src:', vidhideIframe);

    if (vidhideIframe) {
      const iframeRes = await axios.get(vidhideIframe, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javgiga.net/' }
      });
      console.log('  [SUCCESS VIDHIDE EMBED FETCH] Status:', iframeRes.status, 'Length:', iframeRes.data.length);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJavgigaMovie();

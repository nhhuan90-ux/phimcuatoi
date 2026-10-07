const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavBikeStream() {
  console.log('=== TESTING SUBJAV.BIKE MOVIE & VIDEO STREAM ===');
  try {
    const res = await axios.get('https://subjav.bike/jav-vietsub/', { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const firstMovie = $('.item-video').first();
    const href = firstMovie.find('a').attr('href');
    console.log('Sample movie link:', href);

    if (href) {
      const pageRes = await axios.get(href, { timeout: 8000, headers: { 'User-Agent': UA } });
      console.log('Movie page status:', pageRes.status, 'Length:', pageRes.data.length);
      const $page = cheerio.load(pageRes.data);

      const videoSrc = $page('video source').attr('src') || $page('video').attr('src') || $page('iframe').attr('src');
      console.log('Video / Iframe SRC:', videoSrc);

      // Check player data attributes or scripts
      $page('script').each((i, el) => {
        const text = $page(el).html() || '';
        if (text.includes('file') || text.includes('video') || text.includes('player') || text.includes('hls') || text.includes('m3u8')) {
          console.log(`Script #${i+1}:`, text.slice(0, 300));
        }
      });
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSubjavBikeStream();

const axios = require('axios');
const cheerio = require('cheerio');

async function inspectSubjavBikePlayer() {
  const url = 'https://subjav.bike/bi-quyet-tre-dep-cua-co-chu-quan-dam-dang/36125/';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const $ = cheerio.load(res.data);
  console.log('All iframes:', $('iframe').map((i, el) => $(el).attr('src') || $(el).attr('data-src')).get());
  console.log('All player elements:', $('.player, #player, .video-player, .player-container, #iframe-player').map((i, el) => $(el).html()?.slice(0, 300)).get());
  
  // Check API endpoints or data attributes
  $('[data-id], [data-video], [data-url], [data-src]').each((i, el) => {
    console.log(`Elem #${i+1} tag=${el.name}:`, $(el).attr('data-id'), $(el).attr('data-url'), $(el).attr('data-src'));
  });

  // Check script tags containing player/coixx/tiktok
  $('script').each((i, el) => {
    const text = $(el).html() || '';
    if (text.includes('coixx') || text.includes('wp-json') || text.includes('player') || text.includes('file')) {
      console.log(`Player Script #${i+1}:`, text);
    }
  });
}

inspectSubjavBikePlayer();

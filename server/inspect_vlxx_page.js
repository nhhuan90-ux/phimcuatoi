const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function inspectVlxxPage() {
  const url = 'https://vlxx.net/video/phu-huynh-an-ui-co-giao-dang-buon-vi-chong-ngoai-tinh/3196/';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': UA } });
    console.log('VLXX Movie Page Status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    console.log('Iframes on page:', $('iframe').map((i, el) => $(el).attr('src')).get());
    console.log('Video tags on page:', $('video, source').map((i, el) => $(el).attr('src')).get());
    
    // Check buttons or player containers
    console.log('Player elements:', $('#player, .player, #video-player').map((i, el) => $(el).html()?.slice(0, 300)).get());

    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('ajax') || text.includes('server') || text.includes('player') || text.includes('load')) {
        console.log(`Script #${i+1}:`, text.slice(0, 300));
      }
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

inspectVlxxPage();

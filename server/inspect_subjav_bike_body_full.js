const axios = require('axios');
const cheerio = require('cheerio');

async function inspectSubjavBikeBodyFull() {
  const res = await axios.get('https://subjav.bike/bi-quyet-tre-dep-cua-co-chu-quan-dam-dang/36125/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const $ = cheerio.load(res.data);
  console.log('Title:', $('title').text());
  console.log('Thumb:', $('link[rel="preload"][as="image"]').attr('href'));
  
  // Find all buttons, links or player elements inside content
  console.log('Player containers:\n', $('#player-embed, #player-option, .player-option, .player, #player').map((i, el) => $(el).html()).get());
  
  // Find all inline scripts
  $('script').each((i, el) => {
    const text = $(el).html() || '';
    if (!$(el).attr('src') && text.length > 50) {
      console.log(`\nScript #${i+1}:\n`, text.slice(0, 500));
    }
  });
}

inspectSubjavBikeBodyFull();

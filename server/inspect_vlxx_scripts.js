const axios = require('axios');
const cheerio = require('cheerio');

async function inspectVlxxAllScripts() {
  const url = 'https://vlxx.net/video/phu-huynh-an-ui-co-giao-dang-buon-vi-chong-ngoai-tinh/3196/';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const $ = cheerio.load(res.data);
  $('script').each((i, el) => {
    const src = $(el).attr('src');
    const text = $(el).html() || '';
    console.log(`Script #${i+1}: src="${src}" content="${text.slice(0, 300)}"`);
  });
}

inspectVlxxAllScripts();

const axios = require('axios');
const cheerio = require('cheerio');

async function inspectUpload18Snippet() {
  const res = await axios.get('https://upload18.org/play/index/mgold-054', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  console.log('Upload18 HTML Snippet:\n', res.data.slice(0, 1500));
  const $ = cheerio.load(res.data);
  $('script').each((i, el) => {
    const text = $(el).html() || '';
    if (text.includes('player') || text.includes('source') || text.includes('hls') || text.includes('http') || text.includes('var')) {
      console.log(`Script #${i+1}:`, text.slice(0, 400));
    }
  });
}

inspectUpload18Snippet();

const axios = require('axios');
const cheerio = require('cheerio');

async function printMorenciusScripts() {
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';

  try {
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(res.data);
    $('script').each((i, el) => {
      const html = $(el).html() || '';
      if (html.includes('eval') || html.includes('player') || html.includes('m3u8') || html.includes('file')) {
        console.log(`Script #${i}:\n`, html.slice(0, 400));
      }
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

printMorenciusScripts();

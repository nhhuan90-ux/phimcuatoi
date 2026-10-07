const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavsubFullJs() {
  const embedUrl = 'https://e.streamforester.name/videos/690854634daac3b7ce088f72/play?event_id=player-wrapper';
  try {
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' }
    });
    const $ = cheerio.load(res.data);
    $('script').each((i, el) => {
      const html = $(el).html() || '';
      console.log(`\n--- SCRIPT #${i+1} (${html.length} bytes) ---`);
      console.log(html.slice(0, 1000));
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJavsubFullJs();

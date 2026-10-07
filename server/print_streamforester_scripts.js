const axios = require('axios');
const cheerio = require('cheerio');

async function printScript2Full() {
  const embedUrl = 'https://e.streamforester.name/videos/690854634daac3b7ce088f72/play?event_id=player-wrapper';
  const res = await axios.get(embedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javsub.blog/' }
  });
  const $ = cheerio.load(res.data);
  let fullScript = '';
  $('script').each((i, el) => {
    fullScript += `\n// --- SCRIPT ${i+1} ---\n` + ($(el).html() || '');
  });
  console.log(fullScript);
}

printScript2Full();

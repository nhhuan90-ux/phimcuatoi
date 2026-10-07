const axios = require('axios');
async function inspectJavtiful() {
  const url = 'https://upload18.org/play/index/DWD-151';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('Match 1:', res.data.match(/"m3u8"\s*:\s*"([^"]+)"/i) ? 'YES' : 'NO');
    console.log('Match 2:', res.data.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i) ? 'YES' : 'NO');
    
    // Dump scripts
    const cheerio = require('cheerio');
    const $ = cheerio.load(res.data);
    $('script').each((i, el) => {
      const script = $(el).html();
      if (script && script.includes('m3u8')) {
        console.log('Found m3u8 in script:', script.substring(0, 150));
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}
inspectJavtiful();

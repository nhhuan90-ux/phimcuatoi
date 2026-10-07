const axios = require('axios');
const cheerio = require('cheerio');

async function inspectSubjavBikePlayerDeep() {
  const url = 'https://subjav.bike/bi-quyet-tre-dep-cua-co-chu-quan-dam-dang/36125/';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = res.data;
  
  console.log('HTML Length:', html.length);
  const matches = html.match(/(https?:[^\s"'\\]+\.(?:m3u8|mp4))/gi) || [];
  console.log('Direct video file matches:', matches);

  const atobMatches = html.match(/atob\(["']([^"']+)["']\)/gi) || [];
  console.log('atob matches:', atobMatches);

  const base64Matches = html.match(/(aHR0c[A-Za-z0-9+/=]+)/g) || [];
  console.log('Base64 HTTP matches:', base64Matches.map(b => Buffer.from(b, 'base64').toString('utf-8')));

  const $ = cheerio.load(html);
  console.log('Buttons:', $('button, a.btn, .btn').map((i, el) => $(el).attr('data-source') || $(el).attr('data-url') || $(el).attr('href')).get());
}

inspectSubjavBikePlayerDeep();

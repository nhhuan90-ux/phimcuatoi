const axios = require('axios');
const cheerio = require('cheerio');

async function inspectSubjavBikeJsFiles() {
  const url = 'https://subjav.bike/bi-quyet-tre-dep-cua-co-chu-quan-dam-dang/36125/';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const $ = cheerio.load(res.data);
  
  const jsSrcs = [];
  $('script[src]').each((i, el) => {
    const src = $(el).attr('src');
    if (src) jsSrcs.push(src);
  });
  console.log('Found JS files count:', jsSrcs.length);

  for (const src of jsSrcs) {
    try {
      const jsRes = await axios.get(src, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const code = jsRes.data;
      if (code.includes('action') || code.includes('player') || code.includes('video') || code.includes('hls') || code.includes('m3u8')) {
        console.log(`\nJS File: ${src} (${code.length} bytes)`);
        const matches = code.match(/action\s*:\s*["']([^"']+)["']/g) || [];
        console.log('  Action matches:', matches);
        const playerMatches = code.match(/(https?:[^\s"']+\.(?:m3u8|mp4|ts))/g) || [];
        console.log('  Player URL matches:', playerMatches.slice(0, 5));
      }
    } catch (e) {}
  }
}

inspectSubjavBikeJsFiles();

const axios = require('axios');
const cheerio = require('cheerio');

async function inspectSubjavBikeConfig() {
  const url = 'https://subjav.bike/bi-quyet-tre-dep-cua-co-chu-quan-dam-dang/36125/';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const $ = cheerio.load(res.data);
  const cfgHtml = $('#single-video-config').parent().html();
  console.log('single-video-config container HTML:\n', cfgHtml);
}

inspectSubjavBikeConfig();

const axios = require('axios');
const cheerio = require('cheerio');

async function inspectSubjavSiteSnippet() {
  const res = await axios.get('https://subjav.site/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  console.log('subjav.site HTML length:', res.data.length);
  console.log('subjav.site HTML snippet:\n', res.data.slice(0, 1500));
  const $ = cheerio.load(res.data);
  console.log('Sample links:', $('a[href]').map((i, el) => $(el).attr('href')).get().slice(0, 15));
}

inspectSubjavSiteSnippet();

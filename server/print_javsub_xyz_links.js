const axios = require('axios');
const cheerio = require('cheerio');

async function printAllLinks() {
  const res = await axios.get('https://www.javsub.xyz/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const $ = cheerio.load(res.data);
  const links = new Set();
  $('a[href]').each((i, el) => {
    const h = $(el).attr('href');
    if (h && !h.includes('/category/') && !h.includes('/tag/') && !h.includes('#') && !h.includes('rss')) {
      links.add(h);
    }
  });
  console.log('Sample movie links on javsub.xyz:', Array.from(links).slice(0, 15));
}

printAllLinks();

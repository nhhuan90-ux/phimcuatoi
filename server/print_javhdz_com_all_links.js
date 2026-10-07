const axios = require('axios');
const cheerio = require('cheerio');

async function printJavhdzComAllLinks() {
  try {
    const res = await axios.get('https://javhdz.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const links = $('a').map((i, el) => ({ text: $(el).text().trim().slice(0, 30), href: $(el).attr('href') })).get();
    console.log('All links count:', links.length);
    console.log('Sample links:', links.slice(0, 20));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

printJavhdzComAllLinks();

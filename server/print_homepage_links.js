const axios = require('axios');
const cheerio = require('cheerio');

async function printHomepageLinks() {
  console.log('=== PRINTING HOMEPAGE LINKS ===\n');

  try {
    const res = await axios.get('https://javhdz.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    console.log('JAVHDz links sample:', $('a').map((i, el) => $(el).attr('href')).get().filter(h => h && h.includes('.html')).slice(0, 10));
  } catch (e) { console.error('JAVHDz err:', e.message); }

  try {
    const res2 = await axios.get('https://subjav1.blog/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $2 = cheerio.load(res2.data);
    console.log('SubJAV links sample:', $2('a').map((i, el) => $2(el).attr('href')).get().filter(h => h && h.includes('subjav1.blog/')).slice(0, 10));
  } catch (e) { console.error('SubJAV err:', e.message); }
}

printHomepageLinks();

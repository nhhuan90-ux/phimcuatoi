const axios = require('axios');
const cheerio = require('cheerio');

async function inspectJavhdzSite() {
  const url = 'https://javhdz.site/';
  console.log('=== INSPECTING JAVHDZ.SITE HOMEPAGE ===');

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const movieLinks = $('a').map((i, el) => $(el).attr('href')).get().filter(h => h && (h.includes('-4') || h.includes('.html')));
    console.log('Movie links on javhdz.site:', movieLinks.slice(0, 5));

    if (movieLinks.length > 0) {
      const sampleUrl = movieLinks[0].startsWith('http') ? movieLinks[0] : `https://javhdz.site${movieLinks[0]}`;
      const movieRes = await axios.get(sampleUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $m = cheerio.load(movieRes.data);
      console.log('  Iframes:', $m('iframe').map((i, el) => $m(el).attr('src')).get());
      console.log('  atob match:', movieRes.data.match(/window\.atob\(["']([^"']+)["']\)/)?.[1]);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

inspectJavhdzSite();

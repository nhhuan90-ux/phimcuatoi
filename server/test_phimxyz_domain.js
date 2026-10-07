const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function findPhimxyzSearch() {
  console.log('=== SEARCHING FOR PHIMXYZ DOMAIN ===');
  try {
    const url = 'https://search.yahoo.com/search?p=phimxyz';
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const links = new Set();
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.includes('r.search.yahoo.com')) {
        const match = href.match(/\/RU=([^/]+)\/RK=/);
        if (match) href = decodeURIComponent(match[1]);
      }
      if (href.includes('phimxyz')) {
        try {
          const host = new URL(href).hostname.toLowerCase();
          if (!host.includes('yahoo.com')) links.add(host);
        } catch (e) {}
      }
    });
    console.log('Phimxyz candidate hosts from search:', Array.from(links));

    for (const host of links) {
      try {
        const checkRes = await axios.get(`https://${host}/the-loai/jav`, { timeout: 4000, headers: { 'User-Agent': UA } });
        const $check = cheerio.load(checkRes.data);
        if (checkRes.status === 200 && $check('a[href*="/phim/"]').length > 0) {
          console.log(`[VERIFIED PHIMXYZ DOMAIN] -> https://${host}`);
          const img = $check('img').first().attr('src') || $check('img').first().attr('data-src');
          console.log(`  Sample thumbnail: ${img}`);
          return host;
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error('Search error:', e.message);
  }
}

findPhimxyzSearch();

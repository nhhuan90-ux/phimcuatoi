const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testJavhdzPageExtraction() {
  console.log('=== TESTING JAVHDZ PAGE EXTRACTION ===');
  const movie = moviesData.javhdz.find(m => m.id === '4003');

  const linksToTry = [
    movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, 'javhdz.site') : null,
    movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, 'javgiga.net') : null,
    movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, domains.javhdz) : null
  ].filter(Boolean);

  console.log('Links to try:', linksToTry);

  for (const link of linksToTry) {
    try {
      console.log(`\nFetching: ${link}`);
      const res = await axios.get(link, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      console.log('  Status:', res.status, 'Length:', res.data.length);
      const $ = cheerio.load(res.data);
      const iframeSrc = $('iframe[src*="morencius"], iframe[src*="play"], iframe').map((i, el) => $(el).attr('src')).get();
      console.log('  Iframes:', iframeSrc);
      const atobMatch = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (atobMatch) {
        console.log('  atob decoded:', Buffer.from(atobMatch[1], 'base64').toString('utf-8'));
      }
    } catch (e) {
      console.log(`  Fail on ${link}:`, e.message);
    }
  }
}

testJavhdzPageExtraction();

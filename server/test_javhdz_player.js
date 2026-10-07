const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavhdzPlay() {
  console.log('=== TESTING JAVHDZ PLAY RESOLVER ===');
  const movie = moviesData.javhdz[0];
  console.log('Sample movie:', movie);
  if (!movie) return;

  const url = movie.link.replace(/javhdz\.[a-z]+/gi, 'javhdz.red');
  console.log('Requesting URL:', url);

  try {
    const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA } });
    console.log('HTTP Status:', res.status);
    console.log('HTML Length:', res.data.length);

    // 1. Test window.atob match
    const atobMatch = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (atobMatch) {
      const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf-8');
      console.log('Decoded window.atob videoUrl:', decoded);
    } else {
      console.log('No window.atob match found in page HTML.');
    }

    // 2. Look for iframe / player / script tags in page
    const $ = cheerio.load(res.data);
    console.log('Iframes found:', $('iframe').map((i, el) => $(el).attr('src')).get());
    console.log('Scripts containing hls or m3u8 or atob:', $('script').map((i, el) => {
      const txt = $(el).html() || '';
      if (txt.includes('m3u8') || txt.includes('atob') || txt.includes('file') || txt.includes('source')) {
        return txt.slice(0, 200);
      }
      return null;
    }).get().filter(Boolean));

  } catch (e) {
    console.error('Error fetching javhdz page:', e.message);
  }
}

testJavhdzPlay();

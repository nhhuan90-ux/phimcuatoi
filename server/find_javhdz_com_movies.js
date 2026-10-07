const axios = require('axios');
const cheerio = require('cheerio');

async function findJavhdzComMovies() {
  console.log('=== FINDING JAVHDZ.COM MOVIES ===');
  try {
    const res = await axios.get('https://javhdz.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const links = $('a').map((i, el) => $(el).attr('href')).get().filter(h => h && h.endsWith('.html'));
    console.log('Sample movie links on javhdz.com:', [...new Set(links)].slice(0, 5));

    if (links.length > 0) {
      const sampleLink = links[0].startsWith('http') ? links[0] : `https://javhdz.com${links[0]}`;
      const movieRes = await axios.get(sampleLink, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log('  Movie page status:', movieRes.status, 'Length:', movieRes.data.length);
      const match = movieRes.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (match) {
        const videoUrl = Buffer.from(match[1], 'base64').toString('utf-8');
        console.log('  [SUCCESS JAVHDZ] Extracted HLS stream URL:', videoUrl);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

findJavhdzComMovies();

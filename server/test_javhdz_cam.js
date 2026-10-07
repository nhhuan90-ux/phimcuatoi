const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavhdzCamStream() {
  console.log('=== TESTING JAVHDZ.CAM STREAM ===');
  const url = 'https://javhdz.cam/category/uncensored-3/';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const movies = [];
    $('.movie-item.m-block').each((i, el) => {
      const title = $(el).find('.movie-title-1').text().trim();
      const href = $(el).attr('href');
      const match = href ? href.match(/-(\d+)\.html$/) : null;
      if (title && match) movies.push({ id: match[1], title, href });
    });
    console.log(`[SUCCESS] javhdz.cam parsed ${movies.length} movies! Sample:`, movies[0]);

    if (movies[0]) {
      const pageRes = await axios.get(`https://javhdz.cam${movies[0].href}`, { headers: { 'User-Agent': UA } });
      const atobMatch = pageRes.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (atobMatch) {
        console.log('  [SUCCESS] Decoded HLS Stream:', Buffer.from(atobMatch[1], 'base64').toString('utf-8'));
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJavhdzCamStream();

const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSex18Xxx() {
  console.log('=== TESTING SEX18.XXX (SUBJAV NEW DOMAIN) ===');
  try {
    const res = await axios.get('https://sex18.xxx/jav-vietsub/', { timeout: 8000, headers: { 'User-Agent': UA } });
    console.log('[SUCCESS] sex18.xxx Status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    const movies = [];
    $('.item-video').each((i, el) => {
      const title = $(el).find('.title-video').text().trim();
      const href = $(el).find('a').attr('href');
      const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
      if (title && href) movies.push({ title, href, img });
    });
    console.log(`[SUCCESS] sex18.xxx parsed ${movies.length} movies! Sample:`, movies[0]);

    // Test loading image from sex18.xxx
    if (movies[0]?.img) {
      const imgRes = await axios.get(movies[0].img, { timeout: 5000, headers: { 'User-Agent': UA, 'Referer': 'https://sex18.xxx/' } });
      console.log('  Image fetch status:', imgRes.status, 'Type:', imgRes.headers['content-type']);
    }

    // Test movie page on sex18.xxx
    if (movies[0]?.href) {
      const pageRes = await axios.get(movies[0].href, { timeout: 5000, headers: { 'User-Agent': UA } });
      const $page = cheerio.load(pageRes.data);
      const videoSrc = $page('video source').attr('src') || $page('iframe').attr('src');
      console.log('  Movie page video src:', videoSrc);
    }
  } catch (e) {
    console.error('sex18.xxx Error:', e.message);
  }
}

testSex18Xxx();

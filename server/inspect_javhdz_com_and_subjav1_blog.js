const axios = require('axios');
const cheerio = require('cheerio');

async function inspectJavhdzAndSubjav() {
  console.log('=== INSPECTING JAVHDZ.COM AND SUBJAV1.BLOG ===\n');

  // 1. JAVHDZ.COM homepage
  try {
    const res = await axios.get('https://javhdz.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const firstMovie = $('a[href*="-4"]').first().attr('href') || $('a[href*=".html"]').first().attr('href');
    console.log('JAVHDz sample movie link on javhdz.com:', firstMovie);

    if (firstMovie) {
      const movieUrl = firstMovie.startsWith('http') ? firstMovie : `https://javhdz.com${firstMovie}`;
      const movieRes = await axios.get(movieUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log('  Movie page status:', movieRes.status, 'Length:', movieRes.data.length);
      const atobMatch = movieRes.data.match(/window\.atob\(["']([^"']+)["']\)/);
      console.log('  atob match:', atobMatch ? Buffer.from(atobMatch[1], 'base64').toString('utf-8') : 'NONE');
      console.log('  Iframes:', cheerio.load(movieRes.data)('iframe').map((i, el) => $(el).attr('src')).get());
    }
  } catch (e) {
    console.error('JAVHDz com err:', e.message);
  }

  // 2. SUBJAV1.BLOG homepage
  console.log('\n--- 2. SUBJAV1.BLOG ---');
  try {
    const res = await axios.get('https://subjav1.blog/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const firstMovie = $('a[href*="/3"]').first().attr('href') || $('a[href*="/2"]').first().attr('href');
    console.log('SubJAV sample movie link on subjav1.blog:', firstMovie);

    if (firstMovie) {
      const movieUrl = firstMovie.startsWith('http') ? firstMovie : `https://subjav1.blog${firstMovie}`;
      const movieRes = await axios.get(movieUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log('  Movie page status:', movieRes.status, 'Length:', movieRes.data.length);
      console.log('  Video container:', cheerio.load(movieRes.data)('#video').html()?.slice(0, 100));
    }
  } catch (e) {
    console.error('SubJAV1 blog err:', e.message);
  }
}

inspectJavhdzAndSubjav();

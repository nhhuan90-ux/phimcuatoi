const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavsubBlocked() {
  console.log('=== TESTING JAVSUB EMBED URLS ===');
  const movie = moviesData.javsub?.[0];
  console.log('Sample JAVSub movie:', movie?.id, movie?.title);
  if (!movie) return;

  const pageUrl = `https://javsub.blog/phim-sex/${movie.id}`;
  try {
    const res = await axios.get(pageUrl, { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const buttons = $('button.set-player-source');
    console.log('Buttons count:', buttons.length);
    buttons.each((i, btn) => {
      console.log(`  Button #${i+1}: name="${$(btn).attr('data-cdn-name')}" src="${$(btn).attr('data-source')}"`);
    });

    if (movie.embedUrls) {
      console.log('\nmovie.embedUrls in db:');
      for (const em of movie.embedUrls) {
        console.log(`  Url: ${em.url}`);
        try {
          const embedRes = await axios.get(em.url, { timeout: 8000, headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' } });
          console.log(`    Status: ${embedRes.status}, Length: ${embedRes.data.length}`);
          console.log('    X-Frame-Options:', embedRes.headers['x-frame-options']);
          console.log('    Content-Security-Policy:', embedRes.headers['content-security-policy']);
        } catch (e) {
          console.log(`    Error: ${e.response?.status || e.message}`);
        }
      }
    }
  } catch (e) {
    console.error('Javsub fetch error:', e.message);
  }
}

async function testJavtiful404() {
  console.log('\n=== TESTING JAVTIFUL 404 ===');
  const movie = moviesData.javtiful?.[0];
  console.log('Sample JavTiful movie:', movie?.id, movie?.title, movie?.link);
  if (!movie) return;

  try {
    const res = await axios.get(movie.link, { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log('Javtiful movie link status:', res.status);
  } catch (e) {
    console.error('Javtiful movie link fetch error:', e.response?.status || e.message);
  }

  // Test live JavTiful homepage to see new links or domain shifts
  try {
    const hpRes = await axios.get('https://javtiful.blog/', { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log('Javtiful homepage status:', hpRes.status);
    const $ = cheerio.load(hpRes.data);
    const liveLinks = [];
    $('a[href*="/video/"]').each((i, el) => {
      liveLinks.push($(el).attr('href'));
    });
    console.log('Live JavTiful video links count:', liveLinks.length);
    console.log('First 5 live links:', liveLinks.slice(0, 5));
  } catch (e) {
    console.error('Javtiful homepage error:', e.response?.status || e.message);
  }
}

async function run() {
  await testJavsubBlocked();
  await testJavtiful404();
}

run();

const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavsubFix() {
  console.log('=== VERIFYING JAVSUB FIX ===');
  const movie = moviesData.javsub?.[0];
  console.log('Sample JAVSub movie:', movie?.id, movie?.title);
  if (movie && movie.embedUrls && movie.embedUrls[0]) {
    const url = movie.embedUrls[0].url;
    console.log('Embed URL:', url);
    try {
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' } });
      console.log(`[SUCCESS] JAVSub iframe status: ${res.status}, Length: ${res.data.length}`);
    } catch (e) {
      console.error('JAVSub iframe error:', e.message);
    }
  }
}

async function testJavtifulFix() {
  console.log('\n=== VERIFYING JAVTIFUL FIX ===');
  const movie = moviesData.javtiful?.[0];
  console.log('Sample JavTiful movie:', movie?.id, movie?.title);
  if (movie) {
    const embedUrl = `https://upload18.org/play/index/${movie.id}`;
    try {
      const res = await axios.get(embedUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.blog/' } });
      console.log(`[SUCCESS] JavTiful upload18 status: ${res.status}, Length: ${res.data.length}`);
      const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
      if (match) {
        const m3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
        console.log('  Extracted m3u8Url:', m3u8Url.slice(0, 80) + '...');
        const streamRes = await axios.get(m3u8Url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://upload18.org/' } });
        console.log(`  [SUCCESS] Stream m3u8 playlist status: ${streamRes.status}, Length: ${streamRes.data.length}`);
      }
    } catch (e) {
      console.error('JavTiful error:', e.message);
    }
  }
}

async function run() {
  await testJavsubFix();
  await testJavtifulFix();
}

run();

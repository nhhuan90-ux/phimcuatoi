const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function diagnoseSubjavAll() {
  console.log('=== DIAGNOSING SUBJAV THUMBNAILS AND VIDEOS ===');
  console.log('Active subjav domain in domains.json:', domains.subjav);

  const sampleMovies = moviesData.subjav.slice(0, 5);
  for (const m of sampleMovies) {
    console.log(`\nTesting SubJAV Movie ID: ${m.id} | Title: "${m.title}"`);
    console.log('  Image URL:', m.img);
    console.log('  Movie Link:', m.link);

    // 1. Test thumbnail URL
    if (m.img) {
      try {
        const imgRes = await axios.get(m.img, {
          timeout: 5000,
          headers: { 'User-Agent': UA, 'Referer': `https://${domains.subjav}/` }
        });
        console.log('  [SUCCESS] Thumbnail Status:', imgRes.status, 'Content-Type:', imgRes.headers['content-type']);
      } catch (eImg) {
        console.error('  [FAIL] Thumbnail Error:', eImg.message);
      }
    }

    // 2. Test movie page URL
    if (m.link) {
      try {
        const linkRes = await axios.get(m.link, {
          timeout: 5000,
          headers: { 'User-Agent': UA }
        });
        console.log('  [SUCCESS] Movie Page Status:', linkRes.status, 'Length:', linkRes.data.length);
        const $ = cheerio.load(linkRes.data);
        const videoSrc = $('video source').attr('src') || $('iframe').attr('src');
        console.log('  [SUCCESS] Extracted video/iframe src:', videoSrc);
      } catch (eLink) {
        console.error('  [FAIL] Movie Page Error:', eLink.message);
      }
    }
  }
}

diagnoseSubjavAll();

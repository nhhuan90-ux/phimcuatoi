const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testVlxxStyleExtraction() {
  console.log('=== TESTING VLXX-STYLE PLAYER FRAME EXTRACTION ===\n');

  // 1. JAVHDZ
  console.log('--- 1. JAVHDZ ---');
  try {
    const movie = moviesData.javhdz[0];
    const link = movie.link ? movie.link.replace(/javhdz\.[a-z]+/gi, 'javhdz.site') : `https://javhdz.site/chi-gai-${movie.id}.html`;
    const res = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe[src*="morencius"], iframe[src*="play"], iframe').first().attr('src');
    console.log('  JAVHDz extracted iframe src:', iframeSrc || 'NONE');
  } catch (e) {
    console.error('  JAVHDz err:', e.message);
  }

  // 2. JAVSUB
  console.log('\n--- 2. JAVSUB ---');
  try {
    const movie = moviesData.javsub[0];
    let playUrl = movie?.embedUrls?.[0]?.url;
    if (!playUrl) {
      const res = await axios.get(`https://javsub.blog/phim-sex/${movie.id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(res.data);
      playUrl = $('button.set-player-source').first().attr('data-source');
    }
    console.log('  JAVSub extracted iframe src:', playUrl || 'NONE');
  } catch (e) {
    console.error('  JAVSub err:', e.message);
  }

  // 3. JAVTIFUL
  console.log('\n--- 3. JAVTIFUL ---');
  try {
    const movie = moviesData.javtiful[0];
    const code = (movie?.code || movie?.id || '').toUpperCase();
    const embedUrl = `https://upload18.org/play/index/${code}`;
    console.log('  JavTiful extracted iframe src:', embedUrl);
  } catch (e) {
    console.error('  JavTiful err:', e.message);
  }

  // 4. SUBJAV
  console.log('\n--- 4. SUBJAV ---');
  try {
    const movie = moviesData.subjav[0];
    const link = `https://subjav1.blog/phim/${movie.id}`;
    const res = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const dataSrc = $('[data-src*="m3u8"], [data-src*="storage"]').first().attr('data-src') || $('iframe').first().attr('src');
    console.log('  SubJAV extracted player src:', dataSrc || 'NONE');
  } catch (e) {
    console.error('  SubJAV err:', e.message);
  }
}

testVlxxStyleExtraction();

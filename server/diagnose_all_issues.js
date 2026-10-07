const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testJavhdz() {
  console.log('\n=== 1. DIAGNOSING JAVHDz ===');
  const movie = moviesData.javhdz?.[0];
  console.log('Sample movie:', movie);
  if (!movie) return;
  const link = movie.link ? movie.link.replace(/javhdz\.[a-z]+/gi, domains.javhdz) : `https://${domains.javhdz}/chi-gai-${movie.id}.html`;
  console.log('Target link:', link);
  try {
    const res = await axios.get(link, { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log('HTML Status:', res.status, 'Length:', res.data.length);
    const match = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (match) {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
      console.log('Decoded HLS stream URL:', decoded);
      // Test fetching decoded stream URL
      try {
        const streamRes = await axios.get(decoded, { timeout: 8000, headers: { 'User-Agent': UA, 'Referer': `https://${domains.javhdz}/` } });
        console.log('Stream playlist status:', streamRes.status, 'Length:', streamRes.data.length);
      } catch (e) {
        console.error('Stream playlist error:', e.message);
      }
    } else {
      console.log('No window.atob match found on page!');
    }
  } catch (e) {
    console.error('JAVHDz page fetch error:', e.message);
  }
}

async function testVlxx() {
  console.log('\n=== 2. DIAGNOSING VLXX ===');
  const movie = moviesData.vlxx?.[0];
  console.log('Sample movie:', movie);
  if (!movie) return;
  const url = 'https://vlxx.moi/ajax.php';
  try {
    const res = await axios.post(url, `vlxx_server=1&id=${movie.id}&server=1`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://vlxx.moi/'
      },
      timeout: 10000
    });
    console.log('VLXX AJAX Status:', res.status, 'Response:', JSON.stringify(res.data).slice(0, 300));
  } catch (e) {
    console.error('VLXX AJAX error:', e.message);
  }
}

async function testJavsub() {
  console.log('\n=== 3. DIAGNOSING JAVSUB ===');
  const movie = moviesData.javsub?.[0];
  console.log('Sample movie:', movie);
  if (!movie) return;
  console.log('movie.embedUrls:', movie.embedUrls);
  if (movie.embedUrls && movie.embedUrls.length > 0) {
    for (const em of movie.embedUrls) {
      console.log('Testing embed URL:', em.url);
      try {
        const res = await axios.get(em.url, { timeout: 8000, headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' } });
        console.log('  Status:', res.status, 'Length:', res.data.length);
      } catch (e) {
        console.error('  Error:', e.message);
      }
    }
  }
}

async function testJavtiful() {
  console.log('\n=== 4. DIAGNOSING JAVTIFUL (404) ===');
  const movie = moviesData.javtiful?.[0];
  console.log('Sample movie:', movie);
  if (!movie) return;
  console.log('Testing movie.link:', movie.link);
  try {
    const res = await axios.get(movie.link, { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log('Status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    const iframe = $('iframe').first().attr('src');
    console.log('Extracted iframe:', iframe);
  } catch (e) {
    console.error('JavTiful fetch error:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status);
    }
  }
}

async function testPhimxyz() {
  console.log('\n=== 5. DIAGNOSING PHIMXYZ THUMBNAILS ===');
  const movies = (moviesData.phimxyz || []).slice(0, 5);
  movies.forEach(m => console.log(`ID: ${m.id} | Img: ${m.img}`));
  if (movies[0] && movies[0].img) {
    try {
      const res = await axios.get(movies[0].img, { timeout: 8000, headers: { 'User-Agent': UA } });
      console.log('Thumbnail fetch status:', res.status, 'Content-Type:', res.headers['content-type']);
    } catch (e) {
      console.error('Thumbnail fetch error:', e.message);
    }
  }
}

async function run() {
  await testJavhdz();
  await testVlxx();
  await testJavsub();
  await testJavtiful();
  await testPhimxyz();
}

run();

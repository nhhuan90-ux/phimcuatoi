const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavhdzFun() {
  console.log('=== TEST 1: JAVHDZ (javhdz.fun) ===');
  try {
    const url = 'https://javhdz.fun/category/uncensored-3/';
    const res = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const count = $('.movie-item.m-block').length;
    console.log(`javhdz.fun Status: ${res.status}, Movies count: ${count}`);

    const movieLink = 'https://javhdz.fun/chi-gai-de-thuong-nhap-cac-em-ho-3920.html';
    const movieRes = await axios.get(movieLink, { timeout: 8000, headers: { 'User-Agent': UA } });
    const match = movieRes.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (match) {
      console.log('Decoded HLS stream:', Buffer.from(match[1], 'base64').toString('utf-8'));
    }
  } catch (e) {
    console.error('javhdz.fun error:', e.message);
  }
}

async function testVlxxNet() {
  console.log('\n=== TEST 2: VLXX (vlxx.net) ===');
  try {
    const res = await axios.post('https://vlxx.net/ajax.php', 'vlxx_server=1&id=3167&server=1', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://vlxx.net/'
      },
      timeout: 8000
    });
    console.log('vlxx.net AJAX status:', res.status, 'Data:', res.data);
  } catch (e) {
    console.error('vlxx.net error:', e.message);
  }
}

async function testJavsubStreamforesterName() {
  console.log('\n=== TEST 3: JAVSUB STREAMFORESTER.NAME PROXY ===');
  const embedUrl = 'https://e.streamforester.name/videos/690504a51cad7a1a9d00e666/play?event_id=player-wrapper';
  try {
    const res = await axios.get(embedUrl, {
      timeout: 8000,
      headers: { 'User-Agent': UA, 'Referer': 'https://javsub.blog/' }
    });
    console.log('Streamforester fetch success. Status:', res.status);
    const $ = cheerio.load(res.data);
    const scriptText = $('script').text();
    const videoDataMatch = scriptText.match(/window\.videoData\s*=\s*(\{.+?\});/);
    if (videoDataMatch) {
      console.log('Extracted videoData:', videoDataMatch[1]);
    }
  } catch (e) {
    console.error('Streamforester error:', e.message);
  }
}

async function testPhimxyzDomains() {
  console.log('\n=== TEST 5: PHIMXYZ DOMAIN PROBING ===');
  const exts = ['site', 'in', 'app', 'cc', 'net', 'me', 'org', 'click', 'info', 'top', 'vip', 'one', 'club', 'co'];
  for (const ext of exts) {
    const domain = `phimxyz.${ext}`;
    const url = `https://${domain}/the-loai/jav`;
    try {
      const res = await axios.get(url, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('a[href*="/phim/"]').length > 0) {
        console.log(`  [ALIVE] Found active PhimXYZ domain: https://${domain}`);
        const img = $('img').first().attr('src') || $('img').first().attr('data-src');
        console.log(`  Sample image URL on ${domain}: ${img}`);
      }
    } catch (e) {}
  }
}

async function run() {
  await testJavhdzFun();
  await testVlxxNet();
  await testJavsubStreamforesterName();
  await testPhimxyzDomains();
}

run();

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function testJavhdzDomain() {
  console.log('=== TEST 1: JAVHDz DOMAIN DISCOVERY ===');
  const exts = ['red', 'pro', 'mobi', 'vip', 'site', 'me', 'im', 'live', 'cc', 'net', 'tv', 'club', 'is', 'xyz', 'org', 'click'];
  for (const ext of exts) {
    const domain = `javhdz.${ext}`;
    const url = `https://${domain}/category/uncensored-3/`;
    try {
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.movie-item.m-block').length > 0) {
        console.log(`  [ALIVE] JAVHDz active domain found: ${domain}`);
        return domain;
      }
    } catch (e) {}
  }
  console.log('  [FAIL] No active JAVHDz domain found in quick scan.');
}

async function testVlxxPlayer() {
  console.log('\n=== TEST 2: VLXX PLAYER HTML INSPECTION ===');
  const movieUrl = 'https://vlxx.moi/video/con-trai-giup-me-giam-can-bang-tinh-duc/3167/';
  try {
    const res = await axios.get(movieUrl, { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log('VLXX Movie Page Status:', res.status);
    const $ = cheerio.load(res.data);
    const iframes = [];
    $('iframe').each((i, el) => iframes.push($(el).attr('src')));
    console.log('Iframes on VLXX page:', iframes);

    const scripts = [];
    $('script').each((i, el) => {
      const html = $(el).html() || '';
      if (html.includes('ajax') || html.includes('player') || html.includes('m3u8') || html.includes('server')) {
        scripts.push(html.slice(0, 300));
      }
    });
    console.log('Relevant scripts on VLXX page:', scripts);
  } catch (e) {
    console.error('VLXX movie page fetch error:', e.message);
  }
}

async function testJavsubPlayer() {
  console.log('\n=== TEST 3: JAVSUB EMBED INSPECTION ===');
  const embedUrl = 'https://e.streamforester.name/videos/690504a51cad7a1a9d00e666/play?event_id=player-wrapper';
  try {
    const res = await axios.get(embedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': UA,
        'Referer': 'https://javsub.blog/'
      }
    });
    console.log('Streamforester Status:', res.status);
    const match = res.data.match(/window\.__SRC\s*=\s*([^;]+);/);
    if (match) {
      console.log('Streamforester window.__SRC match:', match[1]);
    } else {
      const m3u8Match = res.data.match(/(https?:[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
      console.log('Streamforester m3u8 match:', m3u8Match ? m3u8Match[1] : 'none');
    }
  } catch (e) {
    console.error('Streamforester error:', e.message);
  }
}

async function testJavtifulIframe() {
  console.log('\n=== TEST 4: JAVTIFUL IFRAME INSPECTION ===');
  const embedUrl = 'https://autolikerapp.net/videos/embed/mgold-054-stream-vi-94ea972b';
  try {
    const res = await axios.get(embedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': UA,
        'Referer': 'https://javtiful.blog/'
      }
    });
    console.log('Javtiful Embed Status:', res.status);
    console.log('Headers x-frame-options:', res.headers['x-frame-options']);
    const match = res.data.match(/(https?:[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    console.log('Javtiful m3u8 match in embed:', match ? match[1] : 'none');
  } catch (e) {
    console.error('Javtiful embed fetch error:', e.message);
  }
}

async function testPhimxyzThumbnails() {
  console.log('\n=== TEST 5: PHIMXYZ THUMBNAILS INSPECTION ===');
  const domainsToTest = ['i1.phimxyz.blog', 'i.phimxyz.blog', 'phimxyz.blog', 'i1.phimxyz.city', 'phimxyz.city'];
  const testPath = '/storage/images/thang-chau-hu-hong-hup-luon-ca-di-khi-o-ke-de-di-thi/thang-chau-hu-hong-hup-luon-ca-di-khi-o-ke-de-di-thi-410x300.jpg';
  for (const d of domainsToTest) {
    const imgUrl = `https://${d}${testPath}`;
    try {
      const res = await axios.get(imgUrl, { timeout: 4000, headers: { 'User-Agent': UA } });
      console.log(`  [ALIVE] ${d} -> Status: ${res.status}, Type: ${res.headers['content-type']}`);
    } catch (e) {
      console.log(`  [DEAD] ${d} -> Error: ${e.message}`);
    }
  }
}

async function run() {
  await testJavhdzDomain();
  await testVlxxPlayer();
  await testJavsubPlayer();
  await testJavtifulIframe();
  await testPhimxyzThumbnails();
}

run();

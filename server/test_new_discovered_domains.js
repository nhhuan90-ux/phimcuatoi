const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const testDomains = {
  javhdz: 'javhdz.mobi',
  javsub: 'javsub.xyz',
  javtiful: 'javtiful.fit',
  vlxx: 'vlxx.net',
  phimxyz: 'i1.phimxyz.blog'
};

async function testJavhdzMobi() {
  console.log('=== 1. TESTING JAVHDZ.MOBI ===');
  try {
    const res = await axios.get('https://javhdz.mobi/category/uncensored-3/', { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const movies = [];
    $('.movie-item.m-block').each((i, el) => {
      const title = $(el).find('.movie-title-1').text().trim();
      const href = $(el).attr('href');
      const match = href ? href.match(/-(\d+)\.html$/) : null;
      if (title && match) movies.push({ id: match[1], title, href });
    });
    console.log(`[SUCCESS] javhdz.mobi parsed ${movies.length} movies! Sample:`, movies[0]);

    if (movies[0]) {
      const pageRes = await axios.get(`https://javhdz.mobi${movies[0].href}`, { timeout: 8000, headers: { 'User-Agent': UA } });
      const atobMatch = pageRes.data.match(/window\.atob\(["']([^"']+)["']\)/);
      if (atobMatch) {
        console.log('  Decoded HLS Stream:', Buffer.from(atobMatch[1], 'base64').toString('utf-8'));
      }
    }
  } catch (e) {
    console.error('javhdz.mobi error:', e.message);
  }
}

async function testJavsubXyz() {
  console.log('\n=== 2. TESTING JAVSUB.XYZ ===');
  try {
    const res = await axios.get('https://javsub.xyz/', { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const movies = [];
    $('.item').each((i, el) => {
      const title = $(el).find('.item__title h4').text().trim();
      const href = $(el).find('.item__thumbnail').attr('href');
      const match = href ? href.match(/phim-sex\/([^/]+)$/) : null;
      if (title && match) movies.push({ id: match[1], title, href });
    });
    console.log(`[SUCCESS] javsub.xyz parsed ${movies.length} movies! Sample:`, movies[0]);

    if (movies[0]) {
      const pageRes = await axios.get(movies[0].href, { timeout: 8000, headers: { 'User-Agent': UA } });
      const $page = cheerio.load(pageRes.data);
      const btnSrc = $page('button.set-player-source').first().attr('data-source');
      console.log('  Player source button data-source:', btnSrc);
    }
  } catch (e) {
    console.error('javsub.xyz error:', e.message);
  }
}

async function testJavtifulFit() {
  console.log('\n=== 3. TESTING JAVTIFUL.FIT ===');
  try {
    const res = await axios.get('https://javtiful.fit/', { timeout: 8000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const movies = [];
    $('a[href*="/video/"]').each((i, el) => {
      const href = $(el).attr('href'); if (!href) return;
      const match = href.match(/\/video\/([^/]+)/);
      if (match) movies.push({ id: match[1], href });
    });
    console.log(`[SUCCESS] javtiful.fit parsed ${movies.length} movies! Sample:`, movies[0]);

    if (movies[0]) {
      const upperId = movies[0].id.toUpperCase();
      const u18Url = `https://upload18.org/play/index/${upperId}`;
      const u18Res = await axios.get(u18Url, { timeout: 8000, headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.fit/' } });
      const m3u8Match = u18Res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
      if (m3u8Match) {
        console.log('  Upload18 HLS stream decoded:', m3u8Match[1].replace(/\\/g, '').replace(/u0026/g, '&').slice(0, 80) + '...');
      }
    }
  } catch (e) {
    console.error('javtiful.fit error:', e.message);
  }
}

async function run() {
  await testJavhdzMobi();
  await testJavsubXyz();
  await testJavtifulFit();
}

run();

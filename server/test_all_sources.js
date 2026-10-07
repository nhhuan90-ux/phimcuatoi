const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function testJavhdz() {
  console.log('--- Testing JAVHDz (https://javhdz.red/) ---');
  try {
    const res = await axios.get('https://javhdz.red/category/uncensored-3/', { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    let count = 0;
    $('.movie-item.m-block').each((i, el) => {
      const title = $(el).find('.movie-title-1').text().trim();
      const href = $(el).attr('href');
      if (title && href) count++;
    });
    console.log(`JAVHDz found ${count} movies on page 1.`);
  } catch (e) {
    console.error(`JAVHDz error: ${e.message}`);
  }
}

async function testSubjav() {
  console.log('--- Testing SubJAV (https://subjav.city/) ---');
  try {
    const res = await axios.get('https://subjav.city/wp-json/tiktok/v1/videos/grid?page=1&limit=24', { timeout: 10000, headers: { 'User-Agent': UA } });
    console.log(`SubJAV TikTok API status: ${res.status}, videos count: ${res.data?.videos?.length || 0}`);
  } catch (e) {
    console.error(`SubJAV TikTok API error: ${e.message}`);
  }

  try {
    const res = await axios.get('https://subjav.city/jav-vietsub/', { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    let count = 0;
    $('.item-video').each((i, el) => count++);
    console.log(`SubJAV Vietsub HTML found ${count} videos.`);
  } catch (e) {
    console.error(`SubJAV Vietsub HTML error: ${e.message}`);
  }
}

async function testJavsub() {
  console.log('--- Testing JAVSub (https://javsub.blog/) ---');
  try {
    const res = await axios.get('https://javsub.blog/', { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    let count = 0;
    $('.item').each((i, el) => {
      const t = $(el).find('.item__title h4').text().trim();
      const h = $(el).find('.item__thumbnail').attr('href');
      if (t || h) count++;
    });
    console.log(`JAVSub found ${count} movies on homepage feed. HTML length: ${res.data.length}`);
    if (count === 0) {
      console.log('JAVSub Sample HTML snippet:', res.data.slice(0, 800));
    }
  } catch (e) {
    console.error(`JAVSub error: ${e.message}`);
  }
}

async function testJavtiful() {
  console.log('--- Testing JavTiful (https://javtiful.blog/) ---');
  try {
    const res = await axios.get('https://javtiful.blog/', { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    let count = 0;
    $('a[href*="/video/"]').each((i, el) => count++);
    console.log(`JavTiful found ${count} video links on homepage feed. HTML length: ${res.data.length}`);
    if (count === 0) {
      console.log('JavTiful Sample HTML snippet:', res.data.slice(0, 800));
    }
  } catch (e) {
    console.error(`JavTiful error: ${e.message}`);
  }
}

async function testPhimxyz() {
  console.log('--- Testing PhimXYZ (https://i1.phimxyz.blog/) ---');
  try {
    const res = await axios.get('https://i1.phimxyz.blog/the-loai/jav', { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    let count = 0;
    $('a[href*="/phim/"]').each((i, el) => {
      const href = $(el).attr('href');
      const alt = $(el).find('img').attr('alt') || '';
      if (href && alt) count++;
    });
    console.log(`PhimXYZ found ${count} movies on /the-loai/jav. HTML length: ${res.data.length}`);
    if (count === 0) {
      console.log('PhimXYZ Sample HTML snippet:', res.data.slice(0, 800));
    }
  } catch (e) {
    console.error(`PhimXYZ error: ${e.message}`);
  }
}

async function run() {
  await testJavhdz();
  await testSubjav();
  await testJavsub();
  await testJavtiful();
  await testPhimxyz();
}

run();

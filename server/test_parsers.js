const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testJavsubParser() {
  console.log('=== JAVSub Parser Test ===');
  const res = await axios.get('https://javsub.blog/', { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const items = [];
  $('.item').each((i, el) => {
    const t = $(el).find('.item__title h4').text().trim();
    const h = $(el).find('.item__thumbnail').attr('href');
    const m = h ? h.match(/phim-sex\/([^/]+)$/) : null;
    if (t && h && m) items.push({ id: m[1], title: t, link: h });
  });
  console.log(`JAVSub items parsed: ${items.length}`);
  if (items.length > 0) {
    const seen = new Set((moviesData.javsub || []).map(m => m.id));
    const newItems = items.filter(it => !seen.has(it.id));
    console.log(`JAVSub existing total in db: ${moviesData.javsub?.length}. New items found: ${newItems.length}`);
    if (newItems.length > 0) console.log('Sample new item:', newItems[0]);
    else console.log('Latest parsed ID:', items[0].id, 'in db?', seen.has(items[0].id));
  }
}

async function testJavtifulParser() {
  console.log('\n=== JavTiful Parser Test ===');
  const res = await axios.get('https://javtiful.blog/', { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const items = [];
  $('a[href*="/video/"]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const m = href.match(/\/video\/([^/]+)/);
    if (!m) return;
    const id = m[1];
    const title = $(el).find('img').attr('alt') || $(el).text().trim() || id;
    items.push({ id, title, link: href });
  });
  console.log(`JavTiful items parsed: ${items.length}`);
  if (items.length > 0) {
    const seen = new Set((moviesData.javtiful || []).map(m => m.id));
    const newItems = items.filter(it => !seen.has(it.id));
    console.log(`JavTiful existing total in db: ${moviesData.javtiful?.length}. New items found: ${newItems.length}`);
    if (newItems.length > 0) console.log('Sample new item:', newItems[0]);
    else console.log('Latest parsed ID:', items[0].id, 'in db?', seen.has(items[0].id));
  }
}

async function testPhimxyzParser() {
  console.log('\n=== PhimXYZ Parser Test ===');
  const res = await axios.get('https://i1.phimxyz.blog/the-loai/jav', { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const items = [];
  $('a[href*="/phim/"]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href || !href.match(/\/phim\/(.+)$/)) return;
    const id = href.match(/\/phim\/(.+)$/)[1];
    const alt = $(el).find('img').attr('alt') || ';';
    if (!alt || alt === 'Nhật Bản' || alt === 'Trung Quốc' || alt === 'Châu Âu' || alt === 'Phim Sex HD' || alt === ';') return;
    items.push({ id, title: alt, link: href });
  });
  console.log(`PhimXYZ items parsed: ${items.length}`);
  if (items.length > 0) {
    const seen = new Set((moviesData.phimxyz || []).map(m => m.id));
    const newItems = items.filter(it => !seen.has(it.id));
    console.log(`PhimXYZ existing total in db: ${moviesData.phimxyz?.length}. New items found: ${newItems.length}`);
    if (newItems.length > 0) console.log('Sample new item:', newItems[0]);
    else console.log('Latest parsed ID:', items[0].id, 'in db?', seen.has(items[0].id));
  }
}

async function run() {
  await testJavsubParser();
  await testJavtifulParser();
  await testPhimxyzParser();
}

run();

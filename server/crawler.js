const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const DATA_FILE = './movies.json';
const RESULTS = { javhdz: [], vlxx: [], javsub: [], missav: [], javtiful: [], supjav: [] };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ============ JAVHDZ CRAWLER ============
async function crawlJavhdzListings() {
  console.log('[JAVHDz] Crawling listings...');
  const categories = [
    { url: '/category/uncensored-3/', pages: 60 },
    { url: '/category/censored-2/', pages: 136 },
    { url: '/category/beauty-4/', pages: 20 },
  ];
  for (const cat of categories) {
    for (let p = 1; p <= cat.pages; p++) {
      try {
        const url = p === 1 ? cat.url : `${cat.url}page/${p}/`;
        const res = await axios.get(`https://javhdz.site${url}`, { timeout: 15000, headers: { 'User-Agent': UA } });
        const $ = cheerio.load(res.data);
        let count = 0;
        $('.movie-item.m-block').each((i, el) => {
          const title = $(el).find('.movie-title-1').text().trim();
          const href = $(el).attr('href');
          const img = $(el).find('.public-film-item-thumb').attr('src');
          const views = $(el).find('.ribbon-viewed').text().trim();
          const tag = $(el).find('.ribbon-sub').text().trim();
          if (title && href) {
            const match = href.match(/-(\d+)\.html$/);
            const id = match ? match[1] : '';
            RESULTS.javhdz.push({ id, title, img: img ? `https://javhdz.site${img}` : '', link: `https://javhdz.site${href}`, tag, views, source: 'javhdz' });
            count++;
          }
        });
        console.log(`  Page ${p}/${cat.pages} - found ${count} movies`);
        if (count === 0) break;
      } catch (e) { console.log(`  Page ${p} error: ${e.message}`); }
      await sleep(500);
    }
  }
  console.log(`[JAVHDz] Total: ${RESULTS.javhdz.length} movies`);
}

// ============ VLXX CRAWLER ============
async function crawlVlxxListings() {
  console.log('[VLXX] Crawling listings...');
  for (let p = 1; p <= 106; p++) {
    try {
      const url = p === 1 ? 'https://vlxx.moi/' : `https://vlxx.moi/new/${p}/`;
      const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      let count = 0;
      $('.video-item').each((i, el) => {
        const title = $(el).find('.video-name a').text().trim();
        const href = $(el).find('.video-name a').attr('href');
        const img = $(el).find('.video-image').attr('data-original');
        const tag = $(el).find('.ribbon').text().trim();
        const match = href ? href.match(/\/video\/[^/]+\/(\d+)\//) : null;
        const id = match ? match[1] : '';
        if (title && href) {
          RESULTS.vlxx.push({ id, title, img: img || '', link: `https://vlxx.moi${href}`, tag, views: '', source: 'vlxx' });
          count++;
        }
      });
      console.log(`  Page ${p}/106 - found ${count} movies`);
      if (count === 0) break;
    } catch (e) { console.log(`  Page ${p} error: ${e.message}`); }
    await sleep(300);
  }
  console.log(`[VLXX] Total: ${RESULTS.vlxx.length} movies`);
}

// ============ JAVSUB.BLOG CRAWLER ============
async function crawlJavsubListings() {
  console.log('[JAVSUB] Crawling listings...');
  for (let p = 1; p <= 285; p++) {
    try {
      const url = p === 1 ? 'https://javsub.blog/' : `https://javsub.blog/?page=${p}`;
      const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      let count = 0;
      $('.item').each((i, el) => {
        const title = $(el).find('.item__title h4').text().trim();
        const href = $(el).find('.item__thumbnail').attr('href');
        const img = $(el).find('.item__thumbnail img').attr('src');
        const labels = $(el).find('.item__labels span').map((j, sp) => $(sp).text().trim()).get();
        const match = href ? href.match(/phim-sex\/([^/]+)$/) : null;
        const id = match ? match[1] : '';
        if (title && href) {
          RESULTS.javsub.push({ id, title, img: img || '', link: href, tag: labels.join(', ') || 'Sub', views: '', source: 'javsub' });
          count++;
        }
      });
      console.log(`  Page ${p}/285 - found ${count} movies`);
      if (count === 0) break;
    } catch (e) { console.log(`  Page ${p} error: ${e.message}`); }
    await sleep(300);
  }
  console.log(`[JAVSUB] Total: ${RESULTS.javsub.length} movies`);
}

// ============ MISSAV CRAWLER (via missav.ai mirror) ============
async function crawlMissavListings() {
  console.log('[MISSAV] Crawling listings...');
  for (let p = 1; p <= 100; p++) {
    try {
      const url = `https://missav.ai/en?page=${p}`;
      const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      let count = 0;
      $('.aspect-w-16.aspect-h-9.rounded a[href]').each((i, el) => {
        const href = $(el).attr('href');
        const img = $(el).find('img').attr('data-src');
        const title = $(el).find('img').attr('alt');
        const parts = href ? href.split('/') : [];
        const code = parts[parts.length - 1] || '';
        if (title && href) {
          RESULTS.missav.push({ id: code, title, img: img || '', link: `https://missav.ai${href}`, tag: '', views: '', source: 'missav' });
          count++;
        }
      });
      console.log(`  Page ${p}/100 - found ${count} movies`);
      if (count === 0) break;
    } catch (e) { console.log(`  Page ${p} error: ${e.message}`); }
    await sleep(500);
  }
  console.log(`[MISSAV] Total: ${RESULTS.missav.length} movies`);
}

// ============ JAVTIFUL CRAWLER ============
async function crawlJavtifulListings() {
  console.log('[JAVTIFUL] Crawling listings...');
  for (let p = 1; p <= 100; p++) {
    try {
      const url = `https://javtiful.com/videos/?page=${p}`;
      const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      let count = 0;
      const cards = $('.col.pb-3');
      cards.each((i, el) => {
        const link = $(el).find('a.video-link').attr('href');
        const title = $(el).find('a.video-link').text().trim();
        const img = $(el).find('img.card-img-top').attr('data-src') || $(el).find('img.card-img-top').attr('src');
        const code = $(el).find('.label-code').text().trim();
        const duration = $(el).find('.label-duration').text().trim();
        const hd = $(el).find('.label-hd').text().trim();
        const match = link ? link.match(/\/video\/(\d+)/) : null;
        const id = match ? match[1] : '';
        if (title && link) {
          RESULTS.javtiful.push({ id, title, img: img || '', link: `https://javtiful.com${link}`, tag: hd || (code ? 'HD' : ''), views: '', source: 'javtiful', code });
          count++;
        }
      });
      console.log(`  Page ${p}/100 - found ${count} movies`);
      if (count === 0) break;
    } catch (e) { console.log(`  Page ${p} error: ${e.message}`); }
    await sleep(500);
  }
  console.log(`[JAVTIFUL] Total: ${RESULTS.javtiful.length} movies`);
}

// ============ SUPJAV CRAWLER ============
async function crawlSupjavListings() {
  console.log('[SUPJAV] Crawling listings...');
  for (let p = 1; p <= 100; p++) {
    try {
      const url = p === 1 ? 'https://supjav.com/' : `https://supjav.com/page/${p}/`;
      const res = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      let count = 0;
      $('div.post').each((i, el) => {
        const title = $(el).find('h3 a').text().trim();
        const href = $(el).find('h3 a').attr('href') || $(el).find('a.img').attr('href');
        const img = $(el).find('img.thumb').attr('data-original') || $(el).find('img.thumb').attr('src');
        const views = $(el).find('span.date').text().trim();
        const match = href ? href.match(/supjav\.com\/(\d+)\.html/) : null;
        const id = match ? match[1] : '';
        if (title && href) {
          RESULTS.supjav.push({ id, title, img: img || '', link: href, tag: '', views, source: 'supjav' });
          count++;
        }
      });
      console.log(`  Page ${p}/100 - found ${count} movies`);
      if (count === 0) break;
    } catch (e) { console.log(`  Page ${p} error: ${e.message}`); }
    await sleep(500);
  }
  console.log(`[SUPJAV] Total: ${RESULTS.supjav.length} movies`);
}

// ============ SAVE ============
function saveData() {
  const dedup = (arr) => {
    const seen = new Set();
    return arr.filter(m => { const k = m.id + m.source; if (seen.has(k)) return false; seen.add(k); return true; });
  };
  const all = [];
  for (const key of Object.keys(RESULTS)) {
    RESULTS[key] = dedup(RESULTS[key]);
    all.push(...RESULTS[key]);
  }
  RESULTS.all = all.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0)).reverse();
  const data = { ...RESULTS, updated: new Date().toISOString() };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`Saved: ${data.all.length} total movies`);
  for (const key of Object.keys(RESULTS)) {
    if (key === 'all') continue;
    console.log(`  ${key}: ${RESULTS[key].length}`);
  }
}

// ============ MAIN ============
async function main() {
  console.log('=== PHIM CRAWLER (6 SOURCES) ===');
  await crawlJavhdzListings();
  await crawlVlxxListings();
  await crawlJavsubListings();
  await crawlMissavListings();
  await crawlJavtifulListings();
  await crawlSupjavListings();
  saveData();
  console.log('=== DONE ===');
}

main().catch(console.error);

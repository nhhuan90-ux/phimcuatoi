const { chromium } = require('playwright');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const DATA_FILE = './movies.json';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function main() {
  console.log('=== SUPJAV CRAWL 10 TRANG (Playwright) ===\n');
  let data = { javhdz: [], vlxx: [], javsub: [], missav: [], javtiful: [], supjav: [], all: [] };
  try { if (fs.existsSync(DATA_FILE)) data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e) {}
  for (const k of ['javhdz','vlxx','javsub','missav','javtiful','supjav']) if (!data[k]) data[k] = [];
  
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();

  let supSeen = new Set(data.supjav.map(m => m.id));
  let added = 0;
  for (let p = 1; p <= 10; p++) {
    try {
      const url = p === 1 ? 'https://supjav.com/' : `https://supjav.com/page/${p}/`;
      await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 3000));
      const $ = cheerio.load(await page.content());
      let count = 0;
      $('div.post').each((i, el) => {
        const title = $(el).find('h3 a').text().trim(); if (!title) return;
        const href = $(el).find('h3 a').attr('href') || $(el).find('a.img').attr('href'); if (!href) return;
        const match = href.match(/(\d+)\.html$/); if (!match) return;
        const id = match[1]; if (supSeen.has(id)) return;
        const img = $(el).find('img.thumb').attr('data-original') || $(el).find('img.thumb').attr('src') || '';
        data.supjav.push({ id, title, img, link: href, tag: '', views: $(el).find('span.date').text().trim(), source: 'supjav' });
        supSeen.add(id); count++; added++;
      });
      console.log(`  Trang ${p}: +${count} phim`);
    } catch(e) { console.log(`  Trang ${p} err: ${e.message.substring(0,60)}`); }
  }

  await browser.close();

  data.all = [];
  for (const k of ['javhdz','vlxx','javsub','missav','javtiful','supjav'])
    if (data[k]) data.all.push(...data[k]);
  data.updated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\n=== TONG: ${data.all.length} phim ===`);
  console.log(`  supjav: ${data.supjav.length} (+${added} moi)`);
}

main().catch(console.error);

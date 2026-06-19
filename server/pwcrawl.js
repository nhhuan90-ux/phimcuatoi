const { chromium } = require('playwright');
const fs = require('fs');
const cheerio = require('cheerio');

const DATA_FILE = './movies.json';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function crawlSource(browser, name, pagesConfig) {
  console.log(`[${name}] Crawling...`);
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();
  const items = [];
  const maxPages = pagesConfig.maxPages || 5;

  for (let p = 1; p <= maxPages; p++) {
    try {
      const url = typeof pagesConfig.url === 'function' ? pagesConfig.url(p) : pagesConfig.url;
      await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await sleep(3000);
      const html = await page.content();
      const $ = cheerio.load(html);
      const links = pagesConfig.parser($, p);
      let added = 0;
      for (const link of links) {
        if (!items.some(m => m.id === link.id)) {
          items.push(link);
          added++;
        }
      }
      console.log(`  Page ${p}/${maxPages} - found ${added} movies (total ${items.length})`);
      if (added === 0) {
        console.log('  ' + $('title').text().substring(0, 60));
      }
    } catch (e) { console.log(`  Page ${p} error: ${e.message.substring(0, 80)}`); }
  }
  console.log(`[${name}] Total: ${items.length} movies`);
  await page.close();
  await ctx.close();
  return items;
}

async function main() {
  console.log('=== CRAWLING 3 SITES WITH PLAYWRIGHT ===');
  const browser = await chromium.launch({ headless: true });

  // MissAV
  const missavItems = await crawlSource(browser, 'MISSAV', {
    maxPages: 50,
    url: p => `https://missav.ai/en?page=${p}`,
    parser: ($, p) => {
      const items = [];
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        // Match: /en/CODE or /dm{N}/en/CODE where CODE is alphanumeric with hyphens
        const match = href.match(/^\/(?:dm\d+\/)?en\/([a-z0-9][a-z0-9-]+)$/);
        if (!match) return;
        const code = match[1];
        // Skip non-movie pages
        if (['new', 'release', 'vip', 'actresses', 'genres', 'makers', 'contact', 'terms', 'ads', 'upload', 'saved', 'history', 'playlists', 'klive', 'clive', 'fc2', 'uncensored-leak', 'english-subtitle'].includes(code)) return;
        if (code.includes('/')) return;
        const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
        const title = $(el).find('img').attr('alt') || code;
        if (img || code) items.push({ id: code, title, img, link: `https://missav.ai${href}`, tag: '', views: '', source: 'missav' });
      });
      return items;
    }
  });

  // JavTiful - try with different URL
  const javtifulItems = await crawlSource(browser, 'JAVTIFUL', {
    maxPages: 50,
    url: p => p === 1 ? 'https://javtiful.com/main' : `https://javtiful.com/videos?page=${p}`,
    parser: ($, p) => {
      const items = [];
      $('a.video-link, a.video-tmb').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const match = href.match(/\/video\/(\d+)/);
        if (!match) return;
        const id = match[1];
        if (!id) return;
        const title = $(el).find('a.video-link').text().trim() || $(el).attr('title') || '';
        const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
        items.push({ id, title, img, link: `https://javtiful.com${href}`, tag: '', views: '', source: 'javtiful' });
      });
      return items;
    }
  });

  // SupJav
  const supjavItems = await crawlSource(browser, 'SUPJAV', {
    maxPages: 50,
    url: p => p === 1 ? 'https://supjav.com/' : `https://supjav.com/page/${p}/`,
    parser: ($, p) => {
      const items = [];
      $('div.post').each((i, el) => {
        const title = $(el).find('h3 a').text().trim();
        const href = $(el).find('h3 a').attr('href') || $(el).find('a.img').attr('href');
        if (!href) return;
        const match = href.match(/(\d+)\.html$/);
        if (!match) return;
        const id = match[1];
        if (!id || !title) return;
        const img = $(el).find('img.thumb').attr('data-original') || $(el).find('img.thumb').attr('src') || '';
        items.push({ id, title, img, link: href, tag: '', views: $(el).find('span.date').text().trim(), source: 'supjav' });
      });
      return items;
    }
  });

  await browser.close();

  // Merge all results
  let data = { javhdz: [], vlxx: [], javsub: [], missav: [], javtiful: [], supjav: [], all: [] };
  try { if (fs.existsSync(DATA_FILE)) data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e) {}

  data.missav = [...(data.missav || []), ...missavItems.filter(m => !(data.missav || []).some(e => e.id === m.id))];
  data.javtiful = [...(data.javtiful || []), ...javtifulItems.filter(m => !(data.javtiful || []).some(e => e.id === m.id))];
  data.supjav = [...(data.supjav || []), ...supjavItems.filter(m => !(data.supjav || []).some(e => e.id === m.id))];

  data.all = [];
  for (const key of ['javhdz','vlxx','javsub','missav','javtiful','supjav']) {
    if (data[key]) data.all.push(...data[key]);
  }
  data.all.sort((a, b) => {
    const na = parseInt(a.id) || 0;
    const nb = parseInt(b.id) || 0;
    if (na !== nb) return nb - na;
    return (b.title || '').localeCompare(a.title || '');
  });
  data.updated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  console.log(`\nSaved: ${data.all.length} total movies`);
  for (const key of ['javhdz','vlxx','javsub','missav','javtiful','supjav']) {
    console.log(`  ${key}: ${(data[key] || []).length}`);
  }
}

main().catch(console.error);

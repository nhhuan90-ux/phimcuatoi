const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const DATA_FILE = './movies.json';
const UA = 'Mozilla/5.0';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== CRAWL FULL: JAVSub + JavTiful + PhimXYZ ===\n');
  let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // ===== JAVSub.blog (285 pages) =====
  console.log('[JAVSub] Crawling all pages...');
  let seen = new Set(data.javsub.map(m => m.id));
  let added = 0;
  for (let p = 1; p <= 285; p++) {
    try {
      const url = p === 1 ? 'https://javsub.blog/' : `https://javsub.blog/?page=${p}`;
      const r = await axios.get(url, {timeout:15000, headers:{'User-Agent':UA}});
      const $ = cheerio.load(r.data);
      let count = 0;
      $('.item').each((i, el) => {
        const title = $(el).find('.item__title h4').text().trim();
        const href = $(el).find('.item__thumbnail').attr('href');
        const img = $(el).find('.item__thumbnail img').attr('src');
        const labels = $(el).find('.item__labels span').map((j, sp) => $(sp).text().trim()).get();
        const m = href ? href.match(/phim-sex\/([^/]+)$/) : null;
        const id = m ? m[1] : '';
        if (title && href && id && !seen.has(id)) {
          data.javsub.push({ id, title, img: img || '', link: href, tag: labels.join(', ') || 'Sub', views: '', source: 'javsub' });
          seen.add(id); count++; added++;
        }
      });
      if (count > 0) console.log(`  JAVSub Trang ${p}: +${count}`);
      if ($('.item').length === 0) break;
    } catch(e) { console.log(`  JAVSub Trang ${p} err: ${e.message.substring(0,50)}`); break; }
  }
  console.log(`  => JAVSub: ${data.javsub.length} (+${added})`);

  // ===== JavTiful.blog =====
  console.log('\n[JavTiful] Crawling all pages...');
  seen = new Set(data.javtiful.map(m => m.id));
  added = 0;
  for (let p = 1; p <= 285; p++) {
    try {
      const url = p === 1 ? 'https://javtiful.blog/' : `https://javtiful.blog/page/${p}/`;
      const r = await axios.get(url, {timeout:15000, headers:{'User-Agent':UA}});
      const $ = cheerio.load(r.data);
      let count = 0;
      $('a[href*="/video/"]').each((i, el) => {
        const href = $(el).attr('href'); if (!href) return;
        const m = href.match(/\/video\/([^/]+)/); if (!m) return;
        const id = m[1]; if (seen.has(id)) return;
        const title = $(el).find('img').attr('alt') || $(el).text().trim() || id;
        const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
        data.javtiful.push({ id, title, img, link: 'https://javtiful.blog/video/' + id, tag: '', views: '', source: 'javtiful' });
        seen.add(id); count++; added++;
      });
      if (count > 0) console.log(`  JavTiful Trang ${p}: +${count}`);
      if ($('a[href*="/video/"]').length === 0) break;
    } catch(e) { console.log(`  JavTiful Trang ${p} err: ${e.message.substring(0,50)}`); break; }
  }
  console.log(`  => JavTiful: ${data.javtiful.length} (+${added})`);

  // ===== PhimXYZ (many pages) =====
  console.log('\n[PhimXYZ] Crawling all pages...');
  seen = new Set(data.phimxyz.map(m => m.id));
  added = 0;
  for (let p = 1; p <= 285; p++) {
    try {
      const url = p === 1 ? 'https://i.phimxyz.blog/the-loai/jav' : `https://i.phimxyz.blog/the-loai/jav?page=${p}`;
      const r = await axios.get(url, {timeout:15000, headers:{'User-Agent':UA}});
      const $ = cheerio.load(r.data);
      let count = 0;
      $('a[href*="/phim/"]').each((i, el) => {
        const href = $(el).attr('href'); if (!href || !href.match(/\/phim\/(.+)$/)) return;
        const id = href.match(/\/phim\/(.+)$/)[1];
        if (seen.has(id)) return;
        const alt = $(el).find('img').attr('alt') || '';
        if (!alt || alt === 'Nhật Bản' || alt === 'Trung Quốc' || alt === 'Châu Âu' || alt === 'Phim Sex HD') return;
        const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
        data.phimxyz.push({ id, title: alt, img: img.startsWith('http') ? img : 'https://i.phimxyz.blog' + img, link: href.startsWith('http') ? href : 'https://i.phimxyz.blog' + href, tag: '', views: '', source: 'phimxyz' });
        seen.add(id); count++; added++;
      });
      if (count > 0) console.log(`  PhimXYZ Trang ${p}: +${count}`);
      if ($('a[href*="/phim/"] img[alt]').length === 0) break;
    } catch(e) { console.log(`  PhimXYZ Trang ${p} err: ${e.message.substring(0,50)}`); break; }
  }
  console.log(`  => PhimXYZ: ${data.phimxyz.length} (+${added})`);

  // Save
  data.all = [];
  for (const k of ['javhdz','vlxx','javsub','javtiful','phimxyz'])
    if (data[k]) data.all.push(...data[k]);
  data.updated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\n=== TONG: ${data.all.length} ===`);
  for (const k of ['javhdz','vlxx','javsub','javtiful','phimxyz'])
    console.log(`  ${k}: ${(data[k]||[]).length}`);
}

main().catch(console.error);

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const DATA_FILE = './movies.json';
const UA = 'Mozilla/5.0';

async function main() {
  console.log('=== FIX PHIMXYZ THUMBNAILS + CRAWL ADDITIONAL ===');
  let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Fix existing phimxyz thumbnails by re-crawling
  console.log('\n[PhimXYZ] Re-crawling 5 trang để fix thumbnail...');
  const phimSeen = new Set();
  for (let p = 1; p <= 5; p++) {
    try {
      const url = p === 1 ? 'https://i.phimxyz.blog/the-loai/jav' : `https://i.phimxyz.blog/the-loai/jav?page=${p}`;
      const r = await axios.get(url, {timeout:15000, headers:{'User-Agent':UA}});
      const $ = cheerio.load(r.data);
      let count = 0;
      $('a[href*="/phim/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (!href || !href.match(/\/phim\/(.+)$/)) return;
        const id = href.match(/\/phim\/(.+)$/)[1];
        if (phimSeen.has(id)) return;
        phimSeen.add(id);
        const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
        const title = $(el).find('img').attr('alt') || $(el).text().trim().substring(0, 60);
        if (!title || title === 'Nhật Bản' || title === 'Trung Quốc' || title === 'Châu Âu') return;
        const fullImg = img.startsWith('http') ? img : 'https://i.phimxyz.blog' + img;
        const existing = data.phimxyz.find(m => m.id === id);
        if (existing) {
          existing.img = fullImg;
          existing.title = title;
        } else {
          data.phimxyz.push({ id, title, img: fullImg, link: href.startsWith('http') ? href : 'https://i.phimxyz.blog' + href, tag: '', views: '', source: 'phimxyz' });
        }
        count++;
      });
      if (count > 0) console.log(`  Trang ${p}: +${count}`);
    } catch(e) { console.log(`  Trang ${p} err: ${e.message.substring(0,50)}`); }
  }
  console.log(`  => PhimXYZ: ${data.phimxyz.length}`);

  // Crawl more JAVSub pages (10 trang)
  console.log('\n[JAVSub] Crawling them 10 trang...');
  const javSeen = new Set(data.javsub.map(m => m.id));
  let added = 0;
  for (let p = 1; p <= 10; p++) {
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
        const match = href ? href.match(/phim-sex\/([^/]+)$/) : null;
        const id = match ? match[1] : '';
        if (title && href && id && !javSeen.has(id)) {
          data.javsub.push({ id, title, img: img || '', link: href, tag: labels.join(', ') || 'Sub', views: '', source: 'javsub' });
          javSeen.add(id); count++; added++;
        }
      });
      console.log(`  Trang ${p}: +${count} phim`);
    } catch(e) { console.log(`  Trang ${p} err: ${e.message.substring(0,50)}`); }
  }
  console.log(`  => JAVSub: ${data.javsub.length} (+${added})`);

  // Crawl NJAV them
  console.log('\n[NJAV] Crawling them 5 trang...');
  const njSeen = new Set(data.njav.map(m => m.id));
  added = 0;
  for (let p = 1; p <= 5; p++) {
    try {
      const url = p === 1 ? 'https://www.njav.com/' : `https://www.njav.com/page/${p}/`;
      const r = await axios.get(url, {timeout:15000, headers:{'User-Agent':UA,'Accept':'text/html,application/xhtml+xml'}});
      const $ = cheerio.load(r.data);
      let count = 0;
      $('a[href*="/video/"]').each((i, el) => {
        const href = $(el).attr('href');
        const img = $(el).find('img');
        const src = img.attr('src') || img.attr('data-src') || '';
        const alt = img.attr('alt') || '';
        if (!href || !src || !alt) return;
        const match = href.match(/\/video\/([^/]+)/);
        const id = match ? match[1] : alt.replace(/\s+/g, '-').substring(0, 40);
        if (njSeen.has(id)) return;
        const fullLink = href.startsWith('http') ? href : 'https://www.njav.com' + (href.startsWith('/') ? '' : '/') + href;
        data.njav.push({ id, title: alt, img: src, link: fullLink, tag: '', views: '', source: 'njav' });
        njSeen.add(id); count++; added++;
      });
      console.log(`  Trang ${p}: +${count} phim`);
    } catch(e) { console.log(`  Trang ${p} err: ${e.message.substring(0,50)}`); }
  }
  console.log(`  => NJAV: ${data.njav.length} (+${added})`);

  data.all = [];
  for (const k of ['javhdz','vlxx','javsub','missav','javtiful','supjav','phimxyz','njav','bestjav'])
    if (data[k]) data.all.push(...data[k]);
  data.updated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\n=== TONG: ${data.all.length} ===`);
  for (const k of ['javhdz','vlxx','javsub','missav','javtiful','supjav','phimxyz','njav','bestjav'])
    console.log(`  ${k}: ${(data[k]||[]).length}`);
}
main().catch(console.error);

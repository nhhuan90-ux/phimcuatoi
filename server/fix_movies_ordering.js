const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DATA_FILE = path.join(__dirname, 'movies.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function run() {
  const moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const domains = JSON.parse(fs.readFileSync(path.join(__dirname, 'domains.json'), 'utf-8'));

  console.log('=== RE-ORDERING MOVIES DATABASE TO BRING NEWEST MOVIES TO TOP ===');

  // 1. JAVHDz: Sort numeric IDs descending
  if (moviesData.javhdz) {
    moviesData.javhdz.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    console.log(`JAVHDz reordered. Top ID: ${moviesData.javhdz[0]?.id}`);
  }

  // 2. SubJAV: Sort numeric IDs descending
  if (moviesData.subjav) {
    moviesData.subjav.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    console.log(`SubJAV reordered. Top ID: ${moviesData.subjav[0]?.id}`);
  }

  // 3. JAVSub: Fetch live homepage order to bring latest items to top
  try {
    const res = await axios.get('https://javsub.blog/', { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const liveIds = [];
    $('.item').each((i, el) => {
      const h = $(el).find('.item__thumbnail').attr('href');
      const m = h ? h.match(/phim-sex\/([^/]+)$/) : null;
      if (m) liveIds.push(m[1]);
    });
    if (liveIds.length > 0) {
      const liveSet = new Set(liveIds);
      const topItems = [];
      const restItems = [];
      moviesData.javsub.forEach(m => {
        if (liveSet.has(m.id)) topItems.push(m);
        else restItems.push(m);
      });
      // Sort topItems by their position on live homepage
      topItems.sort((a, b) => liveIds.indexOf(a.id) - liveIds.indexOf(b.id));
      moviesData.javsub = [...topItems, ...restItems];
      console.log(`JAVSub reordered using live homepage order (${topItems.length} items brought to top). Top ID: ${moviesData.javsub[0]?.id}`);
    }
  } catch (e) { console.error('JAVSub live fetch error:', e.message); }

  // 4. JavTiful: Fetch live homepage order
  try {
    const res = await axios.get('https://javtiful.blog/', { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const liveIds = [];
    $('a[href*="/video/"]').each((i, el) => {
      const href = $(el).attr('href'); if (!href) return;
      const m = href.match(/\/video\/([^/]+)/); if (m) liveIds.push(m[1]);
    });
    if (liveIds.length > 0) {
      const liveSet = new Set(liveIds);
      const topItems = [];
      const restItems = [];
      moviesData.javtiful.forEach(m => {
        if (liveSet.has(m.id)) topItems.push(m);
        else restItems.push(m);
      });
      topItems.sort((a, b) => liveIds.indexOf(a.id) - liveIds.indexOf(b.id));
      moviesData.javtiful = [...topItems, ...restItems];
      console.log(`JavTiful reordered using live homepage order (${topItems.length} items brought to top). Top ID: ${moviesData.javtiful[0]?.id}`);
    }
  } catch (e) { console.error('JavTiful live fetch error:', e.message); }

  // 5. PhimXYZ: Fetch live homepage order
  try {
    const res = await axios.get(`https://${domains.phimxyz}/the-loai/jav`, { timeout: 10000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const liveIds = [];
    $('a[href*="/phim/"]').each((i, el) => {
      const href = $(el).attr('href'); if (!href || !href.match(/\/phim\/(.+)$/)) return;
      liveIds.push(href.match(/\/phim\/(.+)$/)[1]);
    });
    if (liveIds.length > 0) {
      const liveSet = new Set(liveIds);
      const topItems = [];
      const restItems = [];
      moviesData.phimxyz.forEach(m => {
        if (liveSet.has(m.id)) topItems.push(m);
        else restItems.push(m);
      });
      topItems.sort((a, b) => liveIds.indexOf(a.id) - liveIds.indexOf(b.id));
      moviesData.phimxyz = [...topItems, ...restItems];
      console.log(`PhimXYZ reordered using live homepage order (${topItems.length} items brought to top). Top ID: ${moviesData.phimxyz[0]?.id}`);
    }
  } catch (e) { console.error('PhimXYZ live fetch error:', e.message); }

  // Rebuild moviesData.all
  const all = [];
  ['javhdz', 'vlxx', 'javsub', 'javtiful', 'phimxyz', 'subjav'].forEach(k => {
    if (moviesData[k]) all.push(...moviesData[k]);
  });
  moviesData.all = all;

  fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2), 'utf-8');
  console.log('movies.json successfully updated with newest items at the top of each category!');
}

run().then(() => process.exit(0)).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

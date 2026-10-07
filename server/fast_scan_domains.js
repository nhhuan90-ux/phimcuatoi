const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const tlds = ['city', 'st', 'site', 'net', 'love', 'red', 'mobi', 'im', 'top', 'cc', 'me', 'in', 'app', 'club', 'live', 'tv', 'xyz', 'work', 'fun', 'win', 'today', 'is', 'asia', 'fit', 'one', 'lat', 'icu', 'cam', 'lol', 'ink', 'link', 'blog', 'pro', 'vip'];

async function testCandidate(source, host) {
  try {
    let url = `https://${host}/`;
    if (source === 'javhdz') url = `https://${host}/category/uncensored-3/`;
    else if (source === 'subjav') url = `https://${host}/jav-vietsub/`;
    else if (source === 'phimxyz') url = `https://${host}/the-loai/jav`;

    const res = await axios.get(url, { timeout: 3500, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);

    if (res.status === 200) {
      if (source === 'javhdz' && $('.movie-item.m-block').length > 0) return true;
      if (source === 'subjav' && ($('.item-video').length > 0 || $('article').length > 0 || $('.video-item').length > 0)) return true;
      if (source === 'vlxx' && $('.video-item').length > 0) return true;
      if (source === 'javsub' && $('.item').length > 0) return true;
      if (source === 'javtiful' && $('a[href*="/video/"]').length > 0) return true;
    }
  } catch (e) {}
  return false;
}

async function scanSource(source) {
  console.log(`\nScanning active domains for ${source}...`);
  for (const ext of tlds) {
    const host = source === 'phimxyz' ? `i1.phimxyz.${ext}` : `${source}.${ext}`;
    const ok = await testCandidate(source, host);
    if (ok) {
      console.log(`  [FOUND VALID DOMAIN FOR ${source}] -> ${host}`);
      return host;
    }
  }
  console.log(`  [NONE FOUND IN TLD MATRIX FOR ${source}]`);
  return null;
}

async function run() {
  const javhdz = await scanSource('javhdz');
  const subjav = await scanSource('subjav');
  const vlxx = await scanSource('vlxx');
  const javsub = await scanSource('javsub');
  const javtiful = await scanSource('javtiful');

  const current = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));
  if (javhdz) current.javhdz = javhdz;
  if (subjav) current.subjav = subjav;

  fs.writeFileSync('server/domains.json', JSON.stringify(current, null, 2), 'utf-8');
  console.log('\nUpdated domains.json:', current);
}

run();

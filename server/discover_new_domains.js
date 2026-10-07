const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const TLD_EXTENSIONS = [
  'site', 'net', 'pro', 'vip', 'im', 'love', 'mobi', 'red', 'top', 'cc', 'me', 
  'in', 'app', 'club', 'live', 'tv', 'xyz', 'work', 'fun', 'st', 'blog', 'co'
];

async function findJavhdzDomain() {
  console.log('=== 1. SEARCHING JAVHDz DOMAIN ===');
  for (const ext of TLD_EXTENSIONS) {
    const domain = `javhdz.${ext}`;
    const url = `https://${domain}/category/uncensored-3/`;
    try {
      const res = await axios.get(url, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.movie-item.m-block').length > 0) {
        console.log(`  [ALIVE] JAVHDz active domain found: https://${domain}`);
        return domain;
      }
    } catch (e) {}
  }
  console.log('  [FAIL] No JAVHDz domain found in TLD scan.');
}

async function findSubjavDomain() {
  console.log('\n=== 2. SEARCHING SUBJAV DOMAIN ===');
  for (const ext of TLD_EXTENSIONS) {
    const domain = `subjav.${ext}`;
    const url = `https://${domain}/jav-vietsub/`;
    try {
      const res = await axios.get(url, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && ($('.item-video').length > 0 || $('article').length > 0)) {
        console.log(`  [ALIVE] SubJAV active domain found: https://${domain}`);
        return domain;
      }
    } catch (e) {}
  }
  console.log('  [FAIL] No SubJAV domain found in TLD scan.');
}

async function findVlxxDomain() {
  console.log('\n=== 3. SEARCHING VLXX DOMAIN ===');
  const domains = ['vlxx.net', 'vlxx.moi', 'vlxx.sex', 'vlxx.pro', 'vlxx.tv', 'vlxx.club', 'vlxx.site', 'vlxx.me', 'vlxx.cc', 'vlxx.org'];
  for (const d of domains) {
    try {
      const res = await axios.get(`https://${d}/`, { timeout: 3000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.video-item').length > 0) {
        console.log(`  [ALIVE] VLXX active domain found: https://${d}`);
        return d;
      }
    } catch (e) {}
  }
}

async function searchYahoo(keyword) {
  console.log(`\n=== SEARCHING YAHOO FOR "${keyword}" ===`);
  try {
    const res = await axios.get(`https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}`, {
      timeout: 8000,
      headers: { 'User-Agent': UA }
    });
    const $ = cheerio.load(res.data);
    const hosts = new Set();
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.includes('r.search.yahoo.com')) {
        const match = href.match(/\/RU=([^/]+)\/RK=/);
        if (match) href = decodeURIComponent(match[1]);
      }
      if (href.startsWith('http')) {
        try {
          const host = new URL(href).hostname.toLowerCase();
          if (host.includes(keyword) && !host.includes('yahoo.com') && !host.includes('google.com')) {
            hosts.add(host);
          }
        } catch (e) {}
      }
    });
    console.log(`Yahoo candidates for ${keyword}:`, Array.from(hosts));
    return Array.from(hosts);
  } catch (e) {
    console.error('Yahoo search error:', e.message);
    return [];
  }
}

async function run() {
  await findJavhdzDomain();
  await findSubjavDomain();
  await findVlxxDomain();
  await searchYahoo('javhdz');
  await searchYahoo('subjav');
}

run();

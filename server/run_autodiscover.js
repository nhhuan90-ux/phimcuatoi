const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function searchYahooCandidates(keyword) {
  console.log(`Searching Yahoo for keyword: "${keyword}"`);
  try {
    const res = await axios.get(`https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}`, {
      timeout: 8000,
      headers: { 'User-Agent': UA }
    });
    const $ = cheerio.load(res.data);
    const candidates = new Set();
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.includes('r.search.yahoo.com')) {
        const match = href.match(/\/RU=([^/]+)\/RK=/);
        if (match) href = decodeURIComponent(match[1]);
      }
      if (href.startsWith('http')) {
        try {
          const host = new URL(href).hostname.toLowerCase().replace(/^www\./, '');
          if (host.includes(keyword) && !host.includes('yahoo.com') && !host.includes('google.com')) {
            candidates.add(host);
          }
        } catch (e) {}
      }
    });
    return Array.from(candidates);
  } catch (e) {
    console.error('Yahoo error:', e.message);
    return [];
  }
}

async function validateCandidate(source, host) {
  try {
    if (source === 'javhdz') {
      const url = `https://${host}/category/uncensored-3/`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.movie-item.m-block').length > 0) return true;
    } else if (source === 'subjav') {
      const url = `https://${host}/jav-vietsub/`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.item-video').length > 0) return true;
    } else if (source === 'javsub') {
      const url = `https://${host}/`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.item').length > 0) return true;
    } else if (source === 'javtiful') {
      const url = `https://${host}/`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('a[href*="/video/"]').length > 0) return true;
    }
  } catch (e) {}
  return false;
}

async function run() {
  console.log('=== AUTO-DISCOVERING ALL BROKEN DOMAINS ===');

  const sources = ['javhdz', 'subjav', 'javsub', 'javtiful'];
  for (const src of sources) {
    console.log(`\nScanning candidates for ${src}...`);
    const candidates = await searchYahooCandidates(src);
    console.log(`Found candidates for ${src}:`, candidates);
    let found = false;
    for (const host of candidates) {
      const isValid = await validateCandidate(src, host);
      if (isValid) {
        console.log(`[VALIDATED NEW DOMAIN FOR ${src}] -> ${host}`);
        domains[src] = host;
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`No valid domain found via Yahoo for ${src}. Testing TLD matrix...`);
      const tlds = ['red', 'city', 'blog', 'mobi', 'im', 'love', 'site', 'me', 'xyz', 'top', 'net', 'vip', 'click', 'tv', 'club', 'pro', 'live', 'cc', 'co', 'info', 'org', 'biz', 'io', 'us', 'fun', 'win', 'today', 'is', 'asia', 'fit', 'one', 'lat', 'icu', 'cam', 'lol', 'ink', 'work', 'link'];
      for (const ext of tlds) {
        const host = `${src}.${ext}`;
        const isValid = await validateCandidate(src, host);
        if (isValid) {
          console.log(`[VALIDATED TLD DOMAIN FOR ${src}] -> ${host}`);
          domains[src] = host;
          found = true;
          break;
        }
      }
    }
  }

  console.log('\nFinal Discovered Domains:', domains);
  fs.writeFileSync('server/domains.json', JSON.stringify(domains, null, 2), 'utf-8');
}

run();

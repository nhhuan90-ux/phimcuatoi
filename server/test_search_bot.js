const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const TLD_EXTENSIONS = [
  'red', 'city', 'blog', 'mobi', 'im', 'love', 'site', 'me', 'xyz', 'top', 'net', 'vip', 
  'click', 'tv', 'club', 'pro', 'live', 'cc', 'co', 'info', 'org', 'biz', 'io', 'us', 
  'fun', 'win', 'today', 'is', 'asia', 'fit', 'one', 'lat', 'icu', 'cam', 'lol', 'ink', 'work', 'link'
];

const EXCLUDED_DOMAINS = [
  'google.com', 'bing.com', 'yahoo.com', 'facebook.com', 'youtube.com', 'github.com', 
  'reddit.com', 'twitter.com', 'wikipedia.org', 'scam.vn', 'similarweb.com', 'siteindices.com',
  'downforeveryoneorjustme.com', 'notopening.com', 'scamadviser.com'
];

async function fetchSearchCandidates(keyword) {
  const candidates = new Set();
  
  // 1. Yahoo Search
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}`;
    const res = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.includes('r.search.yahoo.com')) {
        const match = href.match(/\/RU=([^/]+)\/RK=/);
        if (match) href = decodeURIComponent(match[1]);
      }
      if (href.startsWith('http')) {
        try {
          const hostname = new URL(href).hostname.toLowerCase().replace(/^www\./, '');
          if (hostname.includes(keyword) && !EXCLUDED_DOMAINS.some(ex => hostname.includes(ex))) {
            candidates.add(hostname);
          }
        } catch (e) {}
      }
    });
  } catch (e) {}

  // 2. SearX Public API
  try {
    const url = `https://searx.be/search?q=${encodeURIComponent(keyword)}&format=json`;
    const res = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': UA } });
    const results = res.data?.results || [];
    results.forEach(r => {
      if (r.url) {
        try {
          const hostname = new URL(r.url).hostname.toLowerCase().replace(/^www\./, '');
          if (hostname.includes(keyword) && !EXCLUDED_DOMAINS.some(ex => hostname.includes(ex))) {
            candidates.add(hostname);
          }
        } catch (e) {}
      }
    });
  } catch (e) {}

  // 3. TLD Matrix Generator
  for (const ext of TLD_EXTENSIONS) {
    if (keyword === 'phimxyz') {
      candidates.add(`i1.phimxyz.${ext}`);
      candidates.add(`i.phimxyz.${ext}`);
      candidates.add(`phimxyz.${ext}`);
    } else {
      candidates.add(`${keyword}.${ext}`);
    }
  }

  return Array.from(candidates);
}

async function validateDomain(source, hostname) {
  try {
    if (source === 'javhdz') {
      const url = `https://${hostname}/category/uncensored-3/`;
      const res = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.movie-item.m-block').length > 0) return true;
    } 
    else if (source === 'subjav') {
      const apiUrl = `https://${hostname}/wp-json/tiktok/v1/videos/grid?page=1&limit=1`;
      try {
        const res = await axios.get(apiUrl, { timeout: 5000, headers: { 'User-Agent': UA } });
        if (res.status === 200 && res.data?.videos?.length > 0) return true;
      } catch (e) {}
      const htmlUrl = `https://${hostname}/jav-vietsub/`;
      const res = await axios.get(htmlUrl, { timeout: 5000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.item-video').length > 0) return true;
    }
    else if (source === 'phimxyz') {
      const url = `https://${hostname}/the-loai/jav`;
      const res = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('a[href*="/phim/"]').length > 0) return true;
    }
    else if (source === 'javsub') {
      const url = `https://${hostname}/`;
      const res = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.item').length > 0) return true;
    }
    else if (source === 'javtiful') {
      const url = `https://${hostname}/`;
      const res = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('a[href*="/video/"]').length > 0) return true;
    }
  } catch (e) {}
  return false;
}

async function autoFindDomain(source) {
  console.log(`\n=== Running Search & Validation Bot for source: ${source} ===`);
  const candidates = await fetchSearchCandidates(source);
  console.log(`Found ${candidates.length} candidates to validate.`);
  for (const host of candidates) {
    const isValid = await validateDomain(source, host);
    if (isValid) {
      console.log(`[SUCCESS] Found active valid domain for ${source}: https://${host}`);
      return host;
    }
  }
  console.log(`[FAIL] No active domain found for ${source}.`);
  return null;
}

async function run() {
  await autoFindDomain('javhdz');
  await autoFindDomain('subjav');
  await autoFindDomain('javsub');
  await autoFindDomain('javtiful');
  await autoFindDomain('phimxyz');
}

run();

const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');
const http2 = require('http2');
const { URL } = require('url');
const { execFile } = require('child_process');

function fetchHtmlWithHttp2(targetUrl) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(targetUrl);
      const client = http2.connect(parsed.origin);

      client.on('error', (err) => {
        reject(err);
      });

      const req = client.request({
        ':path': parsed.pathname + parsed.search,
        ':method': 'GET',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8'
      });

      req.setTimeout(10000, () => {
        req.close();
        client.close();
        reject(new Error('HTTP/2 request timeout'));
      });

      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        client.close();
        resolve(data);
      });

      req.on('error', (err) => {
        client.close();
        reject(err);
      });

      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

function fetchHtmlWithCurl(targetUrl) {
  return new Promise((resolve, reject) => {
    const args = [
      '-s',
      '-L',
      '-H', 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '-H', 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      targetUrl
    ];
    execFile('curl', args, { timeout: 15000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function fetchHtml(targetUrl) {
  const JAVSUB_PROXY_URL = process.env.JAVSUB_PROXY_URL || '';
  if (JAVSUB_PROXY_URL) {
    try {
      const separator = JAVSUB_PROXY_URL.includes('?') ? '&' : '?';
      const proxyFetchUrl = `${JAVSUB_PROXY_URL}${separator}url=${encodeURIComponent(targetUrl)}`;
      const res = await axios.get(proxyFetchUrl, { timeout: 15000 });
      if (res.data && res.data.length > 5000 && res.data.includes('set-player-source')) {
        return res.data;
      }
      console.warn('Proxy returned page without video sources, falling back to local methods.');
    } catch (proxyError) {
      console.error('GAS Proxy fetch failed, falling back to local methods:', proxyError.message);
    }
  }

  try {
    return await fetchHtmlWithCurl(targetUrl);
  } catch (curlError) {
    console.error('Curl fetch failed, falling back to HTTP/2:', curlError.message);
    try {
      return await fetchHtmlWithHttp2(targetUrl);
    } catch (h2Error) {
      throw new Error(`All fetch methods failed: Curl (${curlError.message}), HTTP/2 (${h2Error.message})`);
    }
  }
}

const PID_FILE = path.join(__dirname, 'server.pid');
try {
  fs.writeFileSync(PID_FILE, String(process.pid));
} catch (e) {
  // Ignored in read-only filesystems (e.g. Vercel Serverless)
}

const app = express();

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', '*');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
const PORT = process.env.PORT || 3001;
const ALL_SOURCES = ['javhdz','vlxx','javsub','javtiful','phimxyz','subjav'];

let moviesData = {};
ALL_SOURCES.forEach(k => moviesData[k] = []);
moviesData.all = [];

function getPossibleDataPaths(filename) {
  return [
    path.join(__dirname, filename),
    path.join(process.cwd(), 'server', filename),
    path.join(process.cwd(), filename)
  ];
}

function loadData() {
  try {
    const paths = getPossibleDataPaths('movies.json');
    const targetPath = paths.find(p => fs.existsSync(p));
    if (targetPath) {
      moviesData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      ALL_SOURCES.forEach(k => { if (!moviesData[k]) moviesData[k] = []; });
      if (!moviesData.all || moviesData.all.length === 0) {
        const combined = [];
        ALL_SOURCES.forEach(k => {
          if (Array.isArray(moviesData[k])) combined.push(...moviesData[k]);
        });
        moviesData.all = combined;
      }
      console.log(`Loaded ${(moviesData.all||[]).length} movies from ${targetPath}`);
    } else {
      console.error('movies.json not found in candidate paths!');
    }
  } catch (e) { console.error('Load error:', e.message); }
}
loadData();

function saveData() {
  try {
    const paths = getPossibleDataPaths('movies.json');
    const targetPath = paths.find(p => fs.existsSync(p)) || paths[0];
    fs.writeFileSync(targetPath, JSON.stringify(moviesData, null, 2), 'utf-8');
    return true;
  } catch (e) { console.error('Save error:', e.message); return false; }
}

// ============ AUTODISCOVER DOMAINS ============
let domains = {
  javhdz: 'javhdz.cam',
  subjav: 'subjav.city',
  phimxyz: 'i1.phimxyz.blog',
  javsub: 'javsub.blog',
  javtiful: 'javtiful.fit'
};

function loadDomains() {
  try {
    const paths = getPossibleDataPaths('domains.json');
    const targetPath = paths.find(p => fs.existsSync(p));
    if (targetPath) {
      domains = { ...domains, ...JSON.parse(fs.readFileSync(targetPath, 'utf-8')) };
      console.log('Loaded domains:', domains);
    }
  } catch (e) { console.error('Load domains error:', e.message); }
}
loadDomains();

function saveDomains() {
  try {
    const paths = getPossibleDataPaths('domains.json');
    const targetPath = paths.find(p => fs.existsSync(p)) || paths[0];
    fs.writeFileSync(targetPath, JSON.stringify(domains, null, 2), 'utf-8');
    console.log('Saved domains:', domains);
  } catch (e) { console.error('Save domains error:', e.message); }
}

function updateDatabaseDomains(source, oldDomain, newDomain) {
  try {
    let updatedCount = 0;
    const processList = (list) => {
      if (!list) return;
      list.forEach(m => {
        if (m.source === source) {
          if (m.img && m.img.includes(oldDomain)) {
            m.img = m.img.replace(oldDomain, newDomain);
            updatedCount++;
          }
          if (m.link && m.link.includes(oldDomain)) {
            m.link = m.link.replace(oldDomain, newDomain);
          }
        }
      });
    };
    processList(moviesData[source]);
    processList(moviesData.all);
    if (updatedCount > 0) {
      saveData();
      console.log(`[AutoDiscover] Migrated database entries for ${source}: replaced ${oldDomain} with ${newDomain} (${updatedCount} items)`);
    }
  } catch (err) {
    console.error(`[AutoDiscover] DB update error for ${source}:`, err.message);
  }
}

// ============ SEARCH ENGINE + TLD MATRIX AUTODISCOVER BOT ============
const TLD_EXTENSIONS = [
  'red', 'city', 'blog', 'mobi', 'im', 'love', 'site', 'me', 'xyz', 'top', 'net', 'vip', 
  'click', 'tv', 'club', 'pro', 'live', 'cc', 'co', 'info', 'org', 'biz', 'io', 'us', 
  'fun', 'win', 'today', 'is', 'asia', 'fit', 'one', 'lat', 'icu', 'cam', 'lol', 'ink', 'work', 'link'
];

const EXCLUDED_SEARCH_DOMAINS = [
  'google.com', 'google.com.vn', 'bing.com', 'yahoo.com', 'duckduckgo.com',
  'facebook.com', 'youtube.com', 'github.com', 'reddit.com', 'twitter.com',
  'wikipedia.org', 'scam.vn', 'similarweb.com', 'semrush.com', 'builtwith.com',
  'scamadviser.com', 'whois.com', 'siteindices.com', 'downforeveryoneorjustme.com', 'notopening.com'
];

async function fetchSearchCandidates(keyword) {
  const candidates = new Set();
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

  // 1. Yahoo Search Engine Scraper
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}`;
    const res = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
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
          if (hostname.includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, '')) && !EXCLUDED_SEARCH_DOMAINS.some(ex => hostname.includes(ex))) {
            candidates.add(hostname);
          }
        } catch (e) {}
      }
    });
  } catch (e) {}

  // 2. SearX Public API
  try {
    const url = `https://searx.be/search?q=${encodeURIComponent(keyword)}&format=json`;
    const res = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
    const results = res.data?.results || [];
    results.forEach(r => {
      if (r.url) {
        try {
          const hostname = new URL(r.url).hostname.toLowerCase().replace(/^www\./, '');
          if (hostname.includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, '')) && !EXCLUDED_SEARCH_DOMAINS.some(ex => hostname.includes(ex))) {
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

async function validateDomainCandidate(source, hostname) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  try {
    if (source === 'javhdz') {
      const url = `https://${hostname}/category/uncensored-3/`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.movie-item.m-block').length > 0) return true;
    } 
    else if (source === 'subjav') {
      const apiUrl = `https://${hostname}/wp-json/tiktok/v1/videos/grid?page=1&limit=1`;
      try {
        const res = await axios.get(apiUrl, { timeout: 4000, headers: { 'User-Agent': UA } });
        if (res.status === 200 && res.data?.videos?.length > 0) return true;
      } catch (e) {}
      const htmlUrl = `https://${hostname}/jav-vietsub/`;
      const res = await axios.get(htmlUrl, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.item-video').length > 0) return true;
    }
    else if (source === 'phimxyz') {
      const url = `https://${hostname}/the-loai/jav`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('a[href*="/phim/"]').length > 0) return true;
    }
    else if (source === 'javsub') {
      const url = `https://${hostname}/`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('.item').length > 0) return true;
    }
    else if (source === 'javtiful') {
      const url = `https://${hostname}/`;
      const res = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': UA } });
      const $ = cheerio.load(res.data);
      if (res.status === 200 && $('a[href*="/video/"]').length > 0) return true;
    }
  } catch (e) {}
  return false;
}

async function autodiscoverDomain(source) {
  console.log(`[AutoSearchBot] Searching Google/Yahoo & matrix domains for source: ${source}...`);
  const oldDomain = domains[source];
  
  // First check if current domain is still valid and alive
  if (oldDomain && await validateDomainCandidate(source, oldDomain)) {
    console.log(`[AutoSearchBot] Current domain ${oldDomain} for ${source} is still healthy.`);
    return oldDomain;
  }

  const candidates = await fetchSearchCandidates(source);
  console.log(`[AutoSearchBot] Found ${candidates.length} candidates for ${source}. Validating...`);
  
  for (const host of candidates) {
    if (host === oldDomain) continue;
    const isValid = await validateDomainCandidate(source, host);
    if (isValid) {
      console.log(`[AutoSearchBot] FOUND NEW ACTIVE DOMAIN FOR ${source}: ${host}`);
      domains[source] = host;
      saveDomains();
      if (oldDomain) {
        updateDatabaseDomains(source, oldDomain, host);
      }
      return host;
    }
  }
  
  console.log(`[AutoSearchBot] Search scan completed. No new domain found for ${source}.`);
  return null;
}

async function checkAllDomainsHealthAndAutoDiscover() {
  console.log('[AutoSearchBot] Running background health check on all source domains...');
  const sources = ['javhdz', 'subjav', 'phimxyz', 'javsub', 'javtiful', 'vlxx'];
  for (const src of sources) {
    try {
      const currentHost = domains[src] || (src === 'vlxx' ? 'vlxx.phd' : `${src}.com`);
      const isHealthy = await validateDomainCandidate(src, currentHost);
      if (!isHealthy) {
        console.warn(`[AutoSearchBot] Domain ${currentHost} for ${src} is unhealthy or unreachable! Launching auto-discovery...`);
        autodiscoverDomain(src).catch(e => console.error(`Auto-discovery error for ${src}:`, e.message));
      }
    } catch (e) {}
  }
}

// Run periodic domain health check once every 24 hours
setInterval(checkAllDomainsHealthAndAutoDiscover, 24 * 60 * 60 * 1000);
setTimeout(checkAllDomainsHealthAndAutoDiscover, 10000);

// ============ JAVHDz ============
async function getJavhdzVideoUrl(id) {
  const movie = moviesData.javhdz.find(m => m.id === id || m.code === id);
  let code = '';
  if (movie && movie.img) {
    const match = movie.img.match(/\/data\/([A-Za-z0-9-]+?)-\d{4}-\d{2}\.jpg/i) || movie.img.match(/\/([A-Za-z0-9-]+)\.jpg/i);
    if (match) code = match[1].toLowerCase();
  }
  if (!code) code = movie?.code || id;

  const candidateUrls = [
    `https://javgiga.net/${code}-mosaic/`,
    `https://javgiga.net/${code}/`,
    `https://javgiga.net/${code}-engsub/`,
    movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, 'javgiga.net') : null
  ].filter(Boolean);

  let iframeSrc = '';
  for (const url of candidateUrls) {
    try {
      const pageRes = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(pageRes.data);
      iframeSrc = $('iframe[src*="morencius"], iframe[src*="vidhide"], iframe[src*="play"]').first().attr('src') || '';
      if (iframeSrc) break;
    } catch (e) {}
  }
  
  if (!iframeSrc) return null;

  let finalM3u8 = `https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-${id}-playlist.m3u8`;

  try {
    const embedRes = await axios.get(iframeSrc, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javgiga.net/' } });
    const html = embedRes.data;
    
    const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[\s\S]*?\.split\('\|'\).*?\)/);
    if (evalMatch) {
      const pMatch = evalMatch[0].match(/}\s*\(\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']+)'/);
      if (pMatch) {
        let p = pMatch[1];
        const a = parseInt(pMatch[2]);
        let c = parseInt(pMatch[3]);
        const k = pMatch[4].split('|');
        while (c--) {
          if (k[c]) p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
        }
        const m3u8Match = p.match(/(https?:\/\/[^"'\s|]+\.m3u8[^"'\s|]*)/i);
        if (m3u8Match) {
          finalM3u8 = m3u8Match[1];
        }
      }
    }
  } catch (e) {}

  return { videoUrl: finalM3u8, type: 'hls' };
}

// ============ VLXX ============
async function getVlxxVideoUrl(id, server = 1) {
  try {
    const res = await axios.post('https://vlxx.phd/ajax.php', `vlxx_server=1&id=${id}&server=${server}`, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest', 'Referer': 'https://vlxx.phd/' }, timeout: 15000 });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    if (data.player) {
      const $ = cheerio.load(data.player);
      const iframeUrl = $('iframe').first().attr('src');
      if (iframeUrl) {
        return { url: iframeUrl, type: 'iframe' };
      }
    }
    return { error: 'No player data' };
  } catch (e) { return null; }
}

// ============ JAVSub ============
async function getJavsubVideoUrl(id, server = 1) {
  const movie = moviesData.javsub.find(m => m.id === id);
  try {
    let playUrl = '';
    if (movie && movie.embedUrls && movie.embedUrls.length > 0) {
      const idx = Math.min(Math.max(0, parseInt(server) - 1), movie.embedUrls.length - 1);
      playUrl = movie.embedUrls[idx]?.url || movie.embedUrls[0].url;
    }
    if (!playUrl) {
      const link = movie?.link || `https://${domains.javsub || 'javsub.xyz'}/phim-sex/${id}`;
      const html = await fetchHtml(link);
      const $ = cheerio.load(html);
      playUrl = $('button.set-player-source').first().attr('data-source');
    }
    if (!playUrl) return null;

    const cleanUrl = playUrl.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
    let m3u8Url = cleanUrl;
    if (cleanUrl.includes('/videos/') && cleanUrl.includes('/play')) {
      m3u8Url = cleanUrl.replace(/\/play\??.*/, '/master.m3u8');
    }
    return { videoUrl: m3u8Url, type: 'hls' };
  } catch (e) {
    return null;
  }
}

// ============ JavTiful ============
async function getJavtifulVideoUrl(id) {
  const movie = moviesData.javtiful.find(m => m.id === id);
  const code = movie?.code || id;
  const upperId = code ? code.toUpperCase() : code;
  try {
    const embedUrl = `https://upload18.org/play/index/${upperId}`;
    const embedRes = await axios.get(embedUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javtiful.fit/' }
    });
    const match = embedRes.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
    if (match) {
      const rawUrl = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
      return { videoUrl: rawUrl, type: 'hls' };
    }
  } catch (e) {}
  return { url: `https://upload18.org/play/index/${upperId}`, type: 'iframe' };
}

// ============ PhimXYZ ============
async function getPhimxyzVideoUrl(id) {
  try {
    const movie = moviesData.phimxyz.find(m => m.id === id);
    const link = movie?.link ? movie.link.replace(/i\d?\.phimxyz\.[a-z]+/i, domains.phimxyz) : `https://${domains.phimxyz}/phim/${id}`;
    const html = await fetchHtml(link);
    const $ = cheerio.load(html);
    let p = $('[data-link]').first().attr('data-link') || '';
    if (!p) {
      const match = html.match(/data-link=["']([^"']+)["']/);
      if (match) p = match[1];
    }
    if (!p) return null;
    return { videoUrl: p.startsWith('http') ? p.replace(/^http:/i, 'https:') : 'https://' + domains.phimxyz + p, type: 'hls' };
  } catch (e) { return null; }
}

// ============ SubJAV ============
async function getSubjavVideoUrl(id) {
  const movie = moviesData.subjav.find(m => m.id === String(id) || (m.link && m.link.includes(`/${id}/`)));
  let slug = id;
  if (movie && movie.link) {
    const match = movie.link.match(/subjav\.[a-z]+\/([^/]+)/);
    if (match) slug = match[1];
  }
  const m3u8Url = `https://${domains.subjav || 'subjav1.blog'}/storage/m3u8/${slug}/index.m3u8`;
  return { videoUrl: m3u8Url, type: 'hls' };
}


// ============ API ROUTES ============
app.get('/api/test-javsub', async (req, res) => {
  const JAVSUB_PROXY_URL = process.env.JAVSUB_PROXY_URL || '';
  const targetUrl = 'https://javsub.blog/phim-sex/xoac-co-nang-tung-thich-minh-nhung-gio-da-co-chong';
  let proxyStatus = 'Not Set';
  let proxyError = null;
  let proxyHtmlLength = 0;
  let proxyHasSources = false;

  if (JAVSUB_PROXY_URL) {
    proxyStatus = 'Set (URL: ' + JAVSUB_PROXY_URL.slice(0, 35) + '...)';
    try {
      const separator = JAVSUB_PROXY_URL.includes('?') ? '&' : '?';
      const proxyFetchUrl = `${JAVSUB_PROXY_URL}${separator}url=${encodeURIComponent(targetUrl)}`;
      const response = await axios.get(proxyFetchUrl, { timeout: 15000 });
      proxyHtmlLength = response.data ? response.data.length : 0;
      proxyHasSources = response.data ? response.data.includes('set-player-source') : false;
      if (!proxyHasSources) {
        proxyError = 'Proxy returned HTML without set-player-source. Sample: ' + (response.data ? response.data.slice(0, 300) : 'empty');
      }
    } catch (e) {
      proxyError = e.message;
    }
  }

  try {
    const html = await fetchHtml(targetUrl);
    res.json({
      proxyStatus,
      proxyError,
      proxyHtmlLength,
      proxyHasSources,
      fallbackStatus: 200,
      fallbackLength: html.length,
      fallbackHasSources: html.includes('set-player-source')
    });
  } catch (e) {
    res.status(500).json({
      proxyStatus,
      proxyError,
      proxyHtmlLength,
      proxyHasSources,
      error: e.message,
      stack: e.stack
    });
  }
});

const isSubjavVertical = (m) => {
  if (m.source !== 'subjav') return false;
  return m.tag === 'Shorts' || (m.link && m.link.includes('/video/')) || (m.img && m.img.includes('tiktok-thumbnails'));
};

app.get('/api/movies', (req, res) => {
  const { source, format, search, page = 1, limit = 50 } = req.query;
  let list = moviesData.all || [];
  
  if (source && source !== 'all') {
    list = list.filter(m => m.source === source);
    if (source === 'subjav') {
      if (format === 'vertical') {
        list = list.filter(isSubjavVertical);
      } else if (format === 'horizontal') {
        list = list.filter(m => !isSubjavVertical(m));
      }
    }
  } else {
    // Exclude SubJAV vertical shorts from the combined/all listing
    list = list.filter(m => !isSubjavVertical(m));
  }
  
  if (search) { const q = search.toLowerCase(); list = list.filter(m => m.title.toLowerCase().includes(q)); }
  const total = list.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  res.json({ total, page: parseInt(page), limit: parseInt(limit), items: list.slice(start, start + parseInt(limit)) });
});

app.get('/api/movie/:source/:id', (req, res) => {
  const list = moviesData[req.params.source] || [];
  const movie = list.find(m => m.id === req.params.id);
  if (!movie) return res.status(404).json({ error: 'Not found' });
  res.json(movie);
});

app.get('/api/video/:source/:id', async (req, res) => {
  const { source, id } = req.params;
  const server = req.query.server || 1;
  const handlers = {
    javhdz: () => getJavhdzVideoUrl(id),
    vlxx: () => getVlxxVideoUrl(id, server),
    javsub: () => getJavsubVideoUrl(id, server),
    javtiful: () => getJavtifulVideoUrl(id),
    phimxyz: () => getPhimxyzVideoUrl(id),
    subjav: () => getSubjavVideoUrl(id)
  };
  const result = await (handlers[source] || (() => null))();
  if (!result) return res.status(404).json({ error: 'Video not found' });
  res.json(result);
});

app.get('/api/stats', (req, res) => {
  const s = {}; ALL_SOURCES.forEach(k => s[k] = (moviesData[k]||[]).length);
  s.total = (moviesData.all||[]).length; s.updated = moviesData.updated || 'unknown';
  res.json(s);
});

app.get('/api/admin/check-update', async (req, res) => {
  try { await checkForUpdates(); res.json({ status: 'done', lastCheck, checkCount, total: (moviesData.all||[]).length, ...Object.fromEntries(ALL_SOURCES.map(k => [k, (moviesData[k]||[]).length])) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/status', (req, res) => {
  res.json({ lastCheck, checkCount, total: (moviesData.all||[]).length, ...Object.fromEntries(ALL_SOURCES.map(k => [k, (moviesData[k]||[]).length])), updated: moviesData.updated });
});

app.get('/api/admin/autodiscover', async (req, res) => {
  const { source } = req.query;
  if (!source || !['javhdz', 'subjav', 'phimxyz'].includes(source)) {
    return res.status(400).json({ error: 'Valid source parameter is required (javhdz, subjav, phimxyz)' });
  }
  try {
    const newDomain = await autodiscoverDomain(source);
    res.json({
      status: 'completed',
      source,
      newDomain: newDomain || 'none',
      currentDomain: domains[source]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ HLS PROXY ============
app.get('/api/proxy/hls', async (req, res) => {
  const { url } = req.query; if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    let referer = `https://${domains.javhdz}/`;
    if (url.match(/(byzamlan|streamforester|zabitcdn|streamqq|playheovl)/i)) {
      referer = 'https://javsub.blog/';
    } else if (url.match(/subjav/i)) {
      referer = `https://${domains.subjav}/`;
    } else if (url.match(/(helvid|upload18)/i)) {
      referer = 'https://upload18.org/';
    } else if (url.match(/tiktokcdn/i)) {
      referer = `https://${domains.javhdz}/`;
    }
    const response = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': referer }, responseType: 'text' });
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': response.headers['content-type'] || 'application/vnd.apple.mpegurl' });
    
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    const lines = response.data.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      let targetUrl = trimmed;
      if (!targetUrl.startsWith('http')) {
        targetUrl = baseUrl + targetUrl;
      }
      if (targetUrl.includes('.m3u8')) {
        return '/api/proxy/hls?url=' + encodeURIComponent(targetUrl);
      }
      return '/api/proxy/segment?url=' + encodeURIComponent(targetUrl);
    });
    
    res.send(lines.join('\n'));
  } catch (e) { res.status(502).json({ error: 'Proxy failed: ' + e.message }); }
});

app.get('/api/proxy/segment', async (req, res) => {
  const { url } = req.query; if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    let referer = `https://${domains.javhdz}/`;
    let targetUrl = url;
    if (url.match(/tiktokcdn/i)) {
      referer = `https://${domains.javhdz}/`;
      targetUrl = url.replace(/\.ts(\?|$)/, '.png$1');
    } else if (url.match(/ibyteimg/i)) {
      referer = 'https://subjav1.blog/';
    } else if (url.match(/(byzamlan|streamforester|zabitcdn|streamqq)/i)) {
      try {
        const urlObj = new URL(url);
        referer = urlObj.origin + '/';
      } catch (e) { referer = 'https://javsub.blog/'; }
    } else if (url.match(/subjav/i)) {
      referer = `https://${domains.subjav}/`;
    } else if (url.match(/(helvid|upload18)/i)) {
      referer = 'https://upload18.org/';
    } else if (url.match(/(dramiyos|javgiga|morencius|vidhide)/i)) {
      referer = 'https://javgiga.net/';
    } else {
      // Keep URL unchanged
      targetUrl = url;
    }
    const response = await axios.get(targetUrl, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': referer }, responseType: 'arraybuffer' });
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': response.headers['content-type'] || 'video/MP2T', 'Content-Length': response.data.length });
    res.send(response.data);
  } catch (e) { res.status(502).json({ error: 'Segment failed: ' + e.message }); }
});

app.get('/api/proxy/image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');
  try {
    let referer = 'https://google.com/';
    if (url.includes('phimxyz')) referer = `https://${domains.phimxyz}/`;
    else if (url.includes('subjav')) referer = `https://${domains.subjav}/`;
    else if (url.includes('javhdz')) referer = `https://${domains.javhdz}/`;

    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': referer },
      responseType: 'arraybuffer'
    });
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400'
    });
    res.send(response.data);
  } catch (e) {
    res.status(502).send('Image proxy failed: ' + e.message);
  }
});

function buildCleanHlsPlayerHtml(proxyUrl) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100vh;display:block;object-fit:contain}</style></head><body><video id="player" controls autoplay playsinline></video><script>var v=document.getElementById('player');if(typeof Hls!=='undefined'&&Hls.isSupported()){var h=new Hls({maxBufferLength:30});h.loadSource(${JSON.stringify(proxyUrl)});h.attachMedia(v);h.on(Hls.Events.MANIFEST_PARSED,function(){v.play().catch(function(){})});h.on(Hls.Events.ERROR,function(e,d){if(d.fatal){if(d.type===Hls.ErrorTypes.NETWORK_ERROR)h.startLoad();else if(d.type===Hls.ErrorTypes.MEDIA_ERROR)h.recoverMediaError();else h.destroy()}})}else if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=${JSON.stringify(proxyUrl)};v.play().catch(function(){})}</script></body></html>`;
}

// ============ JAVHDz EMBED ============
app.get('/api/embed/javhdz/:eid', async (req, res) => {
  const eid = req.params.eid;
  const movie = moviesData.javhdz.find(m => m.id === eid || m.code === eid);
  let code = '';
  if (movie && movie.img) {
    const match = movie.img.match(/\/data\/([A-Za-z0-9-]+?)-\d{4}-\d{2}\.jpg/i) || movie.img.match(/\/([A-Za-z0-9-]+)\.jpg/i);
    if (match) code = match[1].toLowerCase();
  }
  if (!code) code = movie?.code || eid;

  const candidateUrls = [
    `https://javgiga.net/${code}-mosaic/`,
    `https://javgiga.net/${code}/`,
    `https://javgiga.net/${code}-engsub/`,
    movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, 'javgiga.net') : null
  ].filter(Boolean);

  let iframeSrc = '';
  for (const url of candidateUrls) {
    try {
      const pageRes = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const $ = cheerio.load(pageRes.data);
      iframeSrc = $('iframe[src*="morencius"], iframe[src*="vidhide"], iframe[src*="play"]').first().attr('src') || '';
      if (iframeSrc) break;
    } catch (e) {}
  }

  let finalM3u8 = `https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-${eid}-playlist.m3u8`;

  if (iframeSrc) {
    try {
      const embedRes = await axios.get(iframeSrc, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javgiga.net/' } });
      const html = embedRes.data;
      
      const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[\s\S]*?\.split\('\|'\).*?\)/);
      if (evalMatch) {
        const pMatch = evalMatch[0].match(/}\s*\(\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']+)'/);
        if (pMatch) {
          let p = pMatch[1];
          const a = parseInt(pMatch[2]);
          let c = parseInt(pMatch[3]);
          const k = pMatch[4].split('|');
          while (c--) {
            if (k[c]) p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
          }
          const m3u8Match = p.match(/(https?:\/\/[^"'\s|]+\.m3u8[^"'\s|]*)/i);
          if (m3u8Match) {
            finalM3u8 = m3u8Match[1];
          }
        }
      }
    } catch (e) {}
  }

  const host = req.headers.host || 'phimcuatoi.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const proxyUrl = `${protocol}://${host}/api/proxy/hls?url=` + encodeURIComponent(finalM3u8);
  res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' });
  return res.send(buildCleanHlsPlayerHtml(proxyUrl));
});

// ============ JAVSub EMBED ============
app.get('/api/embed/javsub/:id', async (req, res) => {
  const movie = moviesData.javsub.find(m => m.id === req.params.id);
  const server = req.query.server || 1;
  try {
    let playUrl = '';
    if (movie && movie.embedUrls && movie.embedUrls.length > 0) {
      const idx = Math.min(Math.max(0, parseInt(server) - 1), movie.embedUrls.length - 1);
      playUrl = movie.embedUrls[idx]?.url || movie.embedUrls[0].url;
    }
    if (!playUrl) {
      const html = await fetchHtml(`https://javsub.blog/phim-sex/${req.params.id}`);
      const $ = cheerio.load(html);
      playUrl = $('button.set-player-source').first().attr('data-source');
    }
    if (!playUrl) return res.status(404).send('Player source not found');

    const cleanUrl = playUrl.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
    let m3u8Url = cleanUrl;
    if (cleanUrl.includes('/videos/') && cleanUrl.includes('/play')) {
      m3u8Url = cleanUrl.replace(/\/play\??.*/, '/master.m3u8');
    }
    const host = req.headers.host || 'phimcuatoi.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const proxyUrl = `${protocol}://${host}/api/proxy/hls?url=` + encodeURIComponent(m3u8Url);
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' });
    return res.send(buildCleanHlsPlayerHtml(proxyUrl));
  } catch (e) {
    res.status(502).send('Error loading JAVSub embed: ' + e.message);
  }
});

// ============ JavTiful EMBED ============
app.get('/api/embed/javtiful/:id', async (req, res) => {
  const id = req.params.id;
  const upperId = id ? id.toUpperCase() : id;
  try {
    const embedUrl = `https://upload18.org/play/index/${upperId}`;
    const embedRes = await axios.get(embedUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javtiful.fit/' }
    });

    let rawUrl = '';
    const match = embedRes.data.match(/"m3u8"\s*:\s*"([^"]+)"/i) || embedRes.data.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    if (match) {
      rawUrl = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
    }

    if (!rawUrl) {
      rawUrl = `https://upload18.org/playlist/${upperId}.m3u8`;
    }

    const host = req.headers.host || 'phimcuatoi.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const proxyUrl = `${protocol}://${host}/api/proxy/hls?url=` + encodeURIComponent(rawUrl);
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' });
    return res.send(buildCleanHlsPlayerHtml(proxyUrl));
  } catch (e) {
    res.status(502).send('Failed loading JavTiful player: ' + e.message);
  }
});

// ============ SubJAV EMBED ============
app.get('/api/embed/subjav/:id', async (req, res) => {
  const id = req.params.id;
  const movie = moviesData.subjav.find(m => m.id === String(id) || (m.link && m.link.includes(`/${id}/`)));
  let slug = id;
  if (movie && movie.link) {
    const match = movie.link.match(/subjav\.[a-z]+\/([^/]+)/);
    if (match) slug = match[1];
  }
  const host = req.headers.host || 'phimcuatoi.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const hlsUrl = `https://subjav1.blog/storage/m3u8/${slug}/index.m3u8`;
  const proxyUrl = `${protocol}://${host}/api/proxy/hls?url=` + encodeURIComponent(hlsUrl);
  res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' });
  return res.send(buildCleanHlsPlayerHtml(proxyUrl));
});

// ============ STATIC ============
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => { console.error('Unhandled error:', err.message); res.status(500).json({ error: 'Internal error' }); });
app.use((req, res, next) => { if (req.path.startsWith('/api/') || req.path.startsWith('/player.html')) return next(); res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// ============ AUTO UPDATE ============
function saveData() {
  try {
    moviesData.updated = new Date().toISOString();
    const all = []; ALL_SOURCES.forEach(k => { if (moviesData[k]) all.push(...moviesData[k]); });
    moviesData.all = all;
    fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2));
    return true;
  } catch (e) { console.error('Save error:', e.message); return false; }
}

let lastCheck = null;
let checkCount = 0;

async function checkNew(source, urlFn, parser) {
  const seen = new Set((moviesData[source]||[]).map(m => m.id));
  let added = 0;
  for (let p = 1; p <= 3; p++) {
    try {
      const pageUrl = urlFn(p); const res = await axios.get(pageUrl, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const items = parser(res.data, p);
      for (const item of items) {
        if (item.id && !seen.has(item.id)) {
          item.source = source;
          if (source === 'javsub') {
            try {
              const html = await fetchHtml(item.link);
              const $ = cheerio.load(html);
              const sources = [];
              $('button.set-player-source').each((i, btn) => {
                let src = $(btn).attr('data-source');
                if (src) {
                  src = src.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, '');
                  src = src.replace('e.streamqq.com', 'byzamlan.top').replace('trivonix.top', 'byzamlan.top');
                  sources.push({ url: src, label: $(btn).attr('data-cdn-name') || `Server #${i+1}` });
                }
              });
              if (sources.length > 0) {
                item.embedUrls = sources;
              }
            } catch (err) {
              console.error(`Failed to fetch JAVSub embedUrls for new movie ${item.id}:`, err.message);
            }
          }
          moviesData[source].unshift(item);
          seen.add(item.id);
          added++;
        }
      }
    } catch (e) {
      if (p === 1 && (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT' || e.message?.includes('timeout') || e.response?.status >= 500)) {
        console.log(`[AutoUpdate] Connection to ${source} failed (${e.message}). Triggering AutoDiscover...`);
        autodiscoverDomain(source).catch(err => console.error('AutoDiscover error:', err.message));
      }
    }
  }
  return added;
}

async function checkForUpdates() {
  console.log(`[AutoUpdate] Checking...`);
  const javhdzParser = (html) => {
    const $=cheerio.load(html); const items=[];
    $('.movie-item.m-block').each((i,el)=>{
      const t=$(el).find('.movie-title-1').text().trim();
      const h=$(el).attr('href');
      const m=h?h.match(/-(\d+)\.html$/):null;
      if(t&&h&&m) items.push({
        id:m[1], title:t,
        img:$(el).find('.public-film-item-thumb').attr('src')?`https://${domains.javhdz}`+$(el).find('.public-film-item-thumb').attr('src'):'',
        link:`https://${domains.javhdz}`+h, tag:$(el).find('.ribbon-sub').text().trim(),
        views:$(el).find('.ribbon-viewed').text().trim()
      });
    });
    return items;
  };

  const phimxyzParser = (html) => {
    const $=cheerio.load(html); const items=[];
    $('a[href*="/phim/"]').each((i,el)=>{
      const href=$(el).attr('href'); if(!href||!href.match(/\/phim\/(.+)$/)) return;
      const id=href.match(/\/phim\/(.+)$/)[1];
      const alt=$(el).find('img').attr('alt')||';';
      if(!alt||alt==='Nhật Bản'||alt==='Trung Quốc'||alt==='Châu Âu'||alt==='Phim Sex HD'||alt===';') return;
      const img=$(el).find('img').attr('data-src')||$(el).find('img').attr('src')||'';
      items.push({
        id, title:alt,
        img:img.startsWith('http')?img:`https://${domains.phimxyz}`+img,
        link:href.startsWith('http')?href:`https://${domains.phimxyz}`+href,
        tag:'', views:''
      });
    });
    return items;
  };

  const results = await Promise.all([
    // JAVHDz (3 categories)
    checkNew('javhdz', p => `https://${domains.javhdz}${p===1?'/category/uncensored-3/':`/category/uncensored-3/page/${p}/`}`, javhdzParser),
    checkNew('javhdz', p => `https://${domains.javhdz}${p===1?'/category/censored-2/':`/category/censored-2/page/${p}/`}`, javhdzParser),
    checkNew('javhdz', p => `https://${domains.javhdz}${p===1?'/category/beauty-4/':`/category/beauty-4/page/${p}/`}`, javhdzParser),

    // VLXX (Homepage new)
    checkNew('vlxx', p => p===1?'https://vlxx.moi/':`https://vlxx.moi/new/${p}/`, (html) => { const $=cheerio.load(html); const items=[]; $('.video-item').each((i,el)=>{const t=$(el).find('.video-name a').text().trim();const h=$(el).find('.video-name a').attr('href');const m=h?h.match(/\/video\/[^/]+\/(\d+)\//):null;if(t&&h&&m)items.push({id:m[1],title:t,img:$(el).find('.video-image').attr('data-original')||'',link:'https://vlxx.moi'+h,tag:$(el).find('.ribbon').text().trim(),views:''})}); return items; }),

    // JAVSub (Homepage feed)
    checkNew('javsub', p => p===1?'https://javsub.blog/':`https://javsub.blog/?page=${p}`, (html) => { const $=cheerio.load(html); const items=[]; $('.item').each((i,el)=>{const t=$(el).find('.item__title h4').text().trim();const h=$(el).find('.item__thumbnail').attr('href');const m=h?h.match(/phim-sex\/([^/]+)$/):null;if(t&&h&&m)items.push({id:m[1],title:t,img:$(el).find('.item__thumbnail img').attr('src')||'',link:h,tag:$(el).find('.item__labels span').map((j,sp)=>$(sp).text().trim()).get().join(', ')||'Sub',views:''})}); return items; }),

    // JavTiful (Homepage feed)
    checkNew('javtiful', p => p===1?'https://javtiful.blog/':`https://javtiful.blog/page/${p}/`, (html) => { const $=cheerio.load(html); const items=[]; $('a[href*="/video/"]').each((i,el)=>{const href=$(el).attr('href'); if(!href) return; const m=href.match(/\/video\/([^/]+)/); if(!m) return; const id=m[1]; const title=$(el).find('img').attr('alt')||$(el).text().trim()||id; const img=$(el).find('img').attr('data-src')||$(el).find('img').attr('src')||''; items.push({id,title,img,link:'https://javtiful.blog/video/'+id,tag:'',views:''})}); return items; }),

    // PhimXYZ (3 categories)
    checkNew('phimxyz', p => p===1?`https://${domains.phimxyz}/the-loai/jav`:`https://${domains.phimxyz}/the-loai/jav?page=${p}`, phimxyzParser),
    checkNew('phimxyz', p => p===1?`https://${domains.phimxyz}/the-loai/phim-sex-viet-sub`:`https://${domains.phimxyz}/the-loai/phim-sex-viet-sub?page=${p}`, phimxyzParser),
    checkNew('phimxyz', p => p===1?`https://${domains.phimxyz}/the-loai/khong-che`:`https://${domains.phimxyz}/the-loai/khong-che?page=${p}`, phimxyzParser),

    // SubJAV (TikTok Shorts + 3 categories of normal videos)
    checkNew('subjav', p => `https://${domains.subjav}/wp-json/tiktok/v1/videos/grid?page=${p}&limit=24`, (data) => {
      const items = [];
      const videos = data.videos || [];
      videos.forEach(v => {
        if (v.id) {
          items.push({
            id: String(v.id),
            title: v.title || ('Phim ' + v.id),
            img: v.thumbnail || '',
            link: `https://${domains.subjav}/phim-sex-viet/video/` + v.id + '/',
            tag: 'Shorts',
            views: v.like_count ? (v.like_count + ' likes') : ''
          });
        }
      });
      return items;
    }),
    checkNew('subjav', p => p === 1 ? `https://${domains.subjav}/jav-vietsub/` : `https://${domains.subjav}/jav-vietsub/page/${p}/`, (html) => {
      const $=cheerio.load(html); const items=[];
      $('.item-video').each((i,el)=>{
        const idAttr=$(el).attr('id')||''; const match=idAttr.match(/post-(\d+)/); if(!match) return;
        const id=match[1]; const a=$(el).find('a').last(); const href=a.attr('href')||'';
        const title=$(el).find('img').attr('alt')||a.text().trim(); const img=$(el).find('img').attr('src')||'';
        if(id&&href) items.push({ id: String(id), title: title||('Phim '+id), img: img||'', link: href, tag: 'Vietsub', views: '' });
      });
      return items;
    }),
    checkNew('subjav', p => p === 1 ? `https://${domains.subjav}/jav-khong-che/` : `https://${domains.subjav}/jav-khong-che/page/${p}/`, (html) => {
      const $=cheerio.load(html); const items=[];
      $('.item-video').each((i,el)=>{
        const idAttr=$(el).attr('id')||''; const match=idAttr.match(/post-(\d+)/); if(!match) return;
        const id=match[1]; const a=$(el).find('a').last(); const href=a.attr('href')||'';
        const title=$(el).find('img').attr('alt')||a.text().trim(); const img=$(el).find('img').attr('src')||'';
        if(id&&href) items.push({ id: String(id), title: title||('Phim '+id), img: img||'', link: href, tag: 'Không Che', views: '' });
      });
      return items;
    }),
    checkNew('subjav', p => p === 1 ? `https://${domains.subjav}/phim-sex-trung-quoc/` : `https://${domains.subjav}/phim-sex-trung-quoc/page/${p}/`, (html) => {
      const $=cheerio.load(html); const items=[];
      $('.item-video').each((i,el)=>{
        const idAttr=$(el).attr('id')||''; const match=idAttr.match(/post-(\d+)/); if(!match) return;
        const id=match[1]; const a=$(el).find('a').last(); const href=a.attr('href')||'';
        const title=$(el).find('img').attr('alt')||a.text().trim(); const img=$(el).find('img').attr('src')||'';
        if(id&&href) items.push({ id: String(id), title: title||('Phim '+id), img: img||'', link: href, tag: 'Trung Quốc', views: '' });
      });
      return items;
    }),
  ]);
  const totalAdded = results.reduce((a,b)=>a+b,0);
  if (totalAdded > 0) { saveData(); console.log(`[AutoUpdate] Added ${totalAdded}`); }
  else { console.log(`[AutoUpdate] No new movies`); }
  lastCheck = new Date().toISOString(); checkCount++;
}

if (require.main === module) {
  const UPDATE_INTERVAL = 24 * 60 * 60 * 1000;
  setInterval(() => { checkForUpdates().catch(e => console.error('[AutoUpdate] Error:', e.message)); }, UPDATE_INTERVAL);
  setTimeout(() => { checkForUpdates().catch(e => console.error('[AutoUpdate] Error:', e.message)); }, 2 * 60 * 1000);

  const server = app.listen(PORT, () => {
    console.log(`=== PHIM TONG HOP (5 SOURCES) ===`);
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Movies: ${(moviesData.all||[]).length} total`);
    ALL_SOURCES.forEach(k => console.log(`  ${k}: ${(moviesData[k]||[]).length}`));
    console.log(`Auto-update: every 24h`);
  });

  process.on('SIGINT', () => { console.log('Shutting down...'); server.close(() => process.exit(0)); });
  process.on('SIGTERM', () => { console.log('Shutting down...'); server.close(() => process.exit(0)); });
}

app.get('/player.html', (req, res) => {
  try {
    const playerHtmlPath = path.join(__dirname, 'public', 'player.html');
    const html = fs.readFileSync(playerHtmlPath, 'utf-8');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.send(html);
  } catch (e) {
    res.status(500).send('Player loading error: ' + e.message);
  }
});

app.checkForUpdates = checkForUpdates;
module.exports = app;

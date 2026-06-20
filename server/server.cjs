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

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});
const PORT = process.env.PORT || 3001;
const DATA_FILE = fs.existsSync(path.join(__dirname, 'movies.json'))
  ? path.join(__dirname, 'movies.json')
  : path.join(process.cwd(), 'server', 'movies.json');

const ALL_SOURCES = ['javhdz','vlxx','javsub','javtiful','phimxyz'];

let moviesData = {};
ALL_SOURCES.forEach(k => moviesData[k] = []);
moviesData.all = [];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      ALL_SOURCES.forEach(k => { if (!moviesData[k]) moviesData[k] = []; });
      console.log(`Loaded ${(moviesData.all||[]).length} movies`);
    }
  } catch (e) { console.error('Load error:', e.message); }
}
loadData();

// ============ JAVHDz ============
async function getJavhdzVideoUrl(id) {
  const movie = moviesData.javhdz.find(m => m.id === id);
  if (!movie) return null;
  const page = await axios.get(movie.link, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(() => null);
  if (!page) return null;
  const match = page.data.match(/window\.atob\(["']([^"']+)["']\)/);
  if (match) {
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
    return { videoUrl: decoded, type: 'hls' };
  }
  return null;
}

// ============ VLXX ============
async function getVlxxVideoUrl(id, server = 1) {
  try {
    const res = await axios.post('https://vlxx.moi/ajax.php', `vlxx_server=1&id=${id}&server=${server}`, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest', 'Referer': 'https://vlxx.moi/' }, timeout: 15000 });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    if (data.player) {
      const $ = cheerio.load(data.player);
      const iframeUrl = $('iframe').first().attr('src');
      if (iframeUrl) {
        // Fetch the iframe html to extract the direct stream URL
        const iframeRes = await axios.get(iframeUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://vlxx.moi/' }, timeout: 15000 });
        const match = iframeRes.data.match(/window\.__SRC\s*=\s*([^;]+);/);
        if (match) {
          const srcData = JSON.parse(match[1]);
          if (srcData && srcData[0] && srcData[0].file) {
            return { videoUrl: srcData[0].file, type: 'hls' };
          }
        }
        // Fallback to iframe if extraction fails
        return { url: iframeUrl, type: 'iframe' };
      }
    }
    return { error: 'No player data' };
  } catch (e) { return null; }
}

// ============ JAVSub ============
async function getJavsubVideoUrl(id) {
  // First: check for pre-cached embed URLs in movies.json
  const movie = moviesData.javsub.find(m => m.id === id);
  if (movie && movie.embedUrls && movie.embedUrls.length > 0) {
    return { sources: movie.embedUrls, type: 'iframe' };
  }

  // Fallback: try to fetch at runtime (works on local/residential IPs, may fail on cloud)
  try {
    const html = await fetchHtml(`https://javsub.blog/phim-sex/${id}`);
    const $ = cheerio.load(html);
    const sources = [];
    $('button.set-player-source').each((i, btn) => {
      let src = $(btn).attr('data-source');
      if (src) { src = src.replace(/&adTag=[^&]*/g, '').replace(/\?adTag=[^&]*/g, ''); sources.push({ url: src, label: $(btn).attr('data-cdn-name') || `Server #${i+1}` }); }
    });
    if (sources.length > 0) {
      return { sources, type: 'iframe' };
    }
    // No sources found - return original URL for new-tab fallback
    return { sources: [], url: `https://javsub.blog/phim-sex/${id}`, type: 'iframe', fallback: true };
  } catch (e) {
    return { sources: [], url: `https://javsub.blog/phim-sex/${id}`, type: 'iframe', fallback: true };
  }
}

// ============ JavTiful ============
async function getJavtifulVideoUrl(id) {
  const movie = moviesData.javtiful.find(m => m.id === id);
  if (!movie) return null;
  try {
    const res = await axios.get(movie.link, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const iframe = $('iframe').first().attr('src');
    return { url: iframe || `https://upload18.org/play/index/${id}`, type: 'iframe' };
  } catch (e) { return { url: `https://upload18.org/play/index/${id}`, type: 'iframe' }; }
}

// ============ PhimXYZ ============
async function getPhimxyzVideoUrl(id) {
  const movie = moviesData.phimxyz.find(m => m.id === id);
  if (!movie) return null;
  try {
    const res = await axios.get(movie.link, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const match = res.data.match(/data-link=["']([^"']+)["']/);
    if (match) {
      const p = match[1];
      return { videoUrl: p.startsWith('http') ? p.replace(/^http:/i, 'https:') : 'https://i.phimxyz.blog' + p, type: 'hls' };
    }
    return null;
  } catch (e) { return null; }
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

app.get('/api/movies', (req, res) => {
  const { source, search, page = 1, limit = 50 } = req.query;
  let list = moviesData.all || [];
  if (source && source !== 'all') list = list.filter(m => m.source === source);
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
  const handlers = { javhdz: () => getJavhdzVideoUrl(id), vlxx: () => getVlxxVideoUrl(id, server), javsub: () => getJavsubVideoUrl(id), javtiful: () => getJavtifulVideoUrl(id), phimxyz: () => getPhimxyzVideoUrl(id) };
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

// ============ HLS PROXY ============
app.get('/api/proxy/hls', async (req, res) => {
  const { url } = req.query; if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const response = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javhdz.mobi/' }, responseType: 'text' });
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': response.headers['content-type'] || 'application/vnd.apple.mpegurl' });
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    let data = response.data.replace(/^([a-zA-Z0-9_\-\.]+\.(m3u8|ts|vtt))/gm, m => baseUrl + m).replace(/\.png/g, '.ts').replace(/(https:\/\/p16-ad-sg\.tiktokcdn\.com[^\s]+\.ts)/g, m => '/api/proxy/segment?url=' + encodeURIComponent(m)).replace(/(https:\/\/sf16-sg\.tiktokcdn\.top[^\s]+\.m3u8)/g, m => '/api/proxy/hls?url=' + encodeURIComponent(m));
    res.send(data);
  } catch (e) { res.status(502).json({ error: 'Proxy failed: ' + e.message }); }
});

app.get('/api/proxy/segment', async (req, res) => {
  const { url } = req.query; if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const response = await axios.get(url.replace(/\.ts$/, '.png'), { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javhdz.mobi/' }, responseType: 'arraybuffer' });
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'video/MP2T', 'Content-Length': response.data.length });
    res.send(response.data);
  } catch (e) { res.status(502).json({ error: 'Segment failed: ' + e.message }); }
});

// ============ JAVHDz EMBED ============
app.get('/api/embed/javhdz/:eid', async (req, res) => {
  const movie = moviesData.javhdz.find(m => m.id === req.params.eid);
  if (!movie) return res.status(404).send('Not found');
  try {
    const page = await axios.get(movie.link, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const atobMatch = page.data.match(/window\.atob\(["']([^"']+)["']\)/);
    const videoUrl = atobMatch ? Buffer.from(atobMatch[1], 'base64').toString('utf-8') : '';
    const proxyUrl = '/api/proxy/hls?url=' + encodeURIComponent(videoUrl);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100vh;display:block}</style></head><body><video id="player" controls autoplay poster="https://javhdz.mobi/jwplayer/loading.jpg"></video><script>var v=document.getElementById('player');if(Hls.isSupported()){var h=new Hls({maxBufferLength:30});h.loadSource(${JSON.stringify(proxyUrl)});h.attachMedia(v);h.on(Hls.Events.MANIFEST_PARSED,function(){v.play()})}else if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=${JSON.stringify(proxyUrl)};v.play()}</script></body></html>`;
    res.send(html);
  } catch (e) { res.status(502).send('Failed'); }
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
    all.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
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
      for (const item of items) { if (item.id && !seen.has(item.id)) { item.source = source; moviesData[source].push(item); seen.add(item.id); added++; } }
    } catch (e) {}
  }
  return added;
}

async function checkForUpdates() {
  console.log(`[AutoUpdate] Checking...`);
  const results = await Promise.all([
    checkNew('javhdz', p => `https://javhdz.mobi${p===1?'/category/uncensored-3/':`/category/uncensored-3/page/${p}/`}`, (html) => { const $=cheerio.load(html); const items=[]; $('.movie-item.m-block').each((i,el)=>{const t=$(el).find('.movie-title-1').text().trim();const h=$(el).attr('href');const m=h?h.match(/-(\d+)\.html$/):null;if(t&&h&&m)items.push({id:m[1],title:t,img:$(el).find('.public-film-item-thumb').attr('src')?'https://javhdz.mobi'+$(el).find('.public-film-item-thumb').attr('src'):'',link:'https://javhdz.mobi'+h,tag:$(el).find('.ribbon-sub').text().trim(),views:$(el).find('.ribbon-viewed').text().trim()})}); return items; }),
    checkNew('vlxx', p => p===1?'https://vlxx.moi/':`https://vlxx.moi/new/${p}/`, (html) => { const $=cheerio.load(html); const items=[]; $('.video-item').each((i,el)=>{const t=$(el).find('.video-name a').text().trim();const h=$(el).find('.video-name a').attr('href');const m=h?h.match(/\/video\/[^/]+\/(\d+)\//):null;if(t&&h&&m)items.push({id:m[1],title:t,img:$(el).find('.video-image').attr('data-original')||'',link:'https://vlxx.moi'+h,tag:$(el).find('.ribbon').text().trim(),views:''})}); return items; }),
    checkNew('javsub', p => p===1?'https://javsub.blog/':`https://javsub.blog/?page=${p}`, (html) => { const $=cheerio.load(html); const items=[]; $('.item').each((i,el)=>{const t=$(el).find('.item__title h4').text().trim();const h=$(el).find('.item__thumbnail').attr('href');const m=h?h.match(/phim-sex\/([^/]+)$/):null;if(t&&h&&m)items.push({id:m[1],title:t,img:$(el).find('.item__thumbnail img').attr('src')||'',link:h,tag:$(el).find('.item__labels span').map((j,sp)=>$(sp).text().trim()).get().join(', ')||'Sub',views:''})}); return items; }),
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

module.exports = app;

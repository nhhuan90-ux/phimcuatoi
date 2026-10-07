const fs = require('fs');

let serverFile = fs.readFileSync('server/server.cjs', 'utf-8');

const javhdzRegex = /app\.get\('\/api\/embed\/javhdz\/:eid'.*?return res\.send\(buildCleanHlsPlayerHtml\(proxyUrl\)\);\n\}\);/s;
const javsubRegex = /app\.get\('\/api\/embed\/javsub\/:id'.*?res\.status\(502\)\.send\('Error loading JAVSub embed: ' \+ e\.message\);\n  \}\n\}\);/s;
const javtifulRegex = /app\.get\('\/api\/embed\/javtiful\/:id'.*?res\.status\(502\)\.send\('Failed loading JavTiful player: ' \+ e\.message\);\n  \}\n\}\);/s;

// NEW JAVHDZ
const newJavhdz = `app.get('/api/embed/javhdz/:eid', async (req, res) => {
  const eid = req.params.eid;
  const movie = moviesData.javhdz.find(m => m.id === eid || m.code === eid);
  let code = '';
  if (movie && movie.img) {
    const match = movie.img.match(/\\/data\\/([A-Za-z0-9-]+?)-\\d{4}-\\d{2}\\.jpg/i) || movie.img.match(/\\/([A-Za-z0-9-]+)\\.jpg/i);
    if (match) code = match[1].toLowerCase();
  }
  if (!code) code = movie?.code || eid;

  const candidateUrls = [
    \`https://javgiga.net/\${code}-mosaic/\`,
    \`https://javgiga.net/\${code}/\`,
    \`https://javgiga.net/\${code}-engsub/\`,
    movie?.link ? movie.link.replace(/javhdz\\.[a-z]+/gi, 'javgiga.net') : null
  ].filter(Boolean);

  let iframeSrc = '';
  for (const url of candidateUrls) {
    try {
      const pageRes = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const cheerio = require('cheerio');
      const $ = cheerio.load(pageRes.data);
      iframeSrc = $('iframe[src*="morencius"], iframe[src*="vidhide"], iframe[src*="play"]').first().attr('src') || '';
      if (iframeSrc) break;
    } catch (e) {}
  }

  const host = req.headers.host || 'phimcuatoi.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  let finalM3u8 = \`https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-\${eid}-playlist.m3u8\`;

  if (iframeSrc) {
    try {
      const embedRes = await axios.get(iframeSrc, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javgiga.net/' } });
      const html = embedRes.data;
      
      const evalMatch = html.match(/eval\\(function\\(p,a,c,k,e,[\\s\\S]*?\\.split\\('\\|'\\).*?\\)/);
      if (evalMatch) {
        const pMatch = evalMatch[0].match(/}\\s*\\(\\s*'((?:\\\\'|[^'])*)'\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*'([^']+)'/);
        if (pMatch) {
          let p = pMatch[1];
          const a = parseInt(pMatch[2]);
          let c = parseInt(pMatch[3]);
          const k = pMatch[4].split('|');
          while (c--) {
            if (k[c]) p = p.replace(new RegExp('\\\\b' + c.toString(a) + '\\\\b', 'g'), k[c]);
          }
          const m3u8Match = p.match(/(https?:\\/\\/[^"'\\s|]+\\.m3u8[^"'\\s|]*)/i);
          if (m3u8Match) {
            finalM3u8 = m3u8Match[1];
          }
        }
      } else {
        const directMatch = html.match(/(https?:\\/\\/[^"'\\s|]+\\.m3u8[^"'\\s|]*)/i);
        if (directMatch) finalM3u8 = directMatch[1];
      }
    } catch (e) {}
  }

  const proxyUrl = \`\${protocol}://\${host}/api/proxy/hls?url=\` + encodeURIComponent(finalM3u8);
  res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' });
  return res.send(buildCleanHlsPlayerHtml(proxyUrl));
});`;

// NEW JAVSUB
const newJavsub = `// ============ JAVSub EMBED ============
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
      const html = await fetchHtml(\`https://javsub.blog/phim-sex/\${req.params.id}\`);
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      playUrl = $('button.set-player-source').first().attr('data-source');
    }
    if (!playUrl) return res.status(404).send('Player source not found');

    const cleanUrl = playUrl.replace(/&adTag=[^&]*/g, '').replace(/\\?adTag=[^&]*/g, '');
    let m3u8Url = cleanUrl;
    if (cleanUrl.includes('/videos/') && cleanUrl.includes('/play')) {
      m3u8Url = cleanUrl.replace(/\\/play\\??.*/, '/master.m3u8');
    }
    
    // We already have the m3u8 URL! We don't need to fetch Streamforester HTML.
    const host = req.headers.host || 'phimcuatoi.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const proxyUrl = \`\${protocol}://\${host}/api/proxy/hls?url=\` + encodeURIComponent(m3u8Url);
    
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' });
    return res.send(buildCleanHlsPlayerHtml(proxyUrl));
  } catch (e) {
    res.status(502).send('Error loading JAVSub embed: ' + e.message);
  }
});`;

// NEW JAVTIFUL
const newJavtiful = `// ============ JavTiful EMBED ============
app.get('/api/embed/javtiful/:id', async (req, res) => {
  const id = req.params.id;
  const upperId = id ? id.toUpperCase() : id;
  try {
    const embedUrl = \`https://upload18.org/play/index/\${upperId}\`;
    const embedRes = await axios.get(embedUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javtiful.fit/' }
    });

    let rawUrl = '';
    const match = embedRes.data.match(/"m3u8"\\s*:\\s*"([^"]+)"/i) || embedRes.data.match(/(https?:\\/\\/[^"'\\s]+\\.m3u8[^"'\\s]*)/i);
    if (match) {
      rawUrl = match[1].replace(/\\\\/g, '').replace(/u0026/g, '&');
    }

    if (!rawUrl) {
      // Fallback
      rawUrl = \`https://upload18.org/playlist/\${upperId}.m3u8\`;
    }

    const host = req.headers.host || 'phimcuatoi.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const proxyUrl = \`\${protocol}://\${host}/api/proxy/hls?url=\` + encodeURIComponent(rawUrl);
    res.set({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html; charset=utf-8' });
    return res.send(buildCleanHlsPlayerHtml(proxyUrl));
  } catch (e) {
    res.status(502).send('Failed loading JavTiful player: ' + e.message);
  }
});`;

serverFile = serverFile.replace(javhdzRegex, newJavhdz);
serverFile = serverFile.replace(javsubRegex, newJavsub);
serverFile = serverFile.replace(javtifulRegex, newJavtiful);

fs.writeFileSync('server/server.cjs', serverFile);
console.log('Updated server.cjs successfully.');

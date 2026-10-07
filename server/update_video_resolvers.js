const fs = require('fs');
let code = fs.readFileSync('server/server.cjs', 'utf-8');

const newHdz = `// ============ JAVHDz ============
async function getJavhdzVideoUrl(id) {
  const movie = moviesData.javhdz.find(m => m.id === id || m.code === id);
  let code = '';
  if (movie && movie.img) {
    const match = movie.img.match(/\\/data\\/([A-Za-z0-9-]+?)-\\d{4}-\\d{2}\\.jpg/i) || movie.img.match(/\\/([A-Za-z0-9-]+)\\.jpg/i);
    if (match) code = match[1].toLowerCase();
  }
  if (!code) code = movie?.code || id;

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

  let finalM3u8 = \`https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-\${id}-playlist.m3u8\`;

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
          while (c--) if (k[c]) p = p.replace(new RegExp('\\\\b' + c.toString(a) + '\\\\b', 'g'), k[c]);
          const m3u8Match = p.match(/(https?:\\/\\/[^"'\\s|]+\\.m3u8[^"'\\s|]*)/i);
          if (m3u8Match) finalM3u8 = m3u8Match[1];
        }
      }
    } catch (e) {}
  }

  return { videoUrl: finalM3u8, type: 'hls' };
}`;

const newSub = `// ============ JAVSub ============
async function getJavsubVideoUrl(id, server = 1) {
  const movie = moviesData.javsub.find(m => m.id === id);
  try {
    let playUrl = '';
    if (movie && movie.embedUrls && movie.embedUrls.length > 0) {
      const idx = Math.min(Math.max(0, parseInt(server) - 1), movie.embedUrls.length - 1);
      playUrl = movie.embedUrls[idx]?.url || movie.embedUrls[0].url;
    }
    if (!playUrl) {
      const html = await fetchHtml(\`https://javsub.blog/phim-sex/\${id}\`);
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      playUrl = $('button.set-player-source').first().attr('data-source');
    }
    if (!playUrl) return null;

    const cleanUrl = playUrl.replace(/&adTag=[^&]*/g, '').replace(/\\?adTag=[^&]*/g, '');
    let m3u8Url = cleanUrl;
    if (cleanUrl.includes('/videos/') && cleanUrl.includes('/play')) {
      m3u8Url = cleanUrl.replace(/\\/play\\??.*/, '/master.m3u8');
    }
    return { videoUrl: m3u8Url, type: 'hls' };
  } catch (e) {
    return null;
  }
}`;

const newTif = `// ============ JavTiful ============
async function getJavtifulVideoUrl(id) {
  const movie = moviesData.javtiful.find(m => m.id === id);
  const code = movie?.code || id;
  const upperId = code ? code.toUpperCase() : code;
  try {
    const embedUrl = \`https://upload18.org/play/index/\${upperId}\`;
    const embedRes = await axios.get(embedUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' }
    });
    
    let rawUrl = '';
    const match = embedRes.data.match(/"m3u8"\\s*:\\s*"([^"]+)"/i) || embedRes.data.match(/(https?:\\/\\/[^"'\\s]+\\.m3u8[^"'\\s]*)/i);
    if (match) {
      rawUrl = match[1].replace(/\\\\/g, '').replace(/u0026/g, '&');
    }
    if (!rawUrl) rawUrl = \`https://upload18.org/playlist/\${upperId}.m3u8\`;
    
    return { videoUrl: rawUrl, type: 'hls' };
  } catch (e) {
    return null;
  }
}`;

const newSubjav = `// ============ SubJAV ============
async function getSubjavVideoUrl(id) {
  const movie = moviesData.subjav.find(m => m.id === String(id) || (m.link && m.link.includes(\`/\${id}/\`)));
  let slug = id;
  if (movie && movie.link) {
    const match = movie.link.match(/subjav\\.[a-z]+\\/([^/]+)/);
    if (match) slug = match[1];
  }
  const hlsUrl = \`https://subjav1.blog/storage/m3u8/\${slug}/index.m3u8\`;
  return { videoUrl: hlsUrl, type: 'hls' };
}`;

code = code.replace(/\/\/ ============ JAVHDz ============\nasync function getJavhdzVideoUrl[\s\S]*?\}\n/g, newHdz + '\n');
code = code.replace(/\/\/ ============ JAVSub ============\nfunction getJavsubVideoUrl[\s\S]*?\}\n/g, newSub + '\n');
code = code.replace(/\/\/ ============ JavTiful ============\nasync function getJavtifulVideoUrl[\s\S]*?\}\n/g, newTif + '\n');
code = code.replace(/\/\/ ============ SubJAV ============\nasync function getSubjavVideoUrl[\s\S]*?\}\n/g, newSubjav + '\n');

fs.writeFileSync('server/server.cjs', code);
console.log('Done replacing getXVideoUrl');

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
  if (!iframeSrc) return null;
  return { url: iframeSrc, type: 'iframe' };
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
      const link = movie?.link || \`https://\${domains.javsub || 'javsub.xyz'}/phim-sex/\${id}\`;
      const html = await fetchHtml(link);
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      playUrl = $('button.set-player-source').first().attr('data-source');
    }
    if (!playUrl) return null;
    return { url: playUrl, type: 'iframe' };
  } catch (e) {
    return null;
  }
}`;

const newTif = `// ============ JavTiful ============
async function getJavtifulVideoUrl(id) {
  const movie = moviesData.javtiful.find(m => m.id === id);
  const code = movie?.code || id;
  const upperId = code ? code.toUpperCase() : code;
  return { url: \`https://upload18.org/play/index/\${upperId}\`, type: 'iframe' };
}`;

const newSubjav = `// ============ SubJAV ============
async function getSubjavVideoUrl(id) {
  const movie = moviesData.subjav.find(m => m.id === String(id) || (m.link && m.link.includes(\`/\${id}/\`)));
  let slug = id;
  if (movie && movie.link) {
    const match = movie.link.match(/subjav\\.[a-z]+\\/([^/]+)/);
    if (match) slug = match[1];
  }
  return { url: \`https://subjav1.blog/play/\${slug}\`, type: 'iframe' };
}`;

code = code.replace(/\/\/ ============ JAVHDz ============\nasync function getJavhdzVideoUrl[\s\S]*?\}\n/g, newHdz + '\n');
code = code.replace(/\/\/ ============ JAVSub ============\nasync function getJavsubVideoUrl[\s\S]*?\}\n/g, newSub + '\n');
code = code.replace(/\/\/ ============ JavTiful ============\nasync function getJavtifulVideoUrl[\s\S]*?\}\n/g, newTif + '\n');
code = code.replace(/\/\/ ============ SubJAV ============\nasync function getSubjavVideoUrl[\s\S]*?\}\n/g, newSubjav + '\n');

fs.writeFileSync('server/server.cjs', code);
console.log('Done reverting to pure direct iframe embeds');

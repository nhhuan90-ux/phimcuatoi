const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testCleanPlayers() {
  console.log('=== TESTING 4 CLEAN NATIVE HLS / EMBED GENERATORS ===\n');

  // 1. JAVHDZ (4003)
  console.log('--- 1. JAVHDZ ---');
  try {
    const movie = moviesData.javhdz.find(m => m.id === '4003');
    const link = movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, domains.javhdz) : `https://${domains.javhdz}/chi-gai-4003.html`;
    const res = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const match = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (match) {
      const videoUrl = Buffer.from(match[1], 'base64').toString('utf-8');
      console.log('  [SUCCESS JAVHDZ] HLS Stream URL:', videoUrl);
    }
  } catch (e) { console.error('  JAVHDZ err:', e.message); }

  // 2. JAVTIFUL (FC2-PPV-4966033)
  console.log('\n--- 2. JAVTIFUL ---');
  try {
    const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
    const res = await axios.get(embedUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
    const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
    if (match) {
      const rawUrl = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
      console.log('  [SUCCESS JAVTIFUL] Extracted Native HLS:', rawUrl);
    }
  } catch (e) { console.error('  JAVTIFUL err:', e.message); }

  // 3. JAVSUB
  console.log('\n--- 3. JAVSUB ---');
  try {
    const movie = moviesData.javsub[0];
    const playUrl = movie.embedUrls[0].url;
    console.log('  Raw playUrl:', playUrl);
    let m3u8Url = playUrl;
    if (playUrl.includes('/videos/') && playUrl.includes('/play')) {
      m3u8Url = playUrl.replace(/\/play\??.*/, '/master.m3u8');
    }
    console.log('  [SUCCESS JAVSUB] Master m3u8:', m3u8Url);
  } catch (e) { console.error('  JAVSUB err:', e.message); }

  // 4. SUBJAV (36019)
  console.log('\n--- 4. SUBJAV CLEAN HTML PARSING ---');
  try {
    const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
    const res = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    
    // Extract player section and necessary head links
    const headScripts = $('head script, head link[rel="stylesheet"]').map((i, el) => $.html(el)).get().join('\n');
    const playerHtml = $('#video, .videoWrapper, .entry-content').first().html() || $('#video').html();
    const footerScripts = $('footer script, body > script').map((i, el) => $.html(el)).get().join('\n');
    
    console.log('  [SUCCESS SUBJAV] Head tags count:', headScripts.length);
    console.log('  [SUCCESS SUBJAV] Player HTML snippet:', playerHtml?.slice(0, 150));
  } catch (e) { console.error('  SUBJAV err:', e.message); }
}

testCleanPlayers();

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testAll4DeepFixes() {
  console.log('=== TESTING DEEP FIXES FOR ALL 4 SOURCES ===\n');

  // 1. JAVHDZ
  console.log('--- 1. JAVHDZ ---');
  try {
    const movie = moviesData.javhdz[0];
    const link = movie.link ? movie.link.replace(/javhdz\.[a-z]+/gi, domains.javhdz) : `https://${domains.javhdz}/chi-gai-${movie.id}.html`;
    const res = await axios.get(link, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const match = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (match) {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
      console.log('  [SUCCESS JAVHDZ] HLS Stream URL:', decoded);
    } else {
      console.log('  [FAIL JAVHDZ] No window.atob match');
    }
  } catch (e) { console.error('  JAVHDZ err:', e.message); }

  // 2. JAVSUB (Error 232011 fix)
  console.log('\n--- 2. JAVSUB ---');
  try {
    const movie = moviesData.javsub[0];
    const playUrl = movie.embedUrls[0].url;
    const res = await axios.get(playUrl, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' } });
    console.log('  JAVSUB Player HTML status:', res.status, 'Length:', res.data.length);

    // Extract m3u8 or source inside streamforester HTML
    const m3u8Match = res.data.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    console.log('  JAVSUB m3u8 found in player HTML:', m3u8Match ? m3u8Match[1] : 'NONE');
  } catch (e) { console.error('  JAVSUB err:', e.message); }

  // 3. JAVTIFUL (Anti-framing bypass)
  console.log('\n--- 3. JAVTIFUL ---');
  try {
    const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
    const res = await axios.get(embedUrl, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
    let html = res.data;
    html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false')
               .replace(/window\.self\s*!==\s*window\.top/g, 'false')
               .replace(/top\.location/g, 'self.location');
    console.log('  [SUCCESS JAVTIFUL] Unframed HTML Length:', html.length);
  } catch (e) { console.error('  JAVTIFUL err:', e.message); }

  // 4. SUBJAV (JWPlayer source extraction)
  console.log('\n--- 4. SUBJAV ---');
  try {
    const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
    const res = await axios.get(link, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const scriptText = $('script').map((i, el) => $(el).html()).get().join('\n');
    const sourceMatch = scriptText.match(/file\s*:\s*["']([^"']+)["']/i) || res.data.match(/(https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*)/i);
    console.log('  [SUBJAV Stream Match]:', sourceMatch ? sourceMatch[1] : 'NONE');
  } catch (e) { console.error('  SUBJAV err:', e.message); }
}

testAll4DeepFixes();

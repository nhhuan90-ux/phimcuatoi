const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testDirectResolversFinal() {
  console.log('=== TESTING DIRECT RESOLVERS FINAL ===\n');

  // 1. JAVHDZ
  console.log('--- 1. JAVHDZ ---');
  try {
    const movie = moviesData.javhdz.find(m => m.id === '4003');
    const link = movie?.link ? movie.link.replace(/javhdz\.[a-z]+/gi, domains.javhdz) : `https://${domains.javhdz}/chi-gai-4003.html`;
    const res = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const match = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    const videoUrl = match ? Buffer.from(match[1], 'base64').toString('utf-8') : '';
    console.log('  JAVHDZ HLS URL:', videoUrl);
  } catch (e) { console.error('  JAVHDZ err:', e.message); }

  // 2. JAVSUB
  console.log('\n--- 2. JAVSUB ---');
  try {
    const movie = moviesData.javsub[0];
    console.log('  JAVSUB Embed URL:', movie.embedUrls?.[0]?.url);
  } catch (e) { console.error('  JAVSUB err:', e.message); }

  // 3. JAVTIFUL
  console.log('\n--- 3. JAVTIFUL ---');
  try {
    const id = 'fc2-ppv-4966033';
    const upperId = id.toUpperCase();
    console.log('  JavTiful Direct Embed URL:', `https://upload18.org/play/index/${upperId}`);
  } catch (e) { console.error('  JAVTIFUL err:', e.message); }

  // 4. SUBJAV
  console.log('\n--- 4. SUBJAV ---');
  try {
    const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
    const res = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const iframeSrc = $('iframe').attr('src') || $('#video iframe').attr('src');
    console.log('  SubJAV page link:', link);
    console.log('  SubJAV iframe found:', iframeSrc || 'No iframe, using direct page link');
  } catch (e) { console.error('  SUBJAV err:', e.message); }
}

testDirectResolversFinal();

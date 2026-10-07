const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function diagnoseAll4() {
  console.log('=== DIAGNOSING ALL 4 SOURCES LOCAL & LIVE ===');
  console.log('Active domains:', domains);

  // 1. JAVHDZ (4003)
  console.log('\n--- 1. JAVHDZ (ID: 4003) ---');
  try {
    const link = `https://${domains.javhdz}/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html`;
    const res = await axios.get(link, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('  Page status:', res.status, 'Length:', res.data.length);
    const match = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (match) {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
      console.log('  Decoded HLS:', decoded);
    } else {
      console.log('  No window.atob found!');
    }
  } catch (e) {
    console.error('  JAVHDZ error:', e.message);
  }

  // 2. JAVSUB (co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do)
  console.log('\n--- 2. JAVSUB ---');
  try {
    const javsubMovie = moviesData.javsub[0];
    console.log('  Testing movie ID:', javsubMovie.id);
    console.log('  Embed URLs:', javsubMovie.embedUrls);
  } catch (e) {
    console.error('  JAVSUB error:', e.message);
  }

  // 3. JAVTIFUL (FC2-PPV-4966033)
  console.log('\n--- 3. JAVTIFUL ---');
  try {
    const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
    const res = await axios.get(embedUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
    console.log('  Upload18 status:', res.status, 'Length:', res.data.length);
    const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
    console.log('  m3u8 match:', match ? match[1].slice(0, 100) : 'NONE');
  } catch (e) {
    console.error('  JAVTIFUL error:', e.message);
  }

  // 4. SUBJAV (36019)
  console.log('\n--- 4. SUBJAV ---');
  try {
    const subjavLink = 'https://subjav.bike/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/';
    const res = await axios.get(subjavLink, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('  subjav.bike status:', res.status, 'Length:', res.data.length);
  } catch (e) {
    console.error('  SUBJAV error:', e.message);
  }
}

diagnoseAll4();

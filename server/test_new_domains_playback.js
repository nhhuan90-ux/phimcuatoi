const axios = require('axios');
const cheerio = require('cheerio');

async function testNewDomainsPlayback() {
  console.log('=== TESTING NEW ACTIVE DOMAINS PLAYBACK ===\n');

  // 1. JAVHDZ on javhdz.com
  console.log('--- 1. JAVHDZ (javhdz.com) ---');
  try {
    const res = await axios.get('https://javhdz.com/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html', {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log('  Page status:', res.status, 'Length:', res.data.length);
    const match = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (match) {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
      console.log('  [SUCCESS JAVHDZ] Extracted HLS stream URL:', decoded);
    } else {
      console.log('  [FAIL JAVHDZ] window.atob not found');
    }
  } catch (e) {
    console.error('  JAVHDZ err:', e.message);
  }

  // 2. SUBJAV on subjav1.blog
  console.log('\n--- 2. SUBJAV (subjav1.blog) ---');
  try {
    const res = await axios.get('https://subjav1.blog/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/', {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log('  Page status:', res.status, 'Length:', res.data.length);
    const $ = cheerio.load(res.data);
    const videoDiv = $('#video').html();
    console.log('  [SUCCESS SUBJAV] Video container found:', videoDiv ? 'YES' : 'NO');
  } catch (e) {
    console.error('  SUBJAV err:', e.message);
  }
}

testNewDomainsPlayback();

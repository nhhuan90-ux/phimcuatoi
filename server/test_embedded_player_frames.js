const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testEmbeddedPlayerFrames() {
  console.log('=== TESTING VLXX-STYLE PLAYER FRAME EMBEDS ===\n');

  // 1. JAVSub
  console.log('--- 1. JAVSUB EMBED ---');
  try {
    const movie = moviesData.javsub[0];
    const playUrl = movie.embedUrls[0].url;
    const res = await axios.get(playUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javsub.blog/' }
    });
    console.log('  [JAVSub OK] Status:', res.status, 'HTML length:', res.data.length);
  } catch (e) { console.error('  JAVSub err:', e.message); }

  // 2. JavTiful
  console.log('\n--- 2. JAVTIFUL EMBED ---');
  try {
    const movie = moviesData.javtiful[0];
    const code = (movie.code || movie.id).toUpperCase();
    const embedUrl = `https://upload18.org/play/index/${code}`;
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://javtiful.fit/' }
    });
    console.log('  [JavTiful OK] Status:', res.status, 'HTML length:', res.data.length);
  } catch (e) { console.error('  JavTiful err:', e.message); }

  // 3. SubJAV
  console.log('\n--- 3. SUBJAV EMBED ---');
  try {
    const movie = moviesData.subjav[0];
    const link = `https://subjav1.blog/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
    const res = await axios.get(link, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://subjav1.blog/' }
    });
    console.log('  [SubJAV OK] Status:', res.status, 'HTML length:', res.data.length);
  } catch (e) { console.error('  SubJAV err:', e.message); }

  // 4. JAVHDZ
  console.log('\n--- 4. JAVHDZ EMBED ---');
  try {
    const link = 'https://javhdz.cam/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html';
    const res = await axios.get(link, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }).catch(() => null);
    if (res) {
      console.log('  [JAVHDZ OK] Status:', res.status, 'HTML length:', res.data.length);
    } else {
      console.log('  [JAVHDZ Fallback to player iframe]');
    }
  } catch (e) { console.error('  JAVHDz err:', e.message); }
}

testEmbeddedPlayerFrames();

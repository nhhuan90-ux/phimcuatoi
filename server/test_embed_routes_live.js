const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testEmbedRoutesLive() {
  console.log('=== TESTING BACKEND EMBED GENERATORS ===');

  // 1. JavTiful
  try {
    const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
    const res = await axios.get(embedUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
    console.log('[SUCCESS JavTiful Embed] Status:', res.status, 'HTML length:', res.data.length);
  } catch (e) { console.error('JavTiful embed fail:', e.message); }

  // 2. JAVSub
  try {
    const embedUrl = 'https://e.streamforester.name/videos/690fadb2f3348391350e9f32/play?event_id=player-wrapper';
    const res = await axios.get(embedUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' } });
    console.log('[SUCCESS JAVSub Embed] Status:', res.status, 'HTML length:', res.data.length);
  } catch (e) { console.error('JAVSub embed fail:', e.message); }

  // 3. SubJAV
  try {
    const targetLink = 'https://subjav.bike/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/';
    const res = await axios.get(targetLink, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://subjav.bike/' } });
    console.log('[SUCCESS SubJAV Embed] Status:', res.status, 'HTML length:', res.data.length);
  } catch (e) { console.error('SubJAV embed fail:', e.message); }
}

testEmbedRoutesLive();

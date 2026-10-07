const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));

async function testAll4NativeHls() {
  console.log('=== TESTING ALL 4 SOURCES WITH NATIVE HLS STREAMS ===\n');

  // 1. JAVHDz
  console.log('--- 1. JAVHDZ ---');
  try {
    const javhdzUrl = 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-4003-playlist.m3u8';
    const res = await axios.get(javhdzUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javhdz.cam/' } });
    console.log('  [JAVHDz SUCCESS] HLS Status:', res.status, 'Body snippet:', res.data.split('\n')[0]);
  } catch (e) { console.error('  JAVHDz err:', e.message); }

  // 2. SubJAV
  console.log('\n--- 2. SUBJAV ---');
  try {
    const subjavUrl = 'https://subjav1.blog/storage/m3u8/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/index.m3u8';
    const res = await axios.get(subjavUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('  [SubJAV SUCCESS] HLS Status:', res.status, 'Body snippet:', res.data.split('\n')[0]);
  } catch (e) { console.error('  SubJAV err:', e.message); }

  // 3. JAVSub
  console.log('\n--- 3. JAVSUB ---');
  try {
    const movie = moviesData.javsub[0];
    const playUrl = movie.embedUrls[0].url;
    const match = playUrl.match(/\/videos\/([a-f0-9]+)\//i);
    if (match) {
      const hash = match[1];
      const m3u8Url = `https://e.streamforester.name/videos/${hash}/master.m3u8`;
      const res = await axios.get(m3u8Url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' } });
      console.log('  [JAVSub SUCCESS] HLS Status:', res.status, 'Body snippet:\n', res.data);
    } else {
      console.log('  JAVSub video hash not matched');
    }
  } catch (e) { console.error('  JAVSub err:', e.message); }

  // 4. JavTiful
  console.log('\n--- 4. JAVTIFUL ---');
  try {
    const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
    const res = await axios.get(embedUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
    const match = res.data.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i) || res.data.match(/"m3u8"\s*:\s*"([^"]+)"/i);
    if (match) {
      const m3u8Url = match[1].replace(/\\/g, '');
      console.log('  Found JavTiful m3u8 URL:', m3u8Url);
      const m3u8Res = await axios.get(m3u8Url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://upload18.org/' } });
      console.log('  [JavTiful SUCCESS] HLS Status:', m3u8Res.status, 'Body snippet:', m3u8Res.data.split('\n')[0]);
    } else {
      console.log('  JavTiful m3u8 regex not matched');
    }
  } catch (e) { console.error('  JavTiful err:', e.message); }
}

testAll4NativeHls();

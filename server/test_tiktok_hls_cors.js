const axios = require('axios');

async function testTiktokHlsCors() {
  const url = 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-4003-playlist.m3u8';
  console.log('=== TESTING TIKTOK HLS DIRECT CORS HEADERS ===');
  try {
    const res = await axios.options(url, { headers: { 'Origin': 'https://phimcuatoi.vercel.app' } });
    console.log('OPTIONS status:', res.status, 'Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  } catch (e) {
    console.log('OPTIONS error:', e.message);
  }

  try {
    const res2 = await axios.get(url, { headers: { 'Origin': 'https://phimcuatoi.vercel.app' } });
    console.log('GET status:', res2.status, 'Access-Control-Allow-Origin:', res2.headers['access-control-allow-origin']);
  } catch (e) {
    console.log('GET error:', e.message);
  }
}

testTiktokHlsCors();

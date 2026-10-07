const axios = require('axios');

async function testProxySubPlaylist() {
  console.log('=== TESTING SUB-PLAYLIST HLS PROXY FOR JAVHDZ ON LIVE VERCEL ===');
  const subPlaylistUrl = 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-4003-480.m3u8';
  const proxyUrl = `https://phimcuatoi.vercel.app/api/proxy/hls?url=${encodeURIComponent(subPlaylistUrl)}`;

  try {
    const res = await axios.get(proxyUrl, { timeout: 10000 });
    console.log('Sub-playlist Proxy HLS Status:', res.status);
    console.log('Sub-playlist Body snippet:\n', res.data.slice(0, 500));
  } catch (e) {
    console.error('Sub-playlist Proxy HLS FAIL:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status, 'Data:', e.response.data);
    }
  }
}

testProxySubPlaylist();

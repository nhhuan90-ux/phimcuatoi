const axios = require('axios');

async function testProxyHlsLive() {
  console.log('=== TESTING HLS PROXY FOR JAVHDZ ON LIVE VERCEL ===');
  const targetUrl = 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/ec8840e153d6ef49205e6506a6fb6f704003/javhd-4003-playlist.m3u8';
  const proxyUrl = `https://phimcuatoi.vercel.app/api/proxy/hls?url=${encodeURIComponent(targetUrl)}`;

  try {
    const res = await axios.get(proxyUrl, { timeout: 10000 });
    console.log('Proxy HLS Status:', res.status);
    console.log('Proxy HLS Content-Type:', res.headers['content-type']);
    console.log('Proxy HLS Body:\n', res.data);
  } catch (e) {
    console.error('Proxy HLS FAIL:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status, 'Data:', e.response.data);
    }
  }
}

testProxyHlsLive();

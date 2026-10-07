const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testJavhdzProxyRewrite() {
  const masterUrl = 'https://p16-sg.tiktokcdn.top/ad-site-i18n-sg/1521468d906e1ee54179d7c7ac02f1634002/javhd-4002-playlist.m3u8';
  console.log('Fetching master playlist:', masterUrl);
  try {
    const res = await axios.get(masterUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://javhdz.cam/' }
    });
    console.log('Original Master Playlist Content:\n', res.data);

    const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);

    // Apply regex rewrite
    let data = res.data.replace(/^([a-zA-Z0-9_\-\.]+\.(m3u8|ts|vtt))/gm, m => baseUrl + m);
    data = data.replace(/(https:\/\/(?:[a-zA-Z0-9.-]+)\.tiktokcdn\.(?:top|com)[^\s]+\.m3u8)/g, m => '/api/proxy/hls?url=' + encodeURIComponent(m));
    data = data.replace(/(https:\/\/(?:[a-zA-Z0-9.-]+)\.tiktokcdn\.(?:top|com)[^\s]+\.(ts|vtt))/g, m => '/api/proxy/segment?url=' + encodeURIComponent(m));

    console.log('\n--- REWRITTEN MASTER PLAYLIST FOR BROWSER ---');
    console.log(data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJavhdzProxyRewrite();

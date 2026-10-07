const axios = require('axios');

async function debugJavhdz502() {
  const url = 'https://phimcuatoi.vercel.app/api/proxy/hls?url=https%3A%2F%2Fp16-sg.tiktokcdn.top%2Fad-site-i18n-sg%2Fec8840e153d6ef49205e6506a6fb6f704003%2Fjavhd-4003-playlist.m3u8';
  console.log('=== DEBUGGING JAVHDZ 502 ERROR ===');

  try {
    const res = await axios.get(url);
    console.log('Status:', res.status, 'Body:\n', res.data);
  } catch (e) {
    console.error('Error message:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status, 'Data:', e.response.data);
    }
  }
}

debugJavhdz502();

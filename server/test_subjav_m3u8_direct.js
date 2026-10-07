const axios = require('axios');

async function testSubjavM3u8Direct() {
  const m3u8Url = 'https://subjav1.blog/storage/m3u8/anh-trai-so-huong-du-em-gai-vu-to-luc-nua-dem/index.m3u8';
  console.log('=== TESTING SUBJAV DIRECT M3U8 FETCH ===');

  try {
    const res = await axios.get(m3u8Url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://subjav1.blog/'
      }
    });
    console.log('Status:', res.status, 'Content-Type:', res.headers['content-type']);
    console.log('M3U8 Body:\n', res.data);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSubjavM3u8Direct();

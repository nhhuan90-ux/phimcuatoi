const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testHelvidStreamFixed() {
  const embedUrl = 'https://upload18.org/play/index/mgold-054';
  try {
    const res = await axios.get(embedUrl, { headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.blog/' } });
    const match = res.data.match(/"m3u8"\s*:\s*"([^"]+)"/);
    if (match) {
      const m3u8Url = match[1].replace(/\\/g, '').replace(/u0026/g, '&');
      console.log('Fixed m3u8Url:', m3u8Url);

      // Test fetching m3u8 stream
      const streamRes = await axios.get(m3u8Url, {
        headers: { 'User-Agent': UA, 'Referer': 'https://upload18.org/' }
      });
      console.log('[SUCCESS] helvid.com m3u8 Status:', streamRes.status, 'Length:', streamRes.data.length);
      console.log('m3u8 Playlist Content Snippet:\n', streamRes.data.slice(0, 300));
    } else {
      console.log('No m3u8 match in upload18 response.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testHelvidStreamFixed();

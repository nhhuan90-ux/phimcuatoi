const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testAutolikerEmbed() {
  const embedUrl = 'https://autolikerapp.net/videos/embed/hunt-951-stream-sb-e93da39b';
  try {
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://javtiful.blog/' }
    });
    console.log('Autoliker Embed Status:', res.status, 'Length:', res.data.length);
    const match = res.data.match(/(https?:[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    console.log('m3u8 in autoliker embed:', match ? match[1] : 'none');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testAutolikerEmbed();

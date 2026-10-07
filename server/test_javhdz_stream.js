const axios = require('axios');

async function testJavhdzStream() {
  const streamUrl = 'https://sf16-sg.tiktokcdn.top/stream/26ff36915e24749c442e5e4337c458f9/javhd-3920-playlist.m3u8';
  console.log('Testing JAVHDz stream URL:', streamUrl);

  try {
    const res = await axios.get(streamUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://javhdz.red/'
      }
    });
    console.log('Playlist Status:', res.status);
    console.log('Playlist Content Snippet:', res.data.slice(0, 300));
  } catch (e) {
    console.error('Playlist Fetch Error:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status);
    }
  }
}

testJavhdzStream();

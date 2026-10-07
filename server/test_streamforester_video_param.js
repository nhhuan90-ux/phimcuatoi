const axios = require('axios');

async function testStreamforesterVideoParam() {
  console.log('=== TESTING STREAMFORESTER VIDEO PARAM INJECTION ===');
  const basePlayUrl = 'https://e.streamforester.name/videos/690fadb2f3348391350e9f32/play?event_id=player-wrapper';
  const masterM3u8 = 'https://e.streamforester.name/videos/690fadb2f3348391350e9f32/master.m3u8';
  const proxiedM3u8 = '/api/proxy/hls?url=' + encodeURIComponent(masterM3u8);

  const fullUrl = `${basePlayUrl}&video=${encodeURIComponent(proxiedM3u8)}`;
  console.log('Full iframe target URL:', fullUrl);

  try {
    const res = await axios.get(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javsub.blog/' }
    });
    console.log('Response Status:', res.status, 'HTML Length:', res.data.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testStreamforesterVideoParam();

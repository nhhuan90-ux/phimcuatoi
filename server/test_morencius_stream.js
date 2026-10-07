const axios = require('axios');

async function testMorenciusStream() {
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';

  try {
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const match = res.data.match(/sources\s*:\s*\[\s*{\s*file\s*:\s*["']([^"']+)["']/i) || res.data.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    console.log('Stream match:', match ? match[1] : 'NONE');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testMorenciusStream();

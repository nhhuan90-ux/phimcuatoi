const axios = require('axios');

async function testEmbedJavhdzLive() {
  console.log('=== TESTING LIVE JAVHDZ EMBED RESPONSE ===');
  const url = 'https://phimcuatoi.vercel.app/api/embed/javhdz/4003';

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers['content-type']);
    console.log('Body:\n', res.data);
  } catch (e) {
    console.error('Error:', e.message);
    if (e.response) {
      console.log('Status:', e.response.status, 'Data:', e.response.data);
    }
  }
}

testEmbedJavhdzLive();

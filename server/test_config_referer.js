const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testConfigWithJavsubReferer() {
  const configUrl = 'https://e.streamforester.name/videos/690854634daac3b7ce088f72/config?d=javsub.blog';
  try {
    const res = await axios.post(configUrl, {}, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://javsub.blog/',
        'Origin': 'https://javsub.blog',
        'Content-Type': 'application/json'
      }
    });
    console.log('[SUCCESS] Config POST status:', res.status);
    console.log('Config Data:', res.data);
  } catch (e) {
    console.error('Config POST Error:', e.message, 'Status:', e.response?.status);
  }
}

testConfigWithJavsubReferer();

const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testStreamforesterConfig() {
  const configUrl = 'https://e.streamforester.name/videos/690854634daac3b7ce088f72/config?d=javsub.blog';
  try {
    const res = await axios.post(configUrl, {}, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://e.streamforester.name/videos/690854634daac3b7ce088f72/play?event_id=player-wrapper',
        'Origin': 'https://e.streamforester.name',
        'Content-Type': 'application/json'
      }
    });
    console.log('[SUCCESS] Config POST Status:', res.status);
    console.log('Config Data:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('Config POST Error:', e.message, 'Status:', e.response?.status);
    if (e.response) {
      console.log('Response data:', e.response.data);
    }
  }
}

testStreamforesterConfig();

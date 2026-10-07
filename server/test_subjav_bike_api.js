const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testSubjavBikeApis(id) {
  console.log(`=== TESTING SUBJAV.BIKE APIS FOR ID: ${id} ===`);

  // Test TikTok API
  try {
    const url1 = `https://subjav.bike/wp-json/tiktok/v1/videos/${id}`;
    const res1 = await axios.get(url1, { headers: { 'User-Agent': UA } });
    console.log('[SUCCESS] TikTok API status:', res1.status);
    console.log('  Data:', JSON.stringify(res1.data).slice(0, 300));
  } catch (e) {
    console.error('TikTok API error:', e.message);
  }

  // Test Coixx Player API
  try {
    const url2 = `https://subjav.bike/wp-json/coixx/v1/player/?id=${id}&server=1`;
    const res2 = await axios.get(url2, { headers: { 'User-Agent': UA } });
    console.log('[SUCCESS] Coixx API status:', res2.status);
    console.log('  Data:', JSON.stringify(res2.data).slice(0, 300));
  } catch (e) {
    console.error('Coixx API error:', e.message);
  }
}

testSubjavBikeApis('36125');

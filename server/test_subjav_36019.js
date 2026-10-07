const axios = require('axios');

async function testSubjav36019() {
  console.log('=== TESTING SUBJAV MOVIE ID 36019 ON LIVE VERCEL ===');
  try {
    const res1 = await axios.get('https://phimcuatoi.vercel.app/api/movie/subjav/36019');
    console.log('Movie API status:', res1.status, 'Title:', res1.data.title);
  } catch (e) {
    console.error('Movie API error:', e.message);
  }

  try {
    const res2 = await axios.get('https://phimcuatoi.vercel.app/api/video/subjav/36019');
    console.log('Video API status:', res2.status, 'Data:', res2.data);
  } catch (e) {
    console.error('Video API error:', e.message);
  }
}

testSubjav36019();

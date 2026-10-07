const axios = require('axios');
async function testApi() {
  try {
    const res = await axios.get('https://phimcuatoi.vercel.app/api/video/javhdz/4003', { timeout: 10000 });
    console.log('Response:', res.data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testApi();

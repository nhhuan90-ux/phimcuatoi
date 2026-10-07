const axios = require('axios');

async function testLiveJavhdzApi() {
  console.log('=== TESTING LIVE JAVHDZ API ON VERCEL ===');

  try {
    const res = await axios.get(`https://phimcuatoi.vercel.app/api/video/javhdz/4003?_t=${Date.now()}`);
    console.log('API Status:', res.status, 'Data:', res.data);

    if (res.data.url) {
      const embedUrl = `https://phimcuatoi.vercel.app${res.data.url}`;
      console.log(`Fetching embed URL: ${embedUrl}`);
      const embedRes = await axios.get(embedUrl);
      console.log('Embed Status:', embedRes.status, 'HTML length:', embedRes.data.length);
    }
  } catch (e) {
    console.error('Error:', e.message);
    if (e.response) console.log('Status:', e.response.status, 'Data:', e.response.data);
  }
}

testLiveJavhdzApi();

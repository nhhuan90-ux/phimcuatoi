const axios = require('axios');

async function testPlayerHtmlLive() {
  console.log('=== TESTING PLAYER.HTML ON LIVE VERCEL ===');
  try {
    const res = await axios.get('https://phimcuatoi.vercel.app/player.html', { timeout: 8000 });
    console.log('Status:', res.status, 'Length:', res.data.length);
    console.log('Snippet:', res.data.slice(0, 300));
  } catch (e) {
    console.error('Error fetching player.html:', e.message);
    if (e.response) {
      console.log('Response Status:', e.response.status, 'Data:', e.response.data);
    }
  }
}

testPlayerHtmlLive();

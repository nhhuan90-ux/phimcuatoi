const axios = require('axios');

async function testPlayerHtmlAfterFix() {
  console.log('=== TESTING PLAYER.HTML CONTENT AFTER FIX ===');
  try {
    const res = await axios.get('https://phimcuatoi.vercel.app/player.html?source=javhdz&id=4003', { timeout: 10000 });
    console.log('Status:', res.status, 'Length:', res.data.length);
    console.log('Is Player HTML Script inside:', res.data.includes('loadVideo') || res.data.includes('playerContainer'));
    console.log('Title in HTML:', res.data.match(/<title>(.*?)<\/title>/)?.[1]);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testPlayerHtmlAfterFix();

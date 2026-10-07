const axios = require('axios');

async function testMorenciusEmbed() {
  console.log('=== TESTING MORENCIUS EMBED ===');
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';

  try {
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('Status:', res.status, 'Length:', res.data.length);
    console.log('Body snippet:\n', res.data.slice(0, 500));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testMorenciusEmbed();

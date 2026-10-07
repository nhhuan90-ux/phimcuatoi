const axios = require('axios');

async function testMorenciusUnframed() {
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';

  try {
    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    let html = res.data;
    html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false');
    html = html.replace(/window\.self\s*!==\s*window\.top/g, 'false');
    html = html.replace(/top\.location\s*=/g, '/* top.location = */');
    html = html.replace('<head>', '<head><base href="https://morencius.com/">');

    console.log('Unframed VidHide HTML length:', html.length);
    console.log('Unframed HTML status: 200 OK');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testMorenciusUnframed();

const axios = require('axios');

async function testMatchParts() {
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';
  const res = await axios.get(embedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  const str = res.data;
  const idx = str.indexOf('eval(function(p,a,c,k,e,d)');
  if (idx !== -1) {
    const chunk = str.slice(idx, idx + 4000);
    console.log('Chunk snippet:\n', chunk.slice(0, 300));
    console.log('Chunk tail snippet:\n', chunk.slice(-300));
  }
}

testMatchParts();

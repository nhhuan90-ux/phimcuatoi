const axios = require('axios');

async function testPrintPacker() {
  const embedUrl = 'https://morencius.com/v/lqo4y9bjnmyo';
  const res = await axios.get(embedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const match = res.data.match(/eval\(function\(p,a,c,k,e,d\).+?\)\)/s);
  if (match) {
    console.log('Eval code end snippet:', match[0].slice(-100));
  }
}

testPrintPacker();

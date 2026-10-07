const axios = require('axios');

async function inspectJwplayerJs() {
  const url = 'https://subjav.bike/wp-content/cache/wpo-minify/1787479335/assets/wpo-minify-footer-mb-jwplayer1773544915.min.js';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  console.log('=== JWPLAYER JS CONTENTS ===');
  console.log(res.data.slice(0, 1000));
}

inspectJwplayerJs();

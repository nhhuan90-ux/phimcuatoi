const axios = require('axios');

async function inspectSingleVideoJs() {
  const url = 'https://subjav.bike/wp-content/cache/wpo-minify/1787479335/assets/wpo-minify-footer-single-video1781628532.min.js';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  console.log('=== SINGLE VIDEO JS CONTENTS ===');
  console.log(res.data);
}

inspectSingleVideoJs();

const axios = require('axios');

async function inspectSubjavBikeBody() {
  const res = await axios.get('https://subjav.bike/bi-quyet-tre-dep-cua-co-chu-quan-dam-dang/36125/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  console.log('HTML length:', res.data.length);
  const match = res.data.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (match) {
    console.log('Main content:\n', match[1].slice(0, 3000));
  } else {
    console.log('No main tag found. First 2000 chars:\n', res.data.slice(0, 2000));
  }
}

inspectSubjavBikeBody();

const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function testJavtifulEmbeds() {
  console.log('=== TESTING JAVTIFUL EMBED URL FORMATS ===');
  const urlsToTest = [
    'https://autolikerapp.net/videos/embed/kidm-361-stream-vi-94ea972b',
    'https://autolikerapp.net/videos/embed/mgold-054-stream-vi-94ea972b',
    'https://upload18.org/play/index/kidm-361',
    'https://upload18.cc/v/KIDM-361/',
    'https://upload18.cc/embed/KIDM-361',
    'https://upload18.cc/v/MGOLD-054/'
  ];

  for (const url of urlsToTest) {
    try {
      const res = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': UA,
          'Referer': 'https://javtiful.blog/'
        }
      });
      console.log(`[ALIVE] ${url} -> Status: ${res.status}, Length: ${res.data.length}`);
    } catch (e) {
      console.log(`[DEAD] ${url} -> Status: ${e.response?.status || e.message}`);
    }
  }
}

testJavtifulEmbeds();

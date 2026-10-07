const axios = require('axios');
const http = require('http');

async function testAll() {
  const sources = [
    { name: 'JAVHDz', url: 'http://localhost:3000/api/embed/javhdz/4003' },
    { name: 'JAVSub', url: 'http://localhost:3000/api/embed/javsub/co-giao-cuc-ky-nghiem-khac-nhung-gap-thang-hoc-tro-ran-an-hien-gio-thi-co-giao-bi-dit-lien-tuc' },
    { name: 'JavTiful', url: 'http://localhost:3000/api/embed/javtiful/DWD-151' }
  ];

  for (const src of sources) {
    try {
      const res = await axios.get(src.url);
      const isCleanHls = res.data.includes('hls.js');
      console.log('[' + src.name + '] Status: ' + res.status + ' | Clean HLS Player: ' + (isCleanHls ? 'YES' : 'NO'));
    } catch (e) {
      console.error('[' + src.name + '] Error: ' + e.message);
    }
  }
}

// Start server
const { exec } = require('child_process');
const server = exec('node server/server.cjs');

setTimeout(() => {
  testAll().then(() => {
    server.kill();
    process.exit(0);
  });
}, 2000);

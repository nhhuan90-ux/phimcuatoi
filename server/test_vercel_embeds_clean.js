const axios = require('axios');
async function testEmbeds() {
  const sources = [
    { name: 'JAVHDz', url: 'https://phimcuatoi.vercel.app/api/embed/javhdz/4003' },
    { name: 'JAVSub', url: 'https://phimcuatoi.vercel.app/api/embed/javsub/co-giao-cuc-ky-nghiem-khac-nhung-gap-thang-hoc-tro-ran-an-hien-gio-thi-co-giao-bi-dit-lien-tuc' },
    { name: 'JavTiful', url: 'https://phimcuatoi.vercel.app/api/embed/javtiful/DWD-151' }
  ];
  for (const src of sources) {
    try {
      const res = await axios.get(src.url, { timeout: 10000 });
      const isClean = res.data.includes('hls.js');
      console.log(`[${src.name}] Status: ${res.status} | Clean: ${isClean}`);
    } catch (e) {
      console.error(`[${src.name}] Error: ${e.message}`);
    }
  }
}
testEmbeds();

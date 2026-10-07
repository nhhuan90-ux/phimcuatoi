const axios = require('axios');

async function testImageProxy() {
  const sampleImg = 'https://subjav.st/wp-content/uploads/2026/08/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu-1-420x320.webp';
  console.log('Testing image proxy for:', sampleImg);

  const proxyUrl = 'http://localhost:3000/api/proxy/image?url=' + encodeURIComponent(sampleImg);
  console.log('Proxy URL:', proxyUrl);
}

testImageProxy();

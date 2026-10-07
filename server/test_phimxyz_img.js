const axios = require('axios');
const dns = require('dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);

const testPath = '/storage/images/thang-chau-hu-hong-hup-luon-ca-di-khi-o-ke-de-di-thi/thang-chau-hu-hong-hup-luon-ca-di-khi-o-ke-de-di-thi-410x300.jpg';

async function testImg(url, referer) {
  try {
    console.log(`Testing Img: ${url}`);
    const res = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': referer || 'https://i1.phimxyz.blog/'
      }
    });
    console.log(`  [SUCCESS] Status: ${res.status}, Type: ${res.headers['content-type']}, Length: ${res.data.length}`);
    return true;
  } catch (e) {
    console.log(`  [FAILED] Error: ${e.message}, Code: ${e.code}`);
    return false;
  }
}

async function run() {
  await testImg(`https://i1.phimxyz.blog${testPath}`);
  await testImg(`http://i1.phimxyz.blog${testPath}`);
  await testImg(`https://i.phimxyz.blog${testPath}`);
  await testImg(`http://i.phimxyz.blog${testPath}`);
  await testImg(`https://phimxyz.blog${testPath}`);
  await testImg(`http://phimxyz.blog${testPath}`);
}

run();

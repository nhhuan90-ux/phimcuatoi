const axios = require('axios');
const https = require('https');

async function resolveDoH(hostname) {
  try {
    const res = await axios.get(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
      headers: { 'accept': 'application/dns-json' },
      timeout: 5000
    });
    const answers = res.data.Answer || [];
    const ips = answers.filter(a => a.type === 1).map(a => a.data);
    return ips[0] || null;
  } catch (err) {
    return null;
  }
}

async function testWithRealIp(hostname) {
  const ip = await resolveDoH(hostname);
  console.log(`DoH for ${hostname} -> IP: ${ip}`);
  if (!ip) return false;
  
  const testPath = '/storage/images/thang-chau-hu-hong-hup-luon-ca-di-khi-o-ke-de-di-thi/thang-chau-hu-hong-hup-luon-ca-di-khi-o-ke-de-di-thi-410x300.jpg';
  const url = `https://${ip}${testPath}`;
  try {
    const res = await axios.get(url, {
      timeout: 5000,
      headers: { 
        'Host': hostname,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    console.log(`  [SUCCESS] -> Status: ${res.status}, Type: ${res.headers['content-type']}`);
    return true;
  } catch (err) {
    console.log(`  [FAILED] -> Error: ${err.message}`);
    return false;
  }
}

async function run() {
  await testWithRealIp('i1.phimxyz.blog');
  await testWithRealIp('phimxyz.blog');
  await testWithRealIp('i1.phimxyz.net');
  await testWithRealIp('i1.phimxyz.org');
}

run();

const axios = require('axios');
const https = require('https');

async function resolveDoH(hostname) {
  try {
    const res = await axios.get(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
      headers: { 'accept': 'application/dns-json' },
      timeout: 8000
    });
    const answers = res.data.Answer || [];
    const ips = answers.filter(a => a.type === 1).map(a => a.data);
    console.log(`[DoH] ${hostname} ->`, ips);
    return ips[0];
  } catch (err) {
    console.log(`[DoH] ${hostname} -> Failed: ${err.message}`);
    return null;
  }
}

async function testWithRealIp(hostname, path = '/') {
  const ip = await resolveDoH(hostname);
  if (!ip) {
    console.log(`  Cannot resolve ${hostname}`);
    return;
  }
  
  const url = `https://${ip}${path}`;
  console.log(`Requesting IP direct: ${url} (Host: ${hostname})`);
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 
        'Host': hostname,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // Disable SSL certificate verification since the cert will be for hostname, not the IP address
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    console.log(`  [SUCCESS] -> Status: ${res.status}, Length: ${res.data ? res.data.length : 0}`);
    console.log(`  HTML Title:`, String(res.data).match(/<title>([^<]+)<\/title>/i)?.[1] || 'no title');
    if (path.includes('wp-json')) {
      console.log(`  JSON response:`, JSON.stringify(res.data).slice(0, 300));
    }
  } catch (err) {
    console.log(`  [FAILED] -> Message: ${err.message}, Code: ${err.code}`);
  }
}

async function run() {
  console.log('=== TESTING SUBJAV ===');
  await testWithRealIp('subjav.love', '/wp-json/tiktok/v1/videos/35151');
  
  console.log('\n=== TESTING JAVHDZ IM ===');
  await testWithRealIp('javhdz.im', '/category/uncensored-3/');
  
  console.log('\n=== TESTING JAVHDZ MOBI ===');
  await testWithRealIp('javhdz.mobi', '/category/uncensored-3/');
}

run();

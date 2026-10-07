const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

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

async function testSubjavDoH() {
  const list = ['subjav.city', 'subjav.st', 'subjav.site', 'subjav.love', 'subjav.net', 'subjav.cc', 'subjav.org', 'subjav.is', 'subjav.vip', 'subjav.top'];
  for (const d of list) {
    const ip = await resolveDoH(d);
    console.log(`DoH for ${d} -> IP: ${ip}`);
    if (ip) {
      try {
        const res = await axios.get(`https://${d}/jav-vietsub/`, {
          timeout: 4000,
          headers: { 'User-Agent': UA }
        });
        const $ = cheerio.load(res.data);
        const count = $('.item-video').length || $('article').length;
        if (res.status === 200 && count > 0) {
          console.log(`  [ALIVE SUBJAV] https://${d} -> ${count} movies!`);
          return d;
        }
      } catch (e) {
        console.log(`  [HTTPS FAIL] ${d} -> ${e.message}`);
        // Try http
        try {
          const httpRes = await axios.get(`http://${d}/jav-vietsub/`, { timeout: 4000, headers: { 'User-Agent': UA } });
          const $h = cheerio.load(httpRes.data);
          const countH = $h('.item-video').length || $h('article').length;
          if (httpRes.status === 200 && countH > 0) {
            console.log(`  [HTTP ALIVE SUBJAV] http://${d} -> ${countH} movies!`);
            return d;
          }
        } catch (err) {}
      }
    }
  }
}

testSubjavDoH();

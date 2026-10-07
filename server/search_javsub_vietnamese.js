const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function searchJavsubVietnamese() {
  console.log('=== SEARCHING FOR VIETNAMESE JAVSUB DOMAIN ===');
  const query = 'phim sex javsub';
  try {
    const res = await axios.get(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}`, {
      timeout: 8000,
      headers: { 'User-Agent': UA }
    });
    const $ = cheerio.load(res.data);
    const hosts = new Set();
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.includes('r.search.yahoo.com')) {
        const match = href.match(/\/RU=([^/]+)\/RK=/);
        if (match) href = decodeURIComponent(match[1]);
      }
      if (href.startsWith('http')) {
        try {
          const host = new URL(href).hostname.toLowerCase().replace(/^www\./, '');
          if (host.includes('javsub') && !host.includes('yahoo.com') && !host.includes('google.com')) {
            hosts.add(host);
          }
        } catch (e) {}
      }
    });
    console.log('Javsub candidate hosts:', Array.from(hosts));

    for (const host of hosts) {
      try {
        const checkRes = await axios.get(`https://${host}/`, { timeout: 4000, headers: { 'User-Agent': UA } });
        const $check = cheerio.load(checkRes.data);
        if (checkRes.status === 200 && $check('.item').length > 0) {
          console.log(`[VERIFIED VIETNAMESE JAVSUB DOMAIN] -> https://${host}`);
          return host;
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

searchJavsubVietnamese();

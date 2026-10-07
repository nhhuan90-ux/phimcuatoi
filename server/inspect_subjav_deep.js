const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function inspectSubjavDeep() {
  console.log('=== INSPECTING SUBJAV DEEP ===');
  const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
  
  try {
    const res = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('HTML Length:', res.data.length);
    
    // Look for all script tags and player containers
    const $ = cheerio.load(res.data);
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      const text = $(el).html() || '';
      if (text.includes('video') || text.includes('player') || text.includes('m3u8') || text.includes('iframe') || text.includes('atob')) {
        console.log(`Script #${i} (src: ${src}):`, text.slice(0, 300));
      }
    });

    // Check WordPress REST API for SubJAV video 36019
    console.log('\n--- Checking SubJAV REST API ---');
    const apiRes = await axios.get(`https://${domains.subjav}/wp-json/tiktok/v1/videos/36019`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }).catch(e => ({ error: e.message }));
    console.log('API Response:', apiRes.data);
  } catch (e) {
    console.error('SubJAV error:', e.message);
  }
}

inspectSubjavDeep();

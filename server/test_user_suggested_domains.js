const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function testUserDomains() {
  console.log('=== TESTING USER SUGGESTED DOMAINS ===');

  // Test javhdz.cam
  try {
    const res = await axios.get('https://javhdz.cam/category/uncensored-3/', { timeout: 5000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const count = $('.movie-item.m-block').length;
    console.log(`[JAVHDz] https://javhdz.cam Status: ${res.status}, Movies count: ${count}`);
  } catch (e) {
    console.log(`[JAVHDz] https://javhdz.cam Error: ${e.message}`);
  }

  // Test javtiful.com
  try {
    const res = await axios.get('https://javtiful.com/', { timeout: 5000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(res.data);
    const count = $('a[href*="/video/"]').length;
    console.log(`[JavTiful] https://javtiful.com Status: ${res.status}, Movies count: ${count}`);
  } catch (e) {
    console.log(`[JavTiful] https://javtiful.com Error: ${e.message}`);
  }
}

testUserDomains();

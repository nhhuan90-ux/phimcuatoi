const axios = require('axios');
const cheerio = require('cheerio');

async function testSearchCode() {
  const code = 'JUR-820';
  console.log(`=== SEARCHING FOR CODE "${code}" ON JAVGIGA.NET ===`);

  try {
    const res = await axios.get(`https://javgiga.net/?s=${encodeURIComponent(code)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    $('article a').each((i, el) => {
      console.log(`  Result #${i}:`, $(el).attr('href'), '| Title:', $(el).attr('title'));
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSearchCode();

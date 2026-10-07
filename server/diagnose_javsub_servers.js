const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function diagnoseJavsubServers() {
  console.log('=== DIAGNOSING JAVSUB SERVERS ===');
  const sample = moviesData.javsub.slice(0, 3);

  for (const m of sample) {
    console.log(`\nTesting JAVSub Movie ID: ${m.id} | Title: "${m.title}"`);
    console.log('  Embed URLs in DB:', m.embedUrls);

    // Fetch movie page on javsub
    try {
      const pageUrl = `https://${domains.javsub}/phim-sex/${m.id}`;
      const res = await axios.get(pageUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(res.data);
      const buttons = $('button.set-player-source');
      console.log(`  Found ${buttons.length} player source buttons on page:`);
      buttons.each((i, el) => {
        console.log(`    Server #${i+1}: name="${$(el).text().trim()}" data-source="${$(el).attr('data-source')}"`);
      });
    } catch (e) {
      console.error('  Page fetch error:', e.message);
    }
  }
}

diagnoseJavsubServers();

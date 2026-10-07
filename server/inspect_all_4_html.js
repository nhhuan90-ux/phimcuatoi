const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function inspectAll4Html() {
  console.log('=== INSPECTING HTML OF ALL 4 SOURCES ===\n');

  // 1. SUBJAV
  try {
    const link = `https://${domains.subjav}/nu-giup-viec-nha-san-sang-nhan-ca-nhung-yeu-cau-lam-tinh-cua-ong-chu/36019/`;
    const res = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    console.log('--- 1. SUBJAV ---');
    console.log('Iframes found:', $('iframe').map((i, el) => $(el).attr('src')).get());
    console.log('Videos found:', $('video source, video').map((i, el) => $(el).attr('src')).get());
    console.log('Data links found:', $('[data-src], [data-link], [data-url]').map((i, el) => $(el).attr('data-src') || $(el).attr('data-link') || $(el).attr('data-url')).get());
  } catch (e) { console.error('SubJAV err:', e.message); }

  // 2. JAVTIFUL
  try {
    const embedUrl = 'https://upload18.org/play/index/FC2-PPV-4966033';
    const res = await axios.get(embedUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://javtiful.fit/' } });
    console.log('\n--- 2. JAVTIFUL (upload18) ---');
    console.log('Contains sandbox check?:', res.data.includes('sandbox'));
    const scripts = res.data.match(/<script[\s\S]*?<\/script>/gi) || [];
    console.log('Script count:', scripts.length);
    scripts.forEach((s, idx) => {
      if (s.includes('sandbox') || s.includes('top') || s.includes('frame')) {
        console.log(`  Script #${idx} snippet:`, s.slice(0, 200).replace(/\n/g, ' '));
      }
    });
  } catch (e) { console.error('Javtiful err:', e.message); }

  // 3. JAVHDZ
  try {
    const link = `https://${domains.javhdz}/vo-tinh-nhin-thay-chi-dau-thu-dam----satsuki-mei-4003.html`;
    const res = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('\n--- 3. JAVHDZ ---');
    const atobMatch = res.data.match(/window\.atob\(["']([^"']+)["']\)/);
    if (atobMatch) {
      console.log('Decoded videoUrl:', Buffer.from(atobMatch[1], 'base64').toString('utf-8'));
    }
  } catch (e) { console.error('Javhdz err:', e.message); }

  // 4. JAVSUB
  try {
    const link = `https://${domains.javsub}/phim-sex/co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do`;
    const res = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    console.log('\n--- 4. JAVSUB ---');
    const sources = $('button.set-player-source').map((i, el) => $(el).attr('data-source')).get();
    console.log('JavSub player sources:', sources);
  } catch (e) { console.error('JavSub err:', e.message); }
}

inspectAll4Html();

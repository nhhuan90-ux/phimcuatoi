const fs = require('fs');
const path = require('path');

const DOMAINS_FILE = path.join(__dirname, 'domains.json');
const DATA_FILE = path.join(__dirname, 'movies.json');

const domains = JSON.parse(fs.readFileSync(DOMAINS_FILE, 'utf-8'));
const oldSubjav = domains.subjav;
domains.subjav = 'subjav.bike';

fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domains, null, 2), 'utf-8');
console.log(`[1/2] Updated domains.json: subjav set to subjav.bike (was ${oldSubjav})`);

const moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
let count = 0;
function migrateSubjav(m) {
  if (!m) return;
  if (m.img && (m.img.includes('subjav.city') || m.img.includes('subjav.st') || m.img.includes('subjav.love'))) {
    m.img = m.img.replace(/subjav\.(city|st|love|site)/g, 'subjav.bike');
    count++;
  }
  if (m.link && (m.link.includes('subjav.city') || m.link.includes('subjav.st') || m.link.includes('subjav.love'))) {
    m.link = m.link.replace(/subjav\.(city|st|love|site)/g, 'subjav.bike');
  }
}

['subjav', 'all'].forEach(k => {
  if (Array.isArray(moviesData[k])) {
    moviesData[k].forEach(migrateSubjav);
  }
});

fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2), 'utf-8');
console.log(`[2/2] Updated movies.json entries for subjav.bike (${count} items updated)`);

const fs = require('fs');
const path = require('path');

const DOMAINS_FILE = path.join(__dirname, 'domains.json');
const DATA_FILE = path.join(__dirname, 'movies.json');

const domains = JSON.parse(fs.readFileSync(DOMAINS_FILE, 'utf-8'));
const oldJavhdz = domains.javhdz;
domains.javhdz = 'javhdz.cam';

fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domains, null, 2), 'utf-8');
console.log(`[1/2] Updated domains.json: javhdz set to javhdz.cam (was ${oldJavhdz})`);

const moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
let count = 0;
function migrateJavhdz(m) {
  if (!m) return;
  if (m.img && m.img.includes(oldJavhdz)) {
    m.img = m.img.replace(oldJavhdz, 'javhdz.cam');
    count++;
  }
  if (m.link && m.link.includes(oldJavhdz)) {
    m.link = m.link.replace(oldJavhdz, 'javhdz.cam');
  }
}

['javhdz', 'all'].forEach(k => {
  if (Array.isArray(moviesData[k])) {
    moviesData[k].forEach(migrateJavhdz);
  }
});

fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2), 'utf-8');
console.log(`[2/2] Updated movies.json entries for javhdz.cam (${count} items updated)`);

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'movies.json');

async function run() {
  console.log('=== STEP 1: CLEANING DATABASE DOMAINS ===');
  if (fs.existsSync(DATA_FILE)) {
    const moviesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let countJavhdz = 0;
    let countSubjav = 0;
    let countPhimxyz = 0;

    const processList = (list) => {
      if (!list) return;
      list.forEach(m => {
        if (m.source === 'javhdz') {
          if (m.img && !m.img.includes('javhdz.red')) {
            m.img = m.img.replace(/javhdz\.[a-z]+/gi, 'javhdz.red');
            countJavhdz++;
          }
          if (m.link && !m.link.includes('javhdz.red')) {
            m.link = m.link.replace(/javhdz\.[a-z]+/gi, 'javhdz.red');
          }
        }
        if (m.source === 'subjav') {
          if (m.img && !m.img.includes('subjav.city')) {
            m.img = m.img.replace(/subjav\.[a-z]+/gi, 'subjav.city');
            countSubjav++;
          }
          if (m.link && !m.link.includes('subjav.city')) {
            m.link = m.link.replace(/subjav\.[a-z]+/gi, 'subjav.city');
          }
        }
        if (m.source === 'phimxyz') {
          if (m.img && m.img.includes('i.phimxyz.blog')) {
            m.img = m.img.replace('i.phimxyz.blog', 'i1.phimxyz.blog');
            countPhimxyz++;
          }
          if (m.link && m.link.includes('i.phimxyz.blog')) {
            m.link = m.link.replace('i.phimxyz.blog', 'i1.phimxyz.blog');
          }
        }
      });
    };

    ['javhdz', 'subjav', 'phimxyz', 'all'].forEach(k => processList(moviesData[k]));
    fs.writeFileSync(DATA_FILE, JSON.stringify(moviesData, null, 2), 'utf-8');
    console.log(`Cleaned domains in movies.json: javhdz (${countJavhdz}), subjav (${countSubjav}), phimxyz (${countPhimxyz})`);
  }

  console.log('\n=== STEP 2: FETCHING NEW MOVIES FOR ALL SOURCES ===');
  const server = require('./server.cjs');
  if (server.checkForUpdates) {
    await server.checkForUpdates();
    console.log('=== UPDATE COMPLETE ===');
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error('Error during update:', e);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, 'server.cjs'),
  path.join(__dirname, 'crawler.js')
];

function updateCodebase() {
  console.log('=== UPDATING CODEBASE DOMAINS ===');
  for (const file of filesToUpdate) {
    if (!fs.existsSync(file)) {
      console.log(`File not found: ${file}`);
      continue;
    }
    
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace JAVHDz domain
    const oldJavhdz = /javhdz\.site/g;
    const newJavhdz = 'javhdz.mobi';
    content = content.replace(oldJavhdz, newJavhdz);
    
    // Replace SubJAV domain
    const oldSubjav = /subjav\.men/g;
    const newSubjav = 'subjav.love';
    content = content.replace(oldSubjav, newSubjav);
    
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated domains in: ${file}`);
  }
}

function updateDatabase() {
  console.log('\n=== UPDATING DATABASE THUMBNAILS ===');
  const dbFile = path.join(__dirname, 'movies.json');
  if (!fs.existsSync(dbFile)) {
    console.log('movies.json not found!');
    return;
  }
  
  const moviesData = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
  
  let javhdzUpdated = 0;
  let subjavUpdated = 0;
  
  function processList(list) {
    if (!list) return;
    list.forEach(m => {
      // 1. JAVHDz domain migration
      if (m.source === 'javhdz') {
        if (m.img && m.img.includes('javhdz.site')) {
          m.img = m.img.replace('javhdz.site', 'javhdz.mobi');
          javhdzUpdated++;
        }
        if (m.link && m.link.includes('javhdz.site')) {
          m.link = m.link.replace('javhdz.site', 'javhdz.mobi');
        }
      }
      
      // 2. SubJAV domain migration
      if (m.source === 'subjav') {
        if (m.img && m.img.includes('subjav.men')) {
          m.img = m.img.replace('subjav.men', 'subjav.love');
          subjavUpdated++;
        }
        if (m.link && m.link.includes('subjav.men')) {
          m.link = m.link.replace('subjav.men', 'subjav.love');
        }
      }
    });
  }
  
  processList(moviesData.javhdz);
  processList(moviesData.subjav);
  processList(moviesData.all);
  
  console.log(`Database migration results:`);
  console.log(`  - JAVHDz records updated: ${javhdzUpdated}`);
  console.log(`  - SubJAV records updated: ${subjavUpdated}`);
  
  fs.writeFileSync(dbFile, JSON.stringify(moviesData, null, 2), 'utf-8');
  console.log('movies.json updated successfully!');
}

updateCodebase();
updateDatabase();

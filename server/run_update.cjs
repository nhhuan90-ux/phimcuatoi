const fs = require('fs');
const path = require('path');
const app = require('./server.cjs');

console.log('=== STARTING AUTO UPDATE RUNNER ===');

function exportStaticMovies() {
  try {
    const srcPath = path.join(__dirname, 'movies.json');
    const outDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    if (!fs.existsSync(srcPath)) return;

    const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    const sources = ['javhdz', 'vlxx', 'javsub', 'javtiful', 'phimxyz', 'subjav'];

    let allCombined = [];
    sources.forEach(s => {
      const list = data[s] || [];
      fs.writeFileSync(path.join(outDir, 'movies_' + s + '.json'), JSON.stringify(list));
      allCombined.push(...list.slice(0, 1000));
    });

    allCombined.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    fs.writeFileSync(path.join(outDir, 'movies_all.json'), JSON.stringify(allCombined));

    const compactFull = {};
    sources.forEach(s => { compactFull[s] = data[s] || []; });
    fs.writeFileSync(path.join(outDir, 'movies.json'), JSON.stringify(compactFull));
    console.log('✔ Static movies JSON export completed.');
  } catch (err) {
    console.error('✘ Static movies export failed:', err.message);
  }
}

async function run() {
  try {
    console.log('[1/2] Updating movies...');
    await app.checkForUpdates();
    exportStaticMovies();
    console.log('✔ Movies update completed.');
  } catch (err) {
    console.error('✘ Movies update failed:', err.message);
  }

  try {
    console.log('[2/2] Syncing Audiobooks from Google Drive...');
    const result = await app.syncDriveAudiobooks();
    console.log(`✔ Audiobooks sync completed. (${result.newChaptersCount || 0} new chapters)`);
  } catch (err) {
    console.error('✘ Audiobooks sync failed:', err.message);
  }

  console.log('=== AUTO UPDATE FINISHED ===');
  process.exit(0);
}

run();

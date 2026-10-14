const app = require('./server.cjs');

console.log('=== STARTING AUTO UPDATE RUNNER ===');

async function run() {
  try {
    console.log('[1/2] Updating movies...');
    await app.checkForUpdates();
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

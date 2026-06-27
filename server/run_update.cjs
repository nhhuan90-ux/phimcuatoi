const app = require('./server.cjs');

console.log('=== STARTING AUTO UPDATE RUNNER ===');
app.checkForUpdates()
  .then(() => {
    console.log('=== AUTO UPDATE COMPLETED ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('=== AUTO UPDATE FAILED ===', err);
    process.exit(1);
  });

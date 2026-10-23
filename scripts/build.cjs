const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('>>> [1/2] Building Vite frontend...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('>>> [2/2] Compiling Cloudflare Pages _worker.js...');
try {
  const tempDir = path.join(__dirname, '..', 'dist', '_temp_worker');
  execSync(`npx wrangler pages functions build --outdir "${tempDir}"`, { stdio: 'inherit' });
  const compiledJs = path.join(tempDir, 'index.js');
  const targetWorker = path.join(__dirname, '..', 'dist', '_worker.js');
  if (fs.existsSync(compiledJs)) {
    fs.copyFileSync(compiledJs, targetWorker);
    console.log('>>> Successfully generated dist/_worker.js!');
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch (e) {
  console.warn('>>> Warning: Could not compile _worker.js via wrangler:', e.message);
}

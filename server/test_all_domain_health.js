const axios = require('axios');
const fs = require('fs');

const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testAllDomainHealth() {
  console.log('=== CHECKING DOMAIN HEALTH FOR ALL SOURCES ===\n');

  const javhdzCandidates = ['javhdz.cam', 'javhdz.com', 'javhdz.st', 'javhdz.net'];
  for (const d of javhdzCandidates) {
    try {
      const res = await axios.get(`https://${d}/`, { timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`  JAVHDz [${d}]: Status ${res.status}, Length ${res.data.length}`);
    } catch (e) {
      console.log(`  JAVHDz [${d}]: FAIL (${e.message})`);
    }
  }

  console.log('\n--- Checking SubJAV domains ---');
  const subjavCandidates = ['subjav.bike', 'subjav1.blog', 'subjav.st', 'subjav.city'];
  for (const d of subjavCandidates) {
    try {
      const res = await axios.get(`https://${d}/`, { timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`  SubJAV [${d}]: Status ${res.status}, Length ${res.data.length}`);
    } catch (e) {
      console.log(`  SubJAV [${d}]: FAIL (${e.message})`);
    }
  }

  console.log('\n--- Checking JAVSub domains ---');
  const javsubCandidates = ['javsub.blog', 'javsub.com', 'javsub.net'];
  for (const d of javsubCandidates) {
    try {
      const res = await axios.get(`https://${d}/`, { timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`  JAVSub [${d}]: Status ${res.status}, Length ${res.data.length}`);
    } catch (e) {
      console.log(`  JAVSub [${d}]: FAIL (${e.message})`);
    }
  }

  console.log('\n--- Checking JavTiful domains ---');
  const javtifulCandidates = ['javtiful.fit', 'upload18.org', 'javtiful.com'];
  for (const d of javtifulCandidates) {
    try {
      const res = await axios.get(`https://${d}/`, { timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`  JavTiful [${d}]: Status ${res.status}, Length ${res.data.length}`);
    } catch (e) {
      console.log(`  JavTiful [${d}]: FAIL (${e.message})`);
    }
  }
}

testAllDomainHealth();

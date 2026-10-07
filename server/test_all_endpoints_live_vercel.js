const axios = require('axios');
const fs = require('fs');

const moviesData = JSON.parse(fs.readFileSync('server/movies.json', 'utf-8'));
const domains = JSON.parse(fs.readFileSync('server/domains.json', 'utf-8'));

async function testAllEndpointsLiveVercel() {
  console.log('=== DETAILED DIAGNOSTICS FOR ALL 4 SOURCES ON LIVE VERCEL ===\n');

  // 1. JAVHDZ
  console.log('--- 1. JAVHDZ ---');
  try {
    const res = await axios.get('https://phimcuatoi.vercel.app/api/video/javhdz/4003', { timeout: 10000 });
    console.log('  /api/video/javhdz/4003 status:', res.status, 'Data:', res.data);
    const embedRes = await axios.get('https://phimcuatoi.vercel.app/api/embed/javhdz/4003', { timeout: 10000 });
    console.log('  /api/embed/javhdz/4003 status:', embedRes.status, 'HTML len:', embedRes.data.length);
  } catch (e) {
    console.error('  JAVHDZ FAIL:', e.message, e.response?.status, e.response?.data);
  }

  // 2. JAVSUB
  console.log('\n--- 2. JAVSUB ---');
  try {
    const id = 'co-giao-cuc-ky-nghiem-khac-nhung-lai-khong-mac-quan-lot-roi-sau-do';
    const res = await axios.get(`https://phimcuatoi.vercel.app/api/video/javsub/${id}`, { timeout: 10000 });
    console.log('  /api/video/javsub status:', res.status, 'Data:', res.data);
    const embedRes = await axios.get(`https://phimcuatoi.vercel.app/api/embed/javsub/${id}`, { timeout: 10000 });
    console.log('  /api/embed/javsub status:', embedRes.status, 'HTML len:', embedRes.data.length);
  } catch (e) {
    console.error('  JAVSUB FAIL:', e.message, e.response?.status, e.response?.data);
  }

  // 3. JAVTIFUL
  console.log('\n--- 3. JAVTIFUL ---');
  try {
    const id = 'fc2-ppv-4966033';
    const res = await axios.get(`https://phimcuatoi.vercel.app/api/video/javtiful/${id}`, { timeout: 10000 });
    console.log('  /api/video/javtiful status:', res.status, 'Data:', res.data);
    const embedRes = await axios.get(`https://phimcuatoi.vercel.app/api/embed/javtiful/${id}`, { timeout: 10000 });
    console.log('  /api/embed/javtiful status:', embedRes.status, 'HTML len:', embedRes.data.length, 'Snippet:', embedRes.data.slice(0, 150));
  } catch (e) {
    console.error('  JAVTIFUL FAIL:', e.message, e.response?.status, e.response?.data);
  }

  // 4. SUBJAV
  console.log('\n--- 4. SUBJAV ---');
  try {
    const id = '36019';
    const res = await axios.get(`https://phimcuatoi.vercel.app/api/video/subjav/${id}`, { timeout: 10000 });
    console.log('  /api/video/subjav status:', res.status, 'Data:', res.data);
    const embedRes = await axios.get(`https://phimcuatoi.vercel.app/api/embed/subjav/${id}`, { timeout: 10000 });
    console.log('  /api/embed/subjav status:', embedRes.status, 'HTML len:', embedRes.data.length, 'Snippet:', embedRes.data.slice(0, 150));
  } catch (e) {
    console.error('  SUBJAV FAIL:', e.message, e.response?.status, e.response?.data);
  }
}

testAllEndpointsLiveVercel();

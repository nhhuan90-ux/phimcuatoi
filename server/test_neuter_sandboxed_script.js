const axios = require('axios');

async function testNeuterSandboxedScript() {
  console.log('=== TESTING NEUTERING OF SANDBOXED SCRIPT ===');
  const url = 'https://morencius.com/v/q5rkfaev9in8';

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    let html = res.data;

    console.log('Original length:', html.length);
    console.log('Contains sandboxed script:', html.includes('sandboxed.html'));

    // Neuter anti-framing sandboxed redirect script
    html = html.replace(/!function\(\)\{try\{var t=\["sandbox"[^<]+/g, '/* anti-framing script neutered */');
    html = html.replace(/\/sandboxed\.html/g, '#');
    html = html.replace(/window\.top\s*!==\s*window\.self/g, 'false');
    html = html.replace(/window\.self\s*!==\s*window\.top/g, 'false');

    console.log('Neutered length:', html.length);
    console.log('Contains sandboxed script after neutering:', html.includes('sandboxed.html'));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testNeuterSandboxedScript();

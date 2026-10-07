const axios = require('axios');

async function inspectVidhideEval() {
  const url = 'https://morencius.com/v/q5rkfaev9in8';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = res.data;

  const idx = html.indexOf('eval(function(p,a,c,k,e,d)');
  console.log('eval index:', idx);
  if (idx !== -1) {
    const chunk = html.slice(idx, idx + 2000);
    console.log('Eval chunk:\n', chunk);
  }
}

inspectVidhideEval();

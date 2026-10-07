const fs = require('fs');
let code = fs.readFileSync('server/server.cjs', 'utf-8');

// 1. Fix segment proxy
const proxySegmentOld = /\} else if \(url\.match\(\/\(helvid\|upload18\)\/i\)\) \{\n      referer = 'https:\/\/upload18\.org\/';\n    \} else \{\n      targetUrl = url\.replace\(\/\\\.ts\(\\\?\|\$\)\/, '\.png\$1'\);\n    \}/s;
const proxySegmentNew = `} else if (url.match(/(helvid|upload18)/i)) {
      referer = 'https://upload18.org/';
    } else if (url.match(/(dramiyos|javgiga|morencius|vidhide)/i)) {
      referer = 'https://javgiga.net/';
    } else {
      // Don't arbitrarily replace with .png unless we are SURE it's tiktokcdn
      // Since tiktokcdn is already caught above, we do nothing here.
      targetUrl = url;
    }`;
code = code.replace(proxySegmentOld, proxySegmentNew);

// 2. Fix getJavsubVideoUrl
const subOld = /if \(!playUrl\) \{\n      const html = await fetchHtml\(\`https:\/\/javsub\.blog\/phim-sex\/\$\{id\}\`\);\n      const cheerio = require\('cheerio'\);\n      const \$ = cheerio\.load\(html\);\n      playUrl = \$\('button\.set-player-source'\)\.first\(\)\.attr\('data-source'\);\n    \}/s;
const subNew = `if (!playUrl) {
      const link = movie?.link || \`https://\${domains.javsub || 'javsub.xyz'}/phim-sex/\${id}\`;
      const html = await fetchHtml(link);
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      playUrl = $('button.set-player-source').first().attr('data-source');
    }`;
code = code.replace(subOld, subNew);

fs.writeFileSync('server/server.cjs', code);
console.log('Fixed proxy segment and javsub url');

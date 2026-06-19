const http = require('http');
const sources = [
  { name: 'JAVHDz embed', path: '/api/embed/javhdz/3920' },
  { name: 'VLXX video', path: '/api/video/vlxx/3167?server=1' },
  { name: 'JAVSub video', path: '/api/video/javsub/nu-nhan-vien-vu-bu-co-m-vuc-day-cua-hang-vintage-bang-cach-xxx-khach?server=1' },
  { name: 'JavTiful video', path: '/api/video/javtiful/snos-231' },
  { name: 'SupJav video', path: '/api/video/supjav/394304?server=1' },
];
let done = 0;
for (const s of sources) {
  http.get('http://127.0.0.1:3000' + s.path, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => { console.log(s.name + ':', r.statusCode, d.substring(0, 120)); done++; if (done === sources.length) process.exit(0); });
  }).on('error', e => { console.log(s.name + ': ERROR ' + e.message.substring(0, 50)); done++; if (done === sources.length) process.exit(0); });
}

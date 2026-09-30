'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; " +
  "img-src 'self'; connect-src 'none'; object-src 'none'; " +
  "base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const routes = {
  '/': ['secure.html', 'text/html'],
  '/secure': ['secure.html', 'text/html'],
  '/vulnerable': ['vulnerable.html', 'text/html'],
  '/secure.js': ['secure.js', 'text/javascript'],
  '/vulnerable.js': ['vulnerable.js', 'text/javascript'],
  '/safe.js': ['safe.js', 'text/javascript'],
  '/style.css': ['style.css', 'text/css']
};
const server = http.createServer((req, res) => {
  const route = routes[new URL(req.url, 'http://localhost').pathname];
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  // Omission on this single lab page enables the controlled demonstrations.
  if (req.url.split('?')[0] !== '/vulnerable') {
    res.setHeader('Content-Security-Policy', CSP);
  }
  if (!route) { res.writeHead(404); res.end('Not found'); return; }
  res.setHeader('Content-Type', route[1] + '; charset=utf-8');
  res.end(fs.readFileSync(path.join(__dirname, 'public', route[0])));
});
if (require.main === module) {
  server.listen(3000, '127.0.0.1', () =>
    console.log('Local lab: http://127.0.0.1:3000'));
}
module.exports = { server, CSP };

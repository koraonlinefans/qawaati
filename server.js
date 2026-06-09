const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const SITE_HEADERS = {
  'fbcdn.net':      { 'Referer':'https://www.facebook.com/', 'Origin':'https://www.facebook.com' },
  'facebook.com':   { 'Referer':'https://www.facebook.com/', 'Origin':'https://www.facebook.com' },
  'tiktokcdn.com':  { 'Referer':'https://www.tiktok.com/',   'Origin':'https://www.tiktok.com'   },
  'tiktok.com':     { 'Referer':'https://www.tiktok.com/',   'Origin':'https://www.tiktok.com'   },
  'youtube.com':    { 'Referer':'https://www.youtube.com/',  'Origin':'https://www.youtube.com'  },
  'googlevideo.com':{ 'Referer':'https://www.youtube.com/',  'Origin':'https://www.youtube.com'  },
  'twitch.tv':      { 'Referer':'https://www.twitch.tv/',    'Origin':'https://www.twitch.tv'    },
};

const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getSiteHeaders(targetUrl) {
  for(const [domain, headers] of Object.entries(SITE_HEADERS)) {
    if(targetUrl.includes(domain)) return headers;
  }
  return {};
}

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript',
  '.css':'text/css',
  '.png':'image/png',
  '.ico':'image/x-icon',
  '.json':'application/json',
};

let requestCount = 0;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  if(req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Proxy
  if(pathname === '/proxy') {
    let targetUrl = parsed.query.url;
    if(!targetUrl) { res.writeHead(400); res.end('missing url'); return; }
    try { targetUrl = decodeURIComponent(targetUrl); } catch(e){}
    if(!targetUrl.startsWith('http')) { res.writeHead(400); res.end('invalid url'); return; }

    requestCount++;
    const siteHeaders = getSiteHeaders(targetUrl);
    const parsedTarget = url.parse(targetUrl);
    const isHttps = parsedTarget.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsedTarget.hostname,
      port: parsedTarget.port || (isHttps ? 443 : 80),
      path: parsedTarget.path,
      method: 'GET',
      headers: {
        'User-Agent': DEFAULT_UA,
        'Accept': '*/*',
        'Accept-Language': 'ar,en;q=0.9',
        'Host': parsedTarget.hostname,
        ...siteHeaders,
      },
      rejectUnauthorized: false,
    };

    console.log(`[#${requestCount}] → ${parsedTarget.hostname}${(parsedTarget.path||'').substring(0,60)}`);

    const proxyReq = lib.request(options, (proxyRes) => {
      if([301,302,307,308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
        const loc = proxyRes.headers.location;
        const newUrl = loc.startsWith('http') ? loc : `${parsedTarget.protocol}//${parsedTarget.hostname}${loc}`;
        res.writeHead(302, { 'Location': `/proxy?url=${encodeURIComponent(newUrl)}` });
        res.end(); return;
      }
      const respHeaders = { 'Access-Control-Allow-Origin': '*' };
      ['content-type','content-length','content-range','accept-ranges','cache-control'].forEach(h => {
        if(proxyRes.headers[h]) respHeaders[h] = proxyRes.headers[h];
      });
      res.writeHead(proxyRes.statusCode, respHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', e => { if(!res.headersSent) { res.writeHead(500); res.end(e.message); } });
    proxyReq.setTimeout(30000, () => { proxyReq.destroy(); if(!res.headersSent) { res.writeHead(504); res.end('timeout'); } });
    req.pipe(proxyReq);
    return;
  }

  // Status
  if(pathname === '/status') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ status:'ok', requests: requestCount, uptime: Math.floor(process.uptime()) }));
    return;
  }

  // Static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, 'public', filePath);

  fs.readFile(filePath, (err, data) => {
    if(err) {
      fs.readFile(path.join(__dirname, 'public', 'index.html'), (err2, data2) => {
        if(err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream'});
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n📡 قنواتي Server شغّال على http://localhost:${PORT}\n`);
});

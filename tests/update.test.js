import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=text('public/index.html');
const app=text('public/app.js');
const css=text('public/oakfolio.css');
const headers=text('public/_headers');

test('iPhone and desktop get an accessible app update button',()=>{
  assert.ok(html.includes('id="refresh-app"'));
  assert.ok(html.includes('aria-label="Get the latest Oakfolio version"'));
  assert.ok(css.includes('.app-refresh-button{'));
  assert.ok(css.includes('@media(max-width:780px)'));
});
test('app refresh busts HTML cache but retains same site, current route and local data',()=>{
  assert.ok(app.includes("if(t.id==='refresh-app'){const u=new URL(location.href);u.searchParams.set('oakfolio_refresh',String(Date.now()));location.replace(u.toString());return;}"));
  assert.ok(!app.includes('localStorage.clear()'));
  assert.ok(!app.includes('sessionStorage.clear()'));
});
test('new HTML pins release asset URLs so stale iOS code is not reused',()=>{
  for(const path of ['app.js','oakfolio.css','styles.css'])assert.ok(html.includes(path+'?release=20261103b'));
  assert.ok(html.includes('name="oakfolio-release" content="2026.11.03-update-fix"'));
});
test('Cloudflare headers revalidate app code and styles while retaining security restrictions',()=>{
  for(const path of ['/app.js','/oakfolio-experience.js','/oakfolio-rates.js','/styles.css','/oakfolio.css']){
    assert.ok(headers.includes(path+'\n  Cache-Control: no-store, max-age=0, must-revalidate'));
  }
  assert.ok(headers.includes("frame-ancestors 'none'"));
  assert.ok(headers.includes('Permissions-Policy: geolocation=(self)'));
});
test('PWA retains same-origin start URL and display standalone mode',()=>{
  const manifest=JSON.parse(text('public/manifest.webmanifest'));
  assert.equal(manifest.start_url,'/');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.short_name,'Oakfolio');
});

import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/oakfolio.css',import.meta.url),'utf8');
const base=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

test('Oakfolio wordmark and logo appear in sidebar with accessible home link',()=>{
  assert.match(html,/<a class="brand" href="#overview" aria-label="Oakfolio — home">/);
  assert.match(html,/<strong class="brand-wordmark">Oak<span>folio<\/span><\/strong>/);
  assert.match(html,/<img class="brand-icon brand-icon-image" src="icon\.svg" alt="" width="44" height="44">/);
});
test('Oakfolio logo and name stay in top header on every page',()=>{
  assert.match(html,/<a href="#overview" class="top-brand" aria-label="Oakfolio — home">/);
  assert.match(html,/<strong>Oak<span>folio<\/span><\/strong>/);
  assert.match(html,/<span class="top-page" id="crumb">Overview<\/span>/);
  assert.match(app,/\$\('#crumb'\)\.textContent=/);
  assert.equal((html.match(/id="crumb"/g)||[]).length,1);
});
test('mobile logo and route remain visible and avatar is suppressed to avoid collisions',()=>{
  assert.match(base,/@media\(max-width:780px\)/);
  assert.match(css,/@media\(max-width:780px\)/);
  assert.match(css,/\.top-brand strong\{font-size:21px\}/);
  assert.match(css,/\.top-right \.avatar\{display:none\}/);
  assert.match(css,/\.top-page\{font-size:11px;min-width:0\}/);
});
test('original navigation, security, local save, and rate services remain wired',()=>{
  for(const route of ["['discover','Find Properties'","['analyzer','Deal Analyzer'","['market','Market & Rates'","['refinance','Refinance Studio'"])assert.ok(app.includes(route));
  assert.match(html,/oakfolio\.css/);
  assert.match(html,/script type="module" src="app\.js"/);
  assert.match(html,/connect-src 'self' https:\/\/www\.bankofcanada\.ca/);
});

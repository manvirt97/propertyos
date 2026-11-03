import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderOakHome,renderExplore,renderMarket,renderRefinance,renderCoach} from '../public/oakfolio-experience.js';

test('premium dashboard includes discovery, market, refinance and coach links',()=>{
 const html=renderOakHome();
 for(const path of ['#discover','#refinance','#coach','#market','#analyzer'])assert.ok(html.includes(path),path);
 assert.ok(html.includes('REIMAGINED'));
});
test('explorer opens verified original REALTOR.ca search links',()=>{
 const html=renderExplore();
 assert.ok(html.includes('https://www.realtor.ca/ab/calgary/multi-family-homes-for-sale'));
 assert.ok(html.includes('No properties saved yet'));
 assert.ok(html.includes('opt-in')||html.includes('approximate location'));
 assert.ok(html.includes('not automatically filter'));
});
test('market panel labels rates with official series and never fabricates values',()=>{
 const html=renderMarket();
 for(const code of ['V39079','V80691311','V39053','V80691335'])assert.ok(html.includes(code));
 assert.ok(html.includes('data-rate-key="policy"'));
 assert.ok(html.includes('—'));
});
test('refinance page contains new capacity and growth models with clear caveats',()=>{
 const html=renderRefinance();
 assert.ok(html.includes('REFINANCE STUDIO'));
 assert.ok(html.includes('BORROWING POWER'));
 assert.ok(html.includes('EXPANSION PLAN'));
 assert.ok(html.includes('not mortgage eligibility'));
});
test('strategy guide is explicitly rules-based, not represented as real AI',()=>{
 const html=renderCoach();
 assert.ok(html.includes('rules-based'));
 assert.ok(html.includes('No new API subscription or secret'));
 assert.ok(html.includes('data-oak-action="copy-prompt"'));
});
test('stored hostile prospect text is escaped in the shortlist',()=>{
 const original=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>key==='oakfolio.candidates'?JSON.stringify([{id:'bad',name:'<img src=x onerror=alert(1)>',url:'https://example.com/?x="<test>',price:850000,units:3,city:'Calgary'}]):null};
 try{const html=renderExplore();assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('href="https://example.com/?x="<test>'))}
 finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original}
});
test('rebrand preserves original localStorage key and backup import compatibility',()=>{
 const source=readFileSync(new URL('../public/store.js',import.meta.url),'utf8');
 assert.ok(source.includes("const KEY='propertyos.v1.deals'"));
 assert.ok(source.includes("['PropertyOS','Oakfolio']"));
});
test('CSP permits only official rate domain outside of same-origin',()=>{
 const header=readFileSync(new URL('../public/_headers',import.meta.url),'utf8');
 assert.ok(header.includes("connect-src 'self' https://www.bankofcanada.ca"));
 assert.ok(header.includes("frame-ancestors 'none'"));
 assert.ok(header.includes('geolocation=(self)'));
});

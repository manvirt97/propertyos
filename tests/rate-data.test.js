import test from 'node:test';
import assert from 'node:assert/strict';
import {SERIES,parseValetSeries,normalizeSnapshot,isStale} from '../public/rate-data.js';
import {getOfficialSeries,buildSnapshot} from '../scripts/update-rates.mjs';
import {renderImpactCalculator,updateImpact,loadRates,renderRateWidgets,refreshRates} from '../public/oakfolio-rates.js';
import {readFileSync} from 'node:fs';

const fixture=(series,values)=>({observations:values.map(([d,v])=>({d,[series]:{v:String(v)}}))});
const seed=JSON.parse(readFileSync(new URL('../public/rates-snapshot.json',import.meta.url),'utf8'));
test('initial official observations are dated and never claim a current quote',()=>{
  const n=normalizeSnapshot(seed);
  assert.equal(n.observations.policy.rate,2.5);
  assert.equal(n.observations.policy.date,seed.observations.policy.date);
  assert.equal(n.observations.prime.rate,4.45);
  assert.equal(n.observations.posted.rate,6.19);
  assert.equal(n.observations.bond.rate,3.51);
  assert.equal(n.observations.bond.date,seed.observations.bond.date);
});
test('one missing rate does not blank other verified observations',()=>{
  const parsed=normalizeSnapshot({version:1,source:'Bank of Canada Valet API',checked_at:null,observations:{policy:{series:SERIES.policy.id,date:'2026-11-02',rate:2.5},prime:{date:'2026-11-02',rate:'bad'}}});
  assert.equal(parsed.observations.policy.rate,2.5);
  assert.equal(parsed.observations.prime,undefined);
});
test('mixed-date Bank of Canada observations parse independently',()=>{
  const raw=fixture('V39053',[['2026-10-30',3.34],['2026-11-02',3.36],['2026-10-28',3.4]]);
  const item=parseValetSeries(raw,'V39053');
  assert.deepEqual(item,{series:'V39053',date:'2026-11-02',rate:3.36,previousDate:'2026-10-30',previousRate:3.34});
});
test('invalid rate, unknown series, impossible date are rejected',()=>{
  assert.throws(()=>parseValetSeries(fixture('V39053',[['2026-10-30','n/a']]),'V39053'));
  assert.throws(()=>parseValetSeries({observations:[]},'UNKNOWN'));
  assert.throws(()=>normalizeSnapshot({version:1,source:'Bank of Canada Valet API',observations:{policy:{series:'V39079',date:'2026-02-31',rate:2.5}}}));
});
test('rates are explicitly stale when outside source publication interval',()=>{
  const item={series:'V39079',date:'2026-10-28',rate:2.5};
  assert.equal(isStale(item,'policy',Date.parse('2026-10-30T00:00:00Z')),false);
  assert.equal(isStale(item,'policy',Date.parse('2026-11-20T00:00:00Z')),true);
  assert.equal(isStale(null,'bond',Date.now()),true);
});
test('scheduled updater calls only official HTTPS Valet series endpoints',async()=>{
 const seen=[];
 const get=async url=>{seen.push(url);return {ok:true,json:async()=>fixture('V39079',[['2026-10-30',2.5]])}};
 const item=await getOfficialSeries('V39079',get);
 assert.equal(item.rate,2.5);
 assert.equal(seen.length,1);
 assert.match(seen[0],/^https:\/\/www\.bankofcanada\.ca\/valet\/observations\/V39079\/json\?recent=25$/);
});
test('scheduler updates working series even when another official series fails',async()=>{
 const old=normalizeSnapshot(seed);
 const fetched=async url=>{
  if(url.includes('V39053'))return {ok:true,json:async()=>fixture('V39053',[['2026-10-30',3.2],['2026-11-02',3.3]])};
  throw Error('temporary upstream outage');
 };
 const {data,errors}=await buildSnapshot(old,fetched,()=>new Date('2026-11-03T12:00:00Z'));
 assert.equal(data.observations.bond.rate,3.3);
 assert.equal(data.observations.prime.rate,4.45);
 assert.equal(data.observations.policy.rate,2.5);
 assert.equal(errors.length,3);
});
test('scheduler fails closed when all source requests fail and no verified data exists',async()=>{
 await assert.rejects(buildSnapshot(null,async()=>{throw Error('offline')}),/All official rate series failed/);
});
test('market impact studio has an actual financing calculation and interactive inputs',()=>{
 const html=renderImpactCalculator();
 for(const name of ['balance','rate','years'])assert.ok(html.includes('name="'+name+'"'));
 assert.ok(html.includes('1 point higher'));
 assert.ok(html.includes('At +1 percentage point'));
 assert.ok(updateImpact('rate',6.2));
 assert.ok(renderImpactCalculator().includes('6.2'));
 assert.equal(updateImpact('not-a-field',3),false);
 assert.ok(updateImpact('rate',5));
});
test('browser gets last verified data from same-origin static file without a paid or cross-origin backend',async()=>{
 const originalFetch=globalThis.fetch,originalStorage=globalThis.localStorage;
 let url='';
 const cache=new Map();
 globalThis.fetch=async requested=>{url=requested;return {ok:true,json:async()=>seed}};
 globalThis.localStorage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>{cache.set(k,v)}};
 try{
   const normalized=await loadRates(true);
   assert.equal(url,'/rates-snapshot.json');
   assert.equal(normalized.observations.policy.rate,2.5);
   assert.equal(normalized.observations.bond.rate,3.51);
   assert.ok(cache.has('oakfolio.public-rates.v1'));
 }finally{
   if(originalFetch===undefined)delete globalThis.fetch;else globalThis.fetch=originalFetch;
   if(originalStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=originalStorage;
 }
});
test('reused rates preserve observation source dates in presentation, never label a posted rate an offered rate',()=>{
 const data=normalizeSnapshot(seed);
 const originals=globalThis.document;
 const records={};
 const classList={toggle:()=>{}};
 globalThis.document={querySelectorAll:s=>{
   if(!records[s])records[s]=[{textContent:'',classList,closest:()=>({classList}),getAttribute:()=>s.includes('prime')?'prime':'policy'}];
   return records[s];
 }};
 try{
   renderRateWidgets(data);
   assert.equal(records['[data-rate-key="policy"]'][0].textContent,'2.50%');
   assert.ok(records['[data-rate-date="policy"]'][0].textContent.includes(seed.observations.policy.date));
   assert.equal(records['[data-rate-key="bond"]'][0].textContent,'3.51%');
   assert.ok(records['[data-oak-rate-status]'][0].textContent.includes('not mortgage offers'));
 }finally{if(originals===undefined)delete globalThis.document;else globalThis.document=originals}
});

test('manual refresh merges new dated Bank observations and preserves independently validated series',async()=>{
  const f=globalThis.fetch,storage=globalThis.localStorage,doc=globalThis.document;
  const values={'V39079':2.5,'V80691311':4.7,'V39053':3.55,'V80691335':6.19};
  const records=new Map();
  globalThis.localStorage={getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v)};
  globalThis.document={querySelectorAll:()=>[]};
  globalThis.fetch=async url=>{
    if(url==='/rates-snapshot.json')return {ok:true,json:async()=>seed};
    const id=Object.keys(values).find(x=>url.includes('/'+x+'/'));
    if(!id)throw Error('Unexpected URL '+url);
    return {ok:true,json:async()=>fixture(id,[['2026-11-02',values[id]]])};
  };
  try{
    const ok=await refreshRates();
    assert.equal(ok,true);
    const updated=await loadRates();
    assert.equal(updated.observations.prime.rate,4.7);
    assert.equal(updated.observations.prime.date,'2026-11-02');
    assert.equal(updated.observations.posted.rate,6.19);
    assert.equal(updated.observations.bond.rate,3.55);
  }finally{
    if(f===undefined)delete globalThis.fetch;else globalThis.fetch=f;
    if(storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=storage;
    if(doc===undefined)delete globalThis.document;else globalThis.document=doc;
  }
});

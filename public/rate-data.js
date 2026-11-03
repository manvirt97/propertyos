// Trusted public macro observations: serializable and independently testable.
// No property/user data is ever included in these records.
export const SERIES=Object.freeze({
  policy:{id:'V39079',label:'BoC policy rate',maxAgeDays:10,source:'https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/'},
  prime:{id:'V80691311',label:'Major-bank prime',maxAgeDays:19,source:'https://www.bankofcanada.ca/rates/banking-and-financial-statistics/posted-interest-rates-offered-by-chartered-banks/'},
  bond:{id:'V39053',label:'5-year GoC bond',maxAgeDays:10,source:'https://www.bankofcanada.ca/rates/interest-rates/lookup-bond-yields/'},
  posted:{id:'V80691335',label:'5-year posted mortgage',maxAgeDays:19,source:'https://www.bankofcanada.ca/rates/banking-and-financial-statistics/posted-interest-rates-offered-by-chartered-banks/'}
});
const dateOK=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T00:00:00Z').toISOString().startsWith(s);
const validRate=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n))&&Number(n)>=0&&Number(n)<=40;
export function validateObservation(item,key){
  const expected=SERIES[key];
  if(!expected||!item||typeof item!=='object'||item.series!==expected.id||!dateOK(item.date)||!validRate(item.rate))return null;
  const out={series:expected.id,date:item.date,rate:Number(item.rate)};
  if(dateOK(item.previousDate)&&validRate(item.previousRate)&&item.previousDate<item.date){
    out.previousDate=item.previousDate;out.previousRate=Number(item.previousRate);
  }
  return out;
}
export function normalizeSnapshot(raw){
  if(!raw||raw.version!==1||raw.source!=='Bank of Canada Valet API'||!raw.observations||typeof raw.observations!=='object')throw Error('Unrecognized rate source data');
  const observations={};
  for(const key of Object.keys(SERIES)){
    const item=validateObservation(raw.observations[key],key);
    if(item)observations[key]=item;
  }
  if(!Object.keys(observations).length)throw Error('No verified rate observations');
  const checkedAt=typeof raw.checked_at==='string'&&!Number.isNaN(Date.parse(raw.checked_at))?raw.checked_at:null;
  return {version:1,source:raw.source,checked_at:checkedAt,observations};
}
export function parseValetSeries(raw,series){
  if(!raw||!Array.isArray(raw.observations)||!Object.values(SERIES).some(s=>s.id===series))throw Error('Invalid official rate response');
  const rows=raw.observations.filter(x=>x&&dateOK(x.d)&&validRate(x[series]?.v)).map(x=>({date:x.d,rate:Number(x[series].v)}));
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  if(!rows.length)throw Error('No valid observation for '+series);
  const newest=rows[rows.length-1],previous=rows.findLast(x=>x.date<newest.date);
  return {series,date:newest.date,rate:newest.rate,...(previous?{previousDate:previous.date,previousRate:previous.rate}:{})};
}
export function isStale(item,key,now=Date.now()){
  const spec=SERIES[key];
  if(!item||!spec)return true;
  const elapsed=(now-Date.parse(item.date+'T00:00:00Z'))/86400000;
  return !Number.isFinite(elapsed)||elapsed< -2||elapsed>spec.maxAgeDays;
}
export function sourceBreakdown(snapshot,now=Date.now()){
  const x=normalizeSnapshot(snapshot);
  return Object.entries(SERIES).map(([key,meta])=>({key,...meta,observation:x.observations[key]||null,stale:isStale(x.observations[key],key,now)}));
}

import {monthlyPayment,money,finite} from './finance.js';
import {SERIES,normalizeSnapshot,isStale,parseValetSeries} from './rate-data.js';

const KEY='oakfolio.public-rates.v1';
const specs=SERIES;
let current=null,sourceKind='',lastFetch=0,pending=null;
const impact={balance:500000,rate:5,years:25};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timer=ms=>new AbortController();
function readLocal(){
  try{return normalizeSnapshot(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return null}
}
function writeLocal(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}
function chooseNewer(fresh,cached){
  if(!fresh)return cached;
  if(!cached)return fresh;
  const observations={};
  for(const key of Object.keys(specs)){
    const a=fresh.observations[key],b=cached.observations[key];
    if(a&&b)observations[key]=a.date>=b.date?a:b;
    else if(a||b)observations[key]=a||b;
  }
  return normalizeSnapshot({version:1,source:'Bank of Canada Valet API',checked_at:fresh.checked_at||cached.checked_at,observations});
}
async function getDirect(){
  const controller=new AbortController(),t=setTimeout(()=>controller.abort(),8000);
  try{
    const results=await Promise.allSettled(Object.entries(specs).map(async ([key,spec])=>{
      const url='https://www.bankofcanada.ca/valet/observations/'+spec.id+'/json?recent=15';
      const response=await fetch(url,{mode:'cors',credentials:'omit',signal:controller.signal,cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      return [key,parseValetSeries(await response.json(),spec.id)];
    }));
    const observations={};
    for(const row of results)if(row.status==='fulfilled')observations[row.value[0]]=row.value[1];
    if(!Object.keys(observations).length)throw Error('Official browser request unavailable');
    return normalizeSnapshot({version:1,source:'Bank of Canada Valet API',checked_at:new Date().toISOString(),observations});
  }finally{clearTimeout(t)}
}
export async function loadRates(force=false){
  if(!force&&current&&Date.now()-lastFetch<30*60*1000)return current;
  if(pending)return pending;
  pending=(async()=>{
    const cached=current||readLocal();
    try{
      const res=await fetch('/rates-snapshot.json',{cache:'no-store',credentials:'same-origin'});
      if(!res.ok)throw Error('Rate snapshot HTTP '+res.status);
      const verified=normalizeSnapshot(await res.json());
      const merged=chooseNewer(verified,cached);
      current=merged;sourceKind='Official rate snapshot';lastFetch=Date.now();writeLocal(merged);
      return current;
    }catch(error){
      try{
        const direct=await getDirect();
        const merged=chooseNewer(direct,cached);
        current=merged;sourceKind='Direct Bank of Canada observations';lastFetch=Date.now();writeLocal(merged);
        return current;
      }catch{
        if(cached){current=cached;sourceKind='Last saved rates — network unavailable';lastFetch=Date.now();return current}
        throw Error('Official rate updates are unavailable. Check your connection or open the Bank of Canada source.');
      }
    }
  })();
  try{return await pending}finally{pending=null}
}
export function renderRateWidgets(data=current,message=''){
  if(typeof document==='undefined')return;
  for(const [key,spec] of Object.entries(specs)){
    const item=data?.observations?.[key],stale=isStale(item,key);
    for(const el of document.querySelectorAll('[data-rate-key="'+key+'"]')){
      el.textContent=item?item.rate.toFixed(2)+'%':'—';
      el.closest('.oak-rate-tile')?.classList.toggle('oak-rate-stale',!!item&&stale);
    }
    for(const el of document.querySelectorAll('[data-rate-date="'+key+'"]')){
      el.textContent=item?(stale?'Older observation · ':'Observed ')+item.date:'Not available · see official source';
    }
    for(const el of document.querySelectorAll('[data-rate-change="'+key+'"]')){
      if(item&&Number.isFinite(item.previousRate)){
        const change=item.rate-item.previousRate;
        el.textContent=(change>0?'+':'')+change.toFixed(2)+' pp vs prior observation';
      }else el.textContent=item?'':'No verified observation';
    }
  }
  const missing=Object.keys(specs).filter(k=>!data?.observations?.[k]).length;
  const stale=Object.keys(specs).filter(k=>isStale(data?.observations?.[k],k)).length-missing;
  const normal=(sourceKind||'Officially sourced rates')+'. Dates shown are the source observation dates; posted rates are not mortgage offers.';
  const suffix=(missing?' '+missing+' series unavailable.':'')+(stale?' '+stale+' series older than its usual publication interval.':'');
  for(const el of document.querySelectorAll('[data-oak-rate-status]')){
    el.textContent=message?message+(data?' Last verified rates retained.':''):normal+suffix;
    el.classList.toggle('oak-status-alert',!!message||missing>0||stale>0);
  }
  for(const link of document.querySelectorAll('[data-oak-rate-source]')){
    const key=link.getAttribute('data-oak-rate-source');
    if(specs[key])link.href=specs[key].source;
  }
}
export function hydrateRates(){
  if(current)renderRateWidgets(current);
  else {
    const cached=readLocal();
    if(cached){current=cached;sourceKind='Last saved rates';renderRateWidgets(cached,'Checking new official observations.');}
  }
  loadRates().then(s=>renderRateWidgets(s),err=>renderRateWidgets(current,err.message));
}
export async function refreshRates(){
  for(const el of document.querySelectorAll('[data-oak-rate-status]'))el.textContent='Checking latest published rate observations…';
  let staticError=null;
  try{
    const snapshot=await loadRates(true);
    renderRateWidgets(snapshot);
  }catch(err){staticError=err}
  // The scheduled snapshot is the dependable route. Manual refresh also attempts
  // the publisher directly, and merges only strictly newer, validated observations.
  // CORS failures never erase values already confirmed by the Bank of Canada.
  try{
    const direct=await getDirect();
    current=chooseNewer(direct,current||readLocal());
    sourceKind='Direct Bank of Canada observations';
    lastFetch=Date.now();writeLocal(current);
    renderRateWidgets(current);
    return true;
  }catch{
    const note=staticError?'Official data service unavailable.':'No browser-direct rate update available; showing the latest verified published snapshot.';
    renderRateWidgets(current,note);
    return !staticError;
  }
}
export function updateImpact(key,value){
  if(!Object.hasOwn(impact,key))return false;
  impact[key]=value===''?'':Number(value);
  return true;
}
export function renderImpactCalculator(){
  let result=null,error='';
  try{
    const principal=finite(impact.balance,'Mortgage balance',1,1e9);
    const rate=finite(impact.rate,'Interest rate',0,40);
    const years=finite(impact.years,'Amortization',1,50);
    result={base:monthlyPayment(principal,rate,years),lower:monthlyPayment(principal,Math.max(0,rate-1),years),higher:monthlyPayment(principal,Math.min(40,rate+1),years),rate};
  }catch(err){error=err.message}
  const field=(key,label,min,max,step)=>'<label class="oak-impact-field"><span>'+esc(label)+'</span><input type="number" inputmode="decimal" name="'+key+'" data-oak-scope="impact" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(impact[key])+'"></label>';
  const tile=(label,value,note)=>'<div class="oak-impact-tile"><span>'+label+'</span><strong>'+value+'</strong><small>'+note+'</small></div>';
  return '<div class="oak-impact-box"><div class="oak-impact-title"><div><span class="oak-label">SCENARIO STUDIO</span><h3>What would a 1% rate move cost you?</h3><p>Compare Canadian fixed-rate mortgage payments using your own illustrative rate. These figures are not lender offers.</p></div><a href="#refinance" class="oak-link">Advanced refinance model ↗</a></div>'+
    '<div class="oak-impact-inputs">'+field('balance','Mortgage balance ($)',1,1e9,1000)+field('rate','Rate assumption (%)',0,40,.05)+field('years','Amortization (years)',1,50,1)+'</div>'+
    (result?'<div class="oak-impact-results">'+tile('1 point lower',money(result.lower),'At '+Math.max(0,result.rate-1).toFixed(2)+'%')+tile('Your scenario',money(result.base),'Per month')+tile('1 point higher',money(result.higher),'At '+Math.min(40,result.rate+1).toFixed(2)+'%')+'</div><p class="oak-impact-delta">At +1 percentage point: <strong>'+money(result.higher-result.base)+'/month</strong> more than the base scenario, before lender fees or tax.</p>':'<p class="oak-caution">'+esc(error)+'</p>')+
    '<p class="oak-fine">Fixed-rate payment convention: nominal annual rate compounded semi-annually, monthly payments. Variable-rate contracts and qualification stress tests differ.</p></div>';
}

// Free official Bank of Canada rate refresh for a STATIC Cloudflare Pages site.
// No API keys, Cloudflare Functions, database, user information, or paid services.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {SERIES,normalizeSnapshot,parseValetSeries} from '../public/rate-data.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(root,'public/rates-snapshot.json');
const timeoutMs=12000;
export async function getOfficialSeries(id,request=fetch){
 const url='https://www.bankofcanada.ca/valet/observations/'+encodeURIComponent(id)+'/json?recent=25';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await request(url,{headers:{Accept:'application/json'},signal:controller.signal});
  if(!response.ok)throw Error('Bank of Canada HTTP '+response.status+' for '+id);
  const raw=await response.json();
  return parseValetSeries(raw,id);
 }finally{clearTimeout(timer)}
}
export async function buildSnapshot(previous,request=fetch,now=()=>new Date()){
 const old=previous?.observations||{};
 const entries=await Promise.all(Object.entries(SERIES).map(async ([key,spec])=>{
  try{return [key,await getOfficialSeries(spec.id,request),null]}
  catch(err){return [key,old[key]||null,String(err.message||err)]}
 }));
 const observations={};const errors=[];
 for(const [key,raw,error] of entries){
  if(error)errors.push({key,detail:error.slice(0,160)});
  if(raw)observations[key]=raw;
 }
 // No fabricated values: if the source fails and no prior verified data, fail.
 if(!Object.keys(observations).length)throw Error('All official rate series failed; old snapshot preserved');
 const raw={version:1,source:'Bank of Canada Valet API',checked_at:now().toISOString(),observations};
 const data=normalizeSnapshot(raw);
 return {data,errors};
}
async function main(){
 let previous=null;
 try{previous=normalizeSnapshot(JSON.parse(await readFile(target,'utf8')))}catch{}
 const {data,errors}=await buildSnapshot(previous);
 // Publish a new snapshot only when new observed data has arrived. Avoid
 // needless Cloudflare builds when values/dates are unchanged.
 const before=JSON.stringify(previous?.observations||{});
 const after=JSON.stringify(data.observations);
 if(before!==after){
  await mkdir(dirname(target),{recursive:true});
  await writeFile(target,JSON.stringify(data,null,2)+'\n');
  console.log('Updated official observations: '+Object.keys(data.observations).join(', '));
 }else console.log('No new observations; no deployment needed');
 for(const error of errors)console.warn('Source unavailable for '+error.key+': '+error.detail);
 // A partial update is valid. The UI shows observation-level freshness.
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(err=>{console.error(err);process.exitCode=1});

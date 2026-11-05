import {monthlyPayment} from './finance.js';
const form=document.getElementById('inputs');
const scenarios=document.getElementById('scenarios');
const headline=document.getElementById('headline');
const explanation=document.getElementById('explanation');
const fmt=n=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);
let outcome=null;
export function calculateXray(v){
  const number=(key,min,max)=>{const n=Number(v[key]);if(v[key]===undefined||v[key]===null||String(v[key]).trim()===''||!Number.isFinite(n)||n<min||n>max)throw Error('Check '+key+'; it must be between '+min+' and '+max);return n;};
  const price=number('price',10000,100000000),down=number('down',0,100),rate=number('rate',0,40),years=number('years',1,50),fullRent=number('fullRent',0,1000000),partialRent=number('partialRent',0,1000000),costs=number('costs',0,1000000),vacancy=number('vacancy',0,100);
  const homeValue=number('homeValue',0,100000000),homeBalance=number('homeBalance',0,100000000),ltv=number('ltv',0,80);
  const payment=monthlyPayment(price*(100-down)/100,rate,years);
  const liveCost=payment+costs-partialRent*(1-vacancy/100);
  const rentalCash=fullRent*(1-vacancy/100)-costs-payment;
  const equityRoom=Math.max(0,homeValue*ltv/100-homeBalance);
  return {payment,liveCost,rentalCash,equityRoom,downCash:price*down/100,monthlyCosts:costs,hasEquity:homeValue>0,period:'Monthly',rate,down,years};
}
function allInputs(){return Object.fromEntries(new FormData(form).entries());}
function tile(title,value,detail,kind=''){const item=document.createElement('article');item.className='scenario';const name=document.createElement('h3');name.textContent=title;const number=document.createElement('strong');number.className=kind;number.textContent=value;const meta=document.createElement('p');meta.textContent=detail;item.append(name,number,meta);return item;}
function render(){
 try{outcome=calculateXray(allInputs()); const o=outcome;scenarios.replaceChildren(
  tile('01 · Live in it and rent the other space',fmt(o.liveCost)+'/mo','Estimated net monthly housing cost; assumes the entered partial rent is collectible.'),
  tile('02 · Rent the entire property',fmt(o.rentalCash)+'/mo','Estimated monthly cash flow before tax, closing costs and capital reserve. Negative values mean an estimated shortfall.',o.rentalCash>=0?'positive':'negative'),
  tile('03 · Existing-home equity room',o.hasEquity?fmt(o.equityRoom):'Add a home value','Illustrative additional borrowing capacity at your entered LTV, before fees and lender qualification.')
 );
 headline.textContent=o.rentalCash>=0?'Could this property help cover its own costs?':'Would this property require extra monthly cash?';
 explanation.textContent='Under your assumptions, the rental scenario '+(o.rentalCash>=0?'has an estimated monthly surplus.':'shows a monthly cash shortfall.')+' That is not a prediction or a recommendation—verify rents, financing, reserves and actual expenses.';
 }catch(e){outcome=null;scenarios.replaceChildren(tile('Review your inputs','—',e.message));headline.textContent='Complete valid assumptions';explanation.textContent='No estimates shown until all inputs are valid.';}
}
form.addEventListener('input',render);
document.getElementById('share').addEventListener('click',async ()=>{
 const status=document.getElementById('share-status');if(!outcome){status.textContent='Please fix the assumptions first.';return;}
 const figures=document.getElementById('includeNumbers').checked;
 const body='I explored three property scenarios with Oakfolio Property X-Ray.'+(figures?' Estimated monthly owner-occupier net cost: '+fmt(outcome.liveCost)+'. Estimated monthly rental cash flow: '+fmt(outcome.rentalCash)+'.':'')+' All figures are illustrative and based on manually entered assumptions. Explore yours: '+location.origin+'/property-xray.html';
 try{if(navigator.share)await navigator.share({title:'My Oakfolio Property X-Ray',text:body});else if(navigator.clipboard){await navigator.clipboard.writeText(body);status.textContent='Copied comparison text.';}else{status.textContent='Copy from this link: '+location.origin+'/property-xray.html';}}catch(e){if(e.name!=='AbortError')status.textContent='Sharing unavailable; use the page URL.';}
});
render();
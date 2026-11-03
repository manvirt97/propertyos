import {finite,monthlyPayment} from './finance.js';

export function refinanceModel(input){
  const value=finite(input.value,'Property value',1);
  const balance=finite(input.balance,'Mortgage balance',0);
  const ltv=finite(input.ltv,'Maximum illustrative LTV',1,100);
  const fees=finite(input.fees,'Refinance fees',0);
  const currentRate=finite(input.currentRate,'Existing mortgage rate',0,40);
  const newRate=finite(input.newRate,'Refinance mortgage rate',0,40);
  const currentYears=finite(input.currentYears,'Existing remaining amortization',1,50);
  const newYears=finite(input.newYears,'New amortization',1,50);
  const noi=input.noi===''||input.noi===undefined||input.noi===null?null:finite(input.noi,'Annual net operating income',0);
  const ceiling=value*ltv/100;
  const permitted=ceiling>=balance;
  const cashOut=permitted?Math.max(0,ceiling-balance-fees):0;
  const currentPayment=monthlyPayment(balance,currentRate,currentYears);
  // Illustrates the highest principal permitted by the entered LTV, NOT an approval.
  const newPrincipal=permitted?ceiling:null;
  const newPayment=permitted?monthlyPayment(newPrincipal,newRate,newYears):null;
  const dscr=noi!==null&&newPayment>0?noi/(newPayment*12):null;
  const stressCeiling=value*0.85*ltv/100;
  return {equity:value-balance,ceiling,permitted,cashOut,newPrincipal,currentPayment,newPayment,
    paymentChange:newPayment===null?null:newPayment-currentPayment,dscr,
    stressedCashOut:Math.max(0,stressCeiling-balance-fees),
    ltv:balance/value*100};
}

export function borrowingPlan(input){
  const noi=finite(input.noi,'Annual NOI',0);
  const dscr=finite(input.targetDscr,'Target DSCR',1,5);
  const rate=finite(input.rate,'Mortgage rate',0,40);
  const years=finite(input.years,'Amortization',1,50);
  const ltv=finite(input.ltv,'LTV',1,100);
  const down=finite(input.cash,'Available investment cash',0);
  const closing=finite(input.closing,'Closing costs',0,30);
  const annualDebtCapacity=noi/dscr;
  const monthlyPerDollar=monthlyPayment(1,rate,years);
  const debtByIncome=annualDebtCapacity/12/monthlyPerDollar;
  const priceByCash=down/(1-ltv/100+closing/100);
  const debtAtCashPrice=priceByCash*ltv/100;
  const indicatedPrice=Math.min(priceByCash,debtByIncome/(ltv/100));
  return {debtByIncome,priceByCash,debtAtCashPrice,indicatedPrice,annualDebtCapacity,
    binding:priceByCash<=debtByIncome/(ltv/100)?'Available cash':'Illustrative debt coverage'};
}

export function expansionRunway(input){
  const purchase=finite(input.purchase,'Target purchase price',1);
  const down=finite(input.down,'Down payment percent',1,100);
  const closing=finite(input.closing,'Closing costs percent',0,30);
  const reserve=finite(input.reserve,'Cash reserve',0);
  const available=finite(input.available,'Currently available funds',0);
  const monthlySavings=finite(input.monthlySavings,'Monthly savings',0);
  const monthlyCashFlow=finite(input.monthlyCashFlow,'Monthly cash flow',0);
  const target=purchase*(down+closing)/100+reserve;
  const gap=Math.max(0,target-available);
  const monthly=monthlySavings+monthlyCashFlow;
  return {target,gap,monthly,months:gap===0?0:monthly>0?Math.ceil(gap/monthly):null};
}

export function latestValet(data,series){
  if(!data||!Array.isArray(data.observations))throw Error('Invalid Bank of Canada response');
  const valid=data.observations.filter(row=>row&&/^\d{4}-\d{2}-\d{2}$/.test(row.d)&&Number.isFinite(Number(row[series]?.v))&&Number(row[series].v)>=0&&Number(row[series].v)<=40);
  if(!valid.length)throw Error('No valid current observation');
  valid.sort((a,b)=>a.d.localeCompare(b.d));
  const last=valid[valid.length-1];
  return {rate:Number(last[series].v),date:last.d,series};
}

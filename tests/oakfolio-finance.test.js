import test from 'node:test';
import assert from 'node:assert/strict';
import {refinanceModel,borrowingPlan,expansionRunway,latestValet} from '../public/oakfolio-finance.js';

const refi={value:800000,balance:400000,ltv:80,fees:7000,currentRate:5.5,newRate:4.5,currentYears:20,newYears:25,noi:52000};
test('refinance released equity subtracts balance and fees',()=>{
  const x=refinanceModel(refi);
  assert.equal(x.equity,400000);
  assert.equal(x.ceiling,640000);
  assert.equal(x.cashOut,233000);
  assert.ok(x.newPayment>0);
  assert.ok(x.dscr>0);
});
test('refinance at max LTV leaves no cash after fees',()=>{
  assert.equal(refinanceModel({...refi,balance:640000}).cashOut,0);
});
test('refinance rejects LTV-impossible balance rather than fake approval',()=>{
  const x=refinanceModel({...refi,balance:790000});
  assert.equal(x.permitted,false);
  assert.equal(x.cashOut,0);
  assert.equal(x.newPayment,null);
  assert.equal(x.dscr,null);
});
test('refinance stress reduces possible release',()=>{
  const x=refinanceModel(refi);
  assert.ok(x.stressedCashOut<x.cashOut);
});
test('refinance rejects impossible mortgage rates and negative fees',()=>{
  assert.throws(()=>refinanceModel({...refi,newRate:-1}));
  assert.throws(()=>refinanceModel({...refi,fees:-1}));
});
test('refinance can omit NOI without inventing DSCR',()=>{
  const x=refinanceModel({...refi,noi:''});
  assert.equal(x.dscr,null);
});
test('borrowing plan uses debt coverage and cash as separate limits',()=>{
  const x=borrowingPlan({noi:75000,targetDscr:1.25,rate:5,years:25,ltv:75,cash:250000,closing:2});
  assert.ok(x.debtByIncome>0);
  assert.ok(x.priceByCash>0);
  assert.ok(x.indicatedPrice<=x.priceByCash);
  assert.ok(x.indicatedPrice<=x.debtByIncome/0.75);
});
test('borrowing capacity rejects zero target DSCR',()=>{
  assert.throws(()=>borrowingPlan({noi:20000,targetDscr:0,rate:5,years:25,ltv:75,cash:200000,closing:2}));
});
test('runway gap and zero-savings null result',()=>{
  const x=expansionRunway({purchase:500000,down:25,closing:2,reserve:10000,available:0,monthlySavings:0,monthlyCashFlow:0});
  assert.equal(x.target,145000);
  assert.equal(x.gap,145000);
  assert.equal(x.months,null);
});
test('runway reports months and reached goals correctly',()=>{
  const args={purchase:500000,down:25,closing:2,reserve:10000,available:85000,monthlySavings:2000,monthlyCashFlow:1000};
  assert.equal(expansionRunway(args).months,20);
  assert.equal(expansionRunway({...args,available:145000}).months,0);
});
test('Valet selects newest valid observation regardless of API order',()=>{
  assert.deepEqual(latestValet({observations:[{d:'2026-10-28',V39079:{v:'2.25'}},{d:'2026-10-27',V39079:{v:'2.5'}}]},'V39079'),
    {rate:2.25,date:'2026-10-28',series:'V39079'});
});
test('Valet invalid/missing rates fail closed',()=>{
  assert.throws(()=>latestValet({observations:[{d:'2026-10-28',V39079:{v:'broken'}}]},'V39079'));
  assert.throws(()=>latestValet({observations:[]},'V39079'));
});

test('borrow modeling rejects 100 percent financing with no closing costs',()=>{
  assert.throws(()=>borrowingPlan({noi:65000,targetDscr:1.25,rate:5,years:25,ltv:100,cash:250000,closing:0}));
});

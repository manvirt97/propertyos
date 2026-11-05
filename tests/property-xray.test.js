import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('Property X-Ray is discoverable and shares financial figures only when opted in',()=>{
 const app=fs.readFileSync('public/app.js','utf8'),page=fs.readFileSync('public/property-xray.html','utf8'),source=fs.readFileSync('public/property-xray.js','utf8');
 assert.match(app,/Property X-Ray/);assert.match(app,/\/property-xray\.html/);
 assert.match(page,/id="includeNumbers" type="checkbox"/);assert.match(source,/includeNumbers'\)\.checked/);
 assert.match(source,/monthlyPayment/);assert.doesNotMatch(source,/fetch\(/);
});
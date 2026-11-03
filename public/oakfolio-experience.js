import {money,percent,analyze} from './finance.js';
import {refinanceModel,borrowingPlan,expansionRunway,latestValet} from './oakfolio-finance.js';
import {readDeals} from './store.js';

const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cities=[
  {id:'calgary',name:'Calgary',province:'AB',lat:51.045,lon:-114.071,url:'https://www.realtor.ca/ab/calgary/multi-family-homes-for-sale'},
  {id:'edmonton',name:'Edmonton',province:'AB',lat:53.547,lon:-113.494,url:'https://www.realtor.ca/ab/greater-edmonton/multi-family-homes-for-sale'},
  {id:'vancouver',name:'Vancouver',province:'BC',lat:49.283,lon:-123.121,url:'https://www.realtor.ca/bc/vancouver/multi-family-homes-for-sale'},
  {id:'toronto',name:'Toronto',province:'ON',lat:43.653,lon:-79.383,url:'https://www.realtor.ca/on/toronto/multi-family-homes-for-sale'},
  {id:'ottawa',name:'Ottawa',province:'ON',lat:45.421,lon:-75.697,url:'https://www.realtor.ca/on/ottawa/multi-family-homes-for-sale'},
  {id:'winnipeg',name:'Winnipeg',province:'MB',lat:49.895,lon:-97.138,url:'https://www.realtor.ca/mb/winnipeg/multi-family-homes-for-sale'},
  {id:'halifax',name:'Halifax',province:'NS',lat:44.648,lon:-63.575,url:'https://www.realtor.ca/ns/halifax/multi-family-homes-for-sale'},
  {id:'montreal',name:'Montréal',province:'QC',lat:45.502,lon:-73.567,url:'https://www.realtor.ca/qc/-montreal/multi-family-homes-for-sale'}
];
function storedCity(){try{const id=localStorage.getItem('oakfolio.city');return cities.some(c=>c.id===id)?id:'calgary'}catch{return 'calgary'}}
let city=storedCity(), rates=null,rateAt=0,ratePending=null;
const refi={value:'',balance:'',ltv:80,fees:5000,currentRate:5.3,newRate:4.7,currentYears:20,newYears:25,noi:''};
const borrow={noi:65000,targetDscr:1.25,rate:5,years:25,ltv:75,cash:180000,closing:2};
const runway={purchase:650000,down:25,closing:2,reserve:20000,available:25000,monthlySavings:1500,monthlyCashFlow:0};
let coachGoal='first';
const selectedCity=()=>cities.find(c=>c.id===city)||cities[0];
const ref=(href,label,cls='')=>'<a class="'+e(cls)+'" href="'+e(href)+'" target="_blank" rel="noopener noreferrer">'+e(label)+' <span aria-hidden="true">↗</span></a>';
const section=(eyebrow,title,description)=>'<div class="oak-section-heading"><div><span class="oak-label">'+e(eyebrow)+'</span><h2>'+e(title)+'</h2><p>'+e(description)+'</p></div></div>';
const field=(scope,key,label,min,max,step)=>'<label class="oak-field"><span>'+e(label)+'</span><input type="number" inputmode="decimal" data-oak-scope="'+scope+'" name="'+e(key)+'" min="'+min+'" max="'+max+'" step="'+(step??'any')+'" value="'+e(({refi,borrow,runway})[scope][key])+'"></label>';
const val=(label,value,sub,cls='')=>'<div class="oak-result '+e(cls)+'"><span>'+e(label)+'</span><strong>'+e(value)+'</strong><small>'+e(sub)+'</small></div>';
const pill=(text)=>'<span class="oak-pill">'+e(text)+'</span>';
const btn=(label,target)=>'<a class="oak-button" href="#'+e(target)+'">'+e(label)+' <span aria-hidden="true">↗</span></a>';
const ext=(label,href)=>ref(href,label,'oak-link');
function ratePanels(mini=false){
  const items=[['policy','BoC policy rate','V39079'],['prime','Chartered-bank prime','V80691311'],['bond','5-year GoC bond','V39053'],['posted','5-year posted mortgage','V80691335']];
  return '<div class="'+(mini?'oak-rates-mini':'oak-rate-grid')+'">'+items.map(([key,label,series])=>
    '<div class="oak-rate-tile"><span>'+e(label)+'</span><strong data-rate-key="'+key+'">—</strong><small data-rate-date="'+key+'">Connecting to Bank of Canada…</small></div>').join('')+'</div>';
}
function safeDeals(){try{return readDeals()}catch{return []}}
function summary(){const a=safeDeals().map(x=>{try{return analyze(x.inputs)}catch{return null}}).filter(Boolean);return {count:a.length,value:a.reduce((s,x)=>s+x.price,0),cash:a.reduce((s,x)=>s+x.monthlyCashFlow,0),units:a.reduce((s,x)=>s+x.units,0)}}
export function renderOakHome(){
  const s=summary(),c=selectedCity();
  return '<div class="oak-landing">'+
    '<div class="oak-welcome"><span class="oak-label">OAKFOLIO / INVESTMENT WORKSPACE</span><span class="oak-location">◉ '+e(c.name+', '+c.province)+' <a href="#discover">Change market ↗</a></span></div>'+
    '<div class="oak-hero"><div class="oak-hero-copy"><span class="oak-hero-tag"><span class="oak-pulse"></span> REAL ESTATE, REIMAGINED</span>'+
    '<h1>See opportunity.<br><em>Build ownership.</em></h1><p>Discover multifamily opportunities, understand every financing decision and create a clear path to your next property—all in one place.</p>'+
    '<div class="oak-hero-actions">'+btn('Explore multifamily listings','discover')+'<a href="#refinance" class="oak-button oak-button-ghost">Unlock your equity <span aria-hidden="true">→</span></a></div>'+
    '<div class="oak-hero-caption"><span>CANADA-FIRST</span><span>PRIVACY-LED</span><span>NO SALES PRESSURE</span></div></div>'+
    '<div class="oak-hero-visual" aria-hidden="true"><div class="oak-visual-sky"><span class="oak-sky-dot"></span></div><div class="oak-building oak-b1"><span></span><span></span><span></span><span></span></div><div class="oak-building oak-b2"><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="oak-building oak-b3"><span></span><span></span><span></span></div><div class="oak-visual-float"><small>PORTFOLIO VISION</small><strong>Invest with clarity.</strong><span>From first keys to financial freedom ↗</span></div></div></div>'+
    '<div class="oak-dash-top">'+section('YOUR WORKSPACE','One view. Every next step.','Saved opportunities are scenarios, not confirmed owned properties.')+
    '<div class="oak-stats">'+val('Saved opportunities',String(s.count),'Locally saved analyses')+val('Scenario value',s.count?money(s.value):'—','Total analyzed purchase price')+val('Potential cash flow / month',s.count?money(s.cash):'—','Illustrative, before income tax')+val('Units analyzed',s.count?String(s.units):'—','Not a count of owned units')+'</div></div>'+
    '<div class="oak-home-split"><div class="oak-market-panel"><div class="oak-panel-head"><div><span class="oak-label">OFFICIAL CANADIAN DATA</span><h3>Rates that shape your next move</h3></div><a href="#market" class="oak-inline-link">All market data ↗</a></div>'+ratePanels(true)+
    '<p class="oak-fine">Bank of Canada observations; posted rates are not offers. <span data-oak-rate-status>Loading…</span></p></div>'+
    '<div class="oak-next-panel"><span class="oak-label">YOUR NEXT MOVE</span><h3>What should you do today?</h3>'+
    '<a href="#discover"><span>01</span><b>Find a rental property</b><i>↗</i></a><a href="#refinance"><span>02</span><b>Estimate refinance options</b><i>↗</i></a><a href="#coach"><span>03</span><b>Build an investing strategy</b><i>↗</i></a><a href="#analyzer"><span>04</span><b>Underwrite a new deal</b><i>↗</i></a></div></div>'+
    section('EXPLORE YOUR MARKET','Start where opportunity lives.','Location-aware shortcuts to current REALTOR.ca multifamily search results; listing data remains with its source.')+
    '<div class="oak-location-preview"><div><span>◉</span><h3>'+e(c.name)+' multi-family property discovery</h3><p>Browse active search results at the source, save candidates to your private shortlist, and analyze the economics here.</p></div>'+btn('Open property explorer','discover')+'</div>'+
    section('THE OAKFOLIO METHOD','From one property to a portfolio.','A practical sequence—not a promise of returns or financing approval.')+
    '<div class="oak-journey"><a href="#discover"><span>01</span><strong>Discover</strong><small>Search multifamily markets</small></a><a href="#analyzer"><span>02</span><strong>Underwrite</strong><small>Test NOI, DSCR and risk</small></a><a href="#refinance"><span>03</span><strong>Finance</strong><small>Model borrowing and equity</small></a><a href="#coach"><span>04</span><strong>Grow</strong><small>Set a responsible strategy</small></a></div>'+
    '<div class="oak-page-foot">Oakfolio is an educational research and planning platform. No listing feeds, bank accounts or automatic trading are connected. Saved analyses remain on this device.</div></div>';
}
function candidates(){try{const raw=JSON.parse(localStorage.getItem('oakfolio.candidates')||'[]');return Array.isArray(raw)?raw.filter(x=>x&&typeof x.name==='string'&&typeof x.url==='string').slice(0,40):[]}catch{return []}}
function writeCandidates(rows){if(rows.length>40)throw Error('Maximum of 40 saved prospects');localStorage.setItem('oakfolio.candidates',JSON.stringify(rows))}
export function renderExplore(){
 const c=selectedCity(),items=candidates();
 return '<div class="oak-page"><span class="oak-label">DISCOVER / CANADIAN MARKETS</span><h1>Find your next property.</h1><p class="oak-page-lede">Explore multifamily opportunities by city, then turn a listing into an investment decision. Search results open at the original listing provider.</p>'+
 '<div class="oak-discover-hero"><div><span class="oak-label">YOUR SELECTED MARKET</span><h2>'+e(c.name)+' <span>'+e(c.province)+'</span></h2><p>Search duplexes, small multiplexes, and apartment buildings in this area. The provider controls availability and property details.</p></div><div class="oak-location-actions"><label for="oak-city">Choose a city</label><select id="oak-city">'+cities.map(x=>'<option value="'+e(x.id)+'" '+(x.id===city?'selected':'')+'>'+e(x.name+', '+x.province)+'</option>').join('')+'</select><button type="button" data-oak-action="geolocate" class="oak-outline">◎ Use my approximate location</button></div></div>'+
 section('PROPERTY DISCOVERY','Current listings, directly from their source.','We do not copy, scrape or invent MLS listings. Browsing opens an up-to-date public provider search.')+
 '<div class="oak-discover-grid">'+
 '<article class="oak-discover-card"><div class="oak-category-icon">⌂</div>'+pill('DUPLEX / TRIPLEX / FOURPLEX')+'<h3>Small multifamily</h3><p>Start with smaller rental buildings, house-hacking opportunities and additional suites. Check legal-unit status and zoning.</p>'+ext('Browse '+c.name+' multifamily',c.url)+'</article>'+
 '<article class="oak-discover-card"><div class="oak-category-icon">▥</div>'+pill('FIVE+ UNITS')+'<h3>Apartment investments</h3><p>Explore multi-unit assets and review commercial lending, NOI, vacancy, operating expenses and debt coverage.</p>'+ext('Explore listings at REALTOR.ca',c.url)+'</article>'+
 '<article class="oak-discover-card"><div class="oak-category-icon">◈</div>'+pill('DEAL PIPELINE')+'<h3>Save and investigate</h3><p>Found a property? Save its link locally and move its basic numbers into the Oakfolio Deal Analyzer.</p><a href="#oak-shortlist" class="oak-link">Add a property to your shortlist ↗</a></article></div>'+
 '<p class="oak-fine oak-data-note">Listing search links are verified for the supported cities. A licensed CREA DDF® feed is needed to display live MLS records, photos and updates directly inside Oakfolio. Selecting five-plus units does not automatically filter the provider results.</p>'+
 '<div id="oak-shortlist">'+section('PRIVATE SHORTLIST','Keep promising properties together.','Your property links and estimates stay in this browser. No account or cloud synchronization.')+'</div>'+
 '<div class="oak-shortlist-layout"><form id="oak-add-property" class="oak-form-card"><h3>Add a listing</h3><label>Property nickname or street (no tenant details)<input required maxlength="120" name="name" placeholder="e.g., 8-unit apartment near downtown"></label>'+
 '<label>Listing URL (https only)<input required type="url" name="url" maxlength="500" placeholder="https://www.realtor.ca/..."></label>'+
 '<div class="oak-input-row"><label>Asking price (CAD)<input type="number" name="price" min="1" max="1000000000" required placeholder="850000"></label><label>Number of units<input type="number" name="units" min="1" max="10000" step="1" required value="2"></label></div><button class="oak-button" type="submit">Save to shortlist <span>+</span></button><p class="oak-fine">Never paste private listing agreements or tenant information.</p></form>'+
 '<div class="oak-saved-panel"><div class="oak-panel-head"><h3>Saved prospects</h3>'+pill(items.length+' / 40')+'</div>'+(
 items.length?items.map(x=>'<div class="oak-prospect"><div><strong>'+e(x.name)+'</strong><small>'+money(x.price)+' · '+e(x.units)+' units · '+e(x.city)+'</small><div>'+ext('View listing',x.url)+'</div></div><div class="oak-prospect-actions"><button type="button" data-oak-action="analyze" data-id="'+e(x.id)+'">Analyze ↗</button><button type="button" data-oak-action="delete" data-id="'+e(x.id)+'" aria-label="Remove '+e(x.name)+'">×</button></div></div>').join(''):'<div class="oak-empty"><span>◇</span><strong>No properties saved yet</strong><p>Keep your research organized before you analyze a purchase.</p></div>')+
 '</div></div></div>';
}
const rateSpecs=[['policy','Policy interest rate','V39079','Bank of Canada overnight target','https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/'],['prime','Bank prime rate','V80691311','Major chartered banks; weekly posted rate','https://www.bankofcanada.ca/rates/banking-and-financial-statistics/posted-interest-rates-offered-by-chartered-banks/'],['bond','5-year government bond yield','V39053','Canadian benchmark yield; not a mortgage quote','https://www.bankofcanada.ca/rates/interest-rates/lookup-bond-yields/'],['posted','5-year posted mortgage rate','V80691335','Major banks’ conventional posted rate; not a discounted offer','https://www.bankofcanada.ca/rates/banking-and-financial-statistics/posted-interest-rates-offered-by-chartered-banks/']];
export function renderMarket(){
 return '<div class="oak-page"><span class="oak-label">MARKET INTELLIGENCE / CANADA</span><h1>Know the market.<br><em>Not just the mortgage.</em></h1><p class="oak-page-lede">Official policy, prime, bond and posted mortgage data—labelled by its actual observation date. These are benchmarks, not personalized borrowing offers.</p>'+
 '<div class="oak-panel-head oak-rate-toolbar"><div><span class="oak-label">BANK OF CANADA / VALET API</span><h2>Interest-rate monitor</h2></div><button type="button" class="oak-outline" data-oak-action="rates-refresh">↻ Refresh rates</button></div>'+
 ratePanels(false)+'<p class="oak-fine" data-oak-rate-status>Loading official observations. No values will be presented as live unless successfully retrieved.</p>'+
 section('READ THE MARKET','What these rates actually mean.','Rates serve different purposes; confusing a benchmark with a mortgage offer can distort your underwriting.')+
 '<div class="oak-education-grid">'+rateSpecs.map(([id,title,series,detail,url])=>'<article class="oak-tutorial"><span class="oak-label">'+e(series)+'</span><h3>'+e(title)+'</h3><p>'+e(detail)+'</p>'+ext('Source and methodology',url)+'</article>').join('')+'</div>'+
 '<div class="oak-feature-note"><div><span class="oak-label">THE RATE-TO-DEAL WORKFLOW</span><h3>Turn market knowledge into a stress test.</h3><p>Choose a rate from your lender or scenario, then analyze payments, debt-service coverage and cash flow. Published rates should not silently replace your financing assumptions.</p></div>'+btn('Open Deal Analyzer','analyzer')+'</div>'+
 '<p class="oak-fine">Official sources: Bank of Canada Valet API. Data is publicly accessible without a paid API key, but browser access depends on the Bank’s CORS policy and availability. If unavailable, values stay blank and source links remain accessible.</p></div>';
}
export function renderRefinance(){
 let model=null,error='';try{model=refinanceModel(refi)}catch(x){error=x.message}
 let leverage=null,lvError='';try{leverage=borrowingPlan(borrow)}catch(x){lvError=x.message}
 let growth=null,gError='';try{growth=expansionRunway(runway)}catch(x){gError=x.message}
 return '<div class="oak-page"><span class="oak-label">REFINANCE & CAPITAL STRATEGY</span><h1>Make your equity<br><em>work intelligently.</em></h1><p class="oak-page-lede">Explore cash-out refinancing, debt coverage and a path to your next purchase. These are scenario models, not mortgage eligibility or tax advice.</p>'+
 '<div class="oak-alert">Illustrative planning only. For typical residential refinancing, a general 80% loan-to-value ceiling is often relevant; insured secondary-suite programs and 5+ unit commercial financing have different rules. Lenders can approve less or nothing.</div>'+
 section('01 / REFINANCE STUDIO','What could a refinance actually unlock?','Enter your existing mortgage details and compare maximum illustrative new payments with your current payments.')+
 '<div class="oak-tool-grid"><div class="oak-form-card"><div class="oak-input-row">'+field('refi','value','Estimated property value ($)',1,1e10)+field('refi','balance','Current mortgage balance ($)',0,1e10)+'</div><div class="oak-input-row">'+field('refi','ltv','Illustrative maximum LTV (%)',1,100)+field('refi','fees','All refinance fees + penalties ($)',0,1e8)+'</div><div class="oak-input-row">'+field('refi','currentRate','Existing mortgage rate (%)',0,40)+field('refi','newRate','New mortgage scenario rate (%)',0,40)+'</div><div class="oak-input-row">'+field('refi','currentYears','Current remaining years',1,50)+field('refi','newYears','New amortization years',1,50)+'</div>'+field('refi','noi','Optional annual net operating income ($)',0,1e10)+'<p class="oak-fine">Canada fixed-rate mortgage math: semi-annual compounding, monthly payments. All rates are user-specified assumptions.</p></div>'+
 '<div class="oak-output-card"><span class="oak-label">SCENARIO RESULTS</span>'+(
 model?'<div class="oak-feature-number"><span>Estimated net cash-out ceiling</span><strong>'+money(model.cashOut)+'</strong><small>Value × assumed LTV − existing balance − fees</small></div><div class="oak-results">'+val('Your equity',money(model.equity),'Value less mortgage')+val('Current monthly payment',money(model.currentPayment),'Calculated from entered terms')+val('New monthly payment',model.newPayment===null?'Not feasible':money(model.newPayment),'At maximum entered LTV')+val('Monthly payment change',model.paymentChange===null?'Not feasible':money(model.paymentChange),'New less current')+val('Stressed cash-out',money(model.stressedCashOut),'If property value falls 15%')+val('Post-refinance DSCR',model.dscr===null?'Not entered':model.dscr.toFixed(2)+'×','NOI ÷ annual debt service')+'</div>'+(!model.permitted?'<p class="oak-caution">Your existing debt exceeds the chosen LTV ceiling. This scenario is not feasible at that LTV.</p>':'<p class="oak-fine">Cash-out assumes a new loan at the entered maximum LTV. It is not confirmed usable funds, and other obligations may reduce availability.</p>'):
 '<div class="oak-empty"><span>↗</span><strong>Start with your property value and mortgage balance.</strong><p>We will compare refinancing outcomes automatically.</p><small>'+e(error)+'</small></div>')+'</div></div>'+
 section('02 / BORROWING POWER','Understand the limits to borrowing more.','For five-plus-unit investment scenarios, lenders often examine property income and debt service. Personal income and other eligibility still matter.')+
 '<div class="oak-tool-grid"><div class="oak-form-card"><div class="oak-input-row">'+field('borrow','noi','Annual stabilized NOI ($)',0,1e10)+field('borrow','targetDscr','Target DSCR (×)',1,5,.05)+'</div><div class="oak-input-row">'+field('borrow','rate','Assumed mortgage rate (%)',0,40)+field('borrow','years','Amortization (years)',1,50)+'</div><div class="oak-input-row">'+field('borrow','ltv','Illustrative loan-to-value (%)',1,100)+field('borrow','cash','Cash available for purchase ($)',0,1e10)+'</div>'+field('borrow','closing','Closing costs as % of purchase',0,30,.25)+'<p class="oak-fine">This simplified commercial-style sensitivity does not model lender-specific stress tests, taxes, qualification, insurance premiums or debt yield requirements.</p></div>'+
 '<div class="oak-output-card"><span class="oak-label">BORROWING CONSTRAINTS</span>'+(leverage?'<div class="oak-feature-number"><span>Lower of two simplified limits</span><strong>'+money(leverage.indicatedPrice)+'</strong><small>Illustrative purchase price, not an approval</small></div><div class="oak-results">'+val('Debt supported by NOI',money(leverage.debtByIncome),'At your DSCR and assumed rate')+val('Price supported by cash',money(leverage.priceByCash),'Down payment plus closing costs')+val('Binding constraint',leverage.binding,'The tighter of the two assumptions')+'</div>':'<div class="oak-empty">'+e(lvError)+'</div>')+
 '<div class="oak-strategy-tip"><b>Ways to improve real borrowing capacity</b><p>Document legal rental income and expenses, strengthen credit and liquidity, reduce existing debt, increase your down payment and compare lender programs with a qualified broker. Never assume a higher appraisal guarantees approval.</p></div></div></div>'+
 section('03 / EXPANSION PLAN','How far are you from the next property?','Convert a future acquisition into a transparent savings target without assuming appreciation or refinance approval.')+
 '<div class="oak-tool-grid"><div class="oak-form-card"><div class="oak-input-row">'+field('runway','purchase','Next property price ($)',1,1e10)+field('runway','down','Down payment (%)',1,100)+'</div><div class="oak-input-row">'+field('runway','closing','Closing costs (%)',0,30)+field('runway','reserve','Cash reserve ($)',0,1e10)+'</div><div class="oak-input-row">'+field('runway','available','Cash already available ($)',0,1e10)+field('runway','monthlySavings','New savings per month ($)',0,1e10)+'</div>'+field('runway','monthlyCashFlow','Positive monthly cash flow allocated ($)',0,1e10)+'</div>'+
 '<div class="oak-output-card"><span class="oak-label">YOUR GROWTH RUNWAY</span>'+(growth?'<div class="oak-feature-number"><span>Additional cash to accumulate</span><strong>'+money(growth.gap)+'</strong><small>Target cash requirement: '+money(growth.target)+'</small></div><div class="oak-results">'+val('Monthly accumulation',money(growth.monthly),'Savings + allocated cash flow')+val('Time to target',growth.months===null?'Not estimable':growth.months===0?'Already funded':growth.months+' months','Assumes the monthly contribution stays constant')+'</div><p class="oak-fine">Excludes changes in property prices, tax, mortgage approval, rent variations and unforeseen capital repairs.</p>':'<div class="oak-empty">'+e(gError)+'</div>')+'</div></div>'+
 '<div class="oak-page-foot">Borrowing against property equity increases leverage and may put the property at risk. Confirm program rules with a mortgage professional and tax implications with a Canadian accountant.</div></div>';
}
const guidance={
 first:{title:'Start with the safest first step',body:'Set a maximum all-in purchase budget, keep cash reserves, verify legal suites, and underwrite realistic vacancy, repairs, taxes and financing. Compare owning personally and through a corporation with a CPA before committing.',actions:[['Find nearby properties','discover'],['Learn the purchase process','learn'],['Analyze a possible deal','analyzer']]},
 refi:{title:'Refinance only when the economics improve',body:'Compare the net equity available after fees against your higher debt service, lender qualification, reserve needs and downside scenarios. New borrowing is not profit and should not be treated as guaranteed capital.',actions:[['Open refinance studio','refinance'],['See live rate benchmarks','market']]},
 cash:{title:'Cash flow before optimistic appreciation',body:'Focus on net operating income, honest operating costs, capital reserves and debt coverage. Stress rising rates and vacancies before planning the next purchase.',actions:[['Run underwriting','analyzer'],['Check portfolio scenarios','portfolio']]},
 multifamily:{title:'Five-plus units are a different financing conversation',body:'Commercial-style underwriting may depend on NOI, debt service and insurer rules. Confirm zoning, legal unit count, deferred maintenance, vacancy and property management costs. Ask about CMHC standard rental and MLI Select eligibility.',actions:[['Explore multifamily','discover'],['Model borrowing power','refinance']]}
};
export function renderCoach(){
 const g=guidance[coachGoal],s=summary();
 return '<div class="oak-page"><span class="oak-label">STRATEGY ASSISTANT</span><h1>Make your next move<br><em>a smarter one.</em></h1><p class="oak-page-lede">Personalized-feeling guidance with transparent rules and your own scenario totals. For optional generative AI research, prepare a privacy-conscious brief to paste into ChatGPT yourself.</p>'+
 '<div class="oak-coach-layout"><div class="oak-form-card"><span class="oak-label">CHOOSE YOUR PRIORITY</span><div class="oak-goals">'+Object.entries({first:'Buy my first rental',refi:'Refinance existing property',cash:'Improve cash flow',multifamily:'Scale into apartments'}).map(([key,label])=>'<button type="button" data-oak-goal="'+e(key)+'" class="'+(coachGoal===key?'selected':'')+'">'+e(label)+' <span>↗</span></button>').join('')+'</div><div class="oak-coach-context"><span class="oak-label">YOUR DEVICE-LOCAL CONTEXT</span><p>'+e(s.count)+' saved analyses · '+(s.count?money(s.value)+' total scenario value':'No saved analyses yet')+'</p><small>Property addresses and names are not sent to an AI service.</small></div></div>'+
 '<div class="oak-coach-advice"><span class="oak-label">OAKFOLIO / EXPLAINABLE GUIDANCE</span><h2>'+e(g.title)+'</h2><p>'+e(g.body)+'</p><div class="oak-coach-steps">'+g.actions.map(([t,to])=>'<a href="#'+e(to)+'">'+e(t)+' <span>→</span></a>').join('')+'</div><div class="oak-coach-notice">This guidance is rules-based, not generated by an AI model or tailored mortgage advice. It does not make automated financial decisions.</div></div></div>'+
 section('OPTIONAL / GENERATIVE AI','Take your research into ChatGPT.','No new API subscription or secret is needed. You decide whether to paste an anonymized question into your own ChatGPT session.')+
 '<div class="oak-ai-card"><div><span class="oak-label">YOU CONTROL THE DATA</span><h3>Prepare a property investment research brief</h3><p>Copies a general question about your selected goal, Canadian financing and market sources. It does not include names, addresses, financial accounts, or your saved property records.</p><div class="oak-hero-actions"><button type="button" class="oak-button" data-oak-action="copy-prompt">Copy research prompt ↗</button>'+ext('Open ChatGPT','https://chatgpt.com/')+'</div></div><div class="oak-ai-icon" aria-hidden="true">✧</div></div>'+
 '<p class="oak-fine">ChatGPT answers can be wrong or out of date. Verify rates against Bank of Canada, lending requirements with your lender and legal/tax questions with qualified professionals. No automatic ChatGPT connection exists.</p></div>';
}
function promptText(){
 const goal={first:'buy my first Canadian rental property',refi:'evaluate a refinance to purchase another Canadian rental property',cash:'improve sustainable rental cash flow',multifamily:'scale from small properties into 5+ unit multifamily rentals'}[coachGoal];
 return 'I am researching how to '+goal+'. Act as a cautious Canadian real estate financing research assistant. Explain financing approaches, general eligibility questions, NOI and DSCR, cash reserves, refinancing pitfalls, important CMHC programs, and steps to verify up-to-date Bank of Canada rates and local rental laws. Separate facts from assumptions. Do not assume I qualify for a loan. Do not invent listings, rate quotes or returns. Give a prioritized action plan in plain language. This prompt intentionally includes no personal financial information.';
}
const SERIES={policy:'V39079',prime:'V80691311',bond:'V39053',posted:'V80691335'};
async function fetchRates(force=false){
 if(!force&&rates&&Date.now()-rateAt<30*60*1000)return rates;
 if(ratePending&&!force)return ratePending;
 ratePending=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
   try{
     const url='https://www.bankofcanada.ca/valet/observations/V39079,V80691311,V39053,V80691335/json?recent=80';
     const res=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});
     if(!res.ok)throw Error('Bank of Canada data service returned HTTP '+res.status);
     const data=await res.json(),out={};
     for(const [key,series] of Object.entries(SERIES))out[key]=latestValet(data,series);
     rates=out;rateAt=Date.now();return rates;
   }finally{clearTimeout(timer)}
 })();
 try{return await ratePending}finally{ratePending=null}
}
function paintRates(data,error){
 for(const [key] of Object.entries(SERIES)){
  document.querySelectorAll('[data-rate-key="'+key+'"]').forEach(el=>{el.textContent=data?.[key]?data[key].rate.toFixed(2)+'%':'—'});
  document.querySelectorAll('[data-rate-date="'+key+'"]').forEach(el=>{
   if(!data?.[key])el.textContent='Unavailable · open official source';
   else {
    const age=(Date.now()-Date.parse(data[key].date+'T00:00:00Z'))/86400000;
    el.textContent=(age>(key==='prime'||key==='posted'?14:7)?'Older observation · ':'As of ')+data[key].date;
   }
  });
 }
 document.querySelectorAll('[data-oak-rate-status]').forEach(el=>{
  el.textContent=error?'Unable to retrieve live data ('+error+'). Source links are available.':'Official observations retrieved. Observation dates shown; not lending offers.';
 });
}
export function hydrateExperience(route){
 if(route==='market'||route==='overview'){
  if(rates&&Date.now()-rateAt<30*60*1000)paintRates(rates);
  else fetchRates().then(x=>paintRates(x),err=>paintRates(null,err.message||'network error'));
 }
}
function refreshView(){window.dispatchEvent(new Event('hashchange'))}
function geoDistance(a,b,c,d){
 const rad=Math.PI/180,dl=(c-a)*rad,dn=(d-b)*rad,z=Math.sin(dl/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(dn/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));
}
function putCity(id){if(!cities.some(c=>c.id===id))return;city=id;try{localStorage.setItem('oakfolio.city',id)}catch{}refreshView()}
function prefill(x){window.dispatchEvent(new CustomEvent('oakfolio-prefill',{detail:{name:x.name,price:x.price,units:x.units}}))}
function showToast(message){const el=document.getElementById('toast');if(!el)return;el.textContent=message;el.style.display='block';clearTimeout(window.oakToastTimer);window.oakToastTimer=setTimeout(()=>el.style.display='none',5000)}
let installed=false;
export function activateExperience(){
 if(installed)return;installed=true;
 document.addEventListener('change',ev=>{
  const el=ev.target;
  if(el.id==='oak-city'){putCity(el.value);return}
  if(el.matches('[data-oak-scope]')){
   const scope=el.dataset.oakScope,key=el.name,target={refi,borrow,runway}[scope];
   if(!target||!Object.hasOwn(target,key))return;
   target[key]=el.value===''?'':Number(el.value);
   const scroll=window.scrollY;refreshView();window.scrollTo(0,scroll);
  }
 });
 document.addEventListener('submit',ev=>{
  if(ev.target.id!=='oak-add-property')return;
  ev.preventDefault();
  try{
   const f=new FormData(ev.target);
   const name=String(f.get('name')||'').trim(),url=new URL(String(f.get('url')||'')),price=Number(f.get('price')),units=Number(f.get('units'));
   if(!name||name.length>120||url.protocol!=='https:'||url.username||url.password||url.href.length>500||!Number.isFinite(price)||price<=0||price>1e9||!Number.isInteger(units)||units<1||units>10000)throw Error('Enter a valid name, HTTPS listing link, price and whole-number units.');
   const items=candidates();if(items.length>=40)throw Error('Your shortlist is full (40 properties).');
   writeCandidates([{id:crypto.randomUUID(),name,url:url.href,price,units,city:selectedCity().name},...items]);
   showToast('Added to your device-local shortlist.');refreshView();
  }catch(error){showToast('Could not save property: '+error.message)}
 });
 document.addEventListener('click',async ev=>{
  const goal=ev.target.closest('[data-oak-goal]');
  if(goal){if(Object.hasOwn(guidance,goal.dataset.oakGoal)){coachGoal=goal.dataset.oakGoal;refreshView()}return}
  const el=ev.target.closest('[data-oak-action]');if(!el)return;
  const act=el.dataset.oakAction;
  if(act==='rates-refresh'){
   el.disabled=true;paintRates(null,'Refreshing');
   try{const fresh=await fetchRates(true);paintRates(fresh)}catch(error){paintRates(null,error.message)}finally{el.disabled=false}
  }else if(act==='geolocate'){
   if(!navigator.geolocation){showToast('Location is not supported. Choose a city instead.');return}
   showToast('Your browser will request location permission. Coordinates are used only on your device.');
   navigator.geolocation.getCurrentPosition(pos=>{
    const list=cities.map(c=>({c,d:geoDistance(pos.coords.latitude,pos.coords.longitude,c.lat,c.lon)})).sort((a,b)=>a.d-b.d);
    if(list[0].d>250){showToast('No supported city within 250 km. Please choose your market manually.');return}
    putCity(list[0].c.id);showToast('Selected nearby market: '+list[0].c.name+'. Coordinates were not saved.');
   },()=>showToast('Location unavailable or denied. You can choose any city manually.'),{enableHighAccuracy:false,timeout:10000,maximumAge:600000});
  }else if(act==='analyze'){
   const item=candidates().find(x=>x.id===el.dataset.id);
   if(item)prefill(item);
  }else if(act==='delete'){
   const item=candidates().find(x=>x.id===el.dataset.id);
   if(item&&confirm('Remove '+item.name+' from your local shortlist?')){writeCandidates(candidates().filter(x=>x.id!==item.id));showToast('Prospect removed.');refreshView()}
  }else if(act==='copy-prompt'){
   try{await navigator.clipboard.writeText(promptText());showToast('Research prompt copied. Paste it into ChatGPT if you choose.')}
   catch{showToast('Clipboard blocked. Check browser permissions.')}
  }
 });
}

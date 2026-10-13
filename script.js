/* my 2026 list — simple tabbed wishlist, no dependencies */
const money = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'});
const products = [...document.querySelectorAll('.product')];
const intro = document.querySelector('.intro');
const totalSection = document.getElementById('total');
const finalTotal = document.getElementById('finalTotal');
const summary = document.getElementById('summary');
const gallery = document.querySelector('.final-gallery');
const disclaimer = document.getElementById('totalDisclaimer');
const tabButtons = [...document.querySelectorAll('[data-tab]')];
const topbarMeta = document.getElementById('topbarMeta');
const sectionLabel = document.getElementById('sectionLabel');
const runningTotal = document.getElementById('runningTotal');
const progress = document.getElementById('scrollProgress');
const introTitle = intro.querySelector('h1');
const introCount = intro.querySelector('.intro-count');
const introLink = intro.querySelector('.intro-link');
const mobileQuery = matchMedia('(max-width: 980px)');
const names = {christmas:'christmas',birthday:'birthday',both:'christmas / birthday'};
const priceKey = 'christmas-list-2026-custom-prices-v1';
let currentTab = 'christmas';
let savedPrices = {};
try { savedPrices = JSON.parse(localStorage.getItem(priceKey) || '{}') || {}; } catch { }
function activeProducts(){ return products.filter(p=>p.dataset.occasion === currentTab); }
function getRange(el) {
  if (el.dataset.priceMin && el.dataset.priceMax) return [Number(el.dataset.priceMin),Number(el.dataset.priceMax)];
  if (el.dataset.price !== undefined && el.dataset.price !== '') {
    const p = Number(el.dataset.price); return [p,p];
  }
  const v = savedPrices[el.id];
  return v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) ? [Number(v),Number(v)] : null;
}
function formatRange(range){
  if (!range) return 'check price';
  return range[0]===range[1] ? money.format(range[0]) : `${money.format(range[0])}–${money.format(range[1])}`;
}
function totalFor(items){
  let low=0,high=0,missing=0;
  for (const item of items){ const r=getRange(item); if(!r){missing++;continue;}low+=r[0];high+=r[1]; }
  return {low,high,missing};
}
function totalLabel(t){return formatRange([t.low,t.high]);}
function refreshTotals(){
  const visible = activeProducts();
  const t = totalFor(visible);
  visible.forEach(el=>{
    const currentPrice = el.querySelector('.pending-price');
    if(currentPrice) currentPrice.textContent=formatRange(getRange(el));
  });
  finalTotal.textContent = totalLabel(t);
  const all = totalFor(products);
  document.getElementById('overallPrice').textContent=totalLabel(all)+(all.missing?' +':'');
  document.getElementById('overallInfo').textContent=all.missing ? `${all.missing} prices still unknown` : 'all 12 items included';
  totalSection.querySelector('.eyebrow').textContent = names[currentTab] + ' total';
  disclaimer.textContent = t.missing === 0
    ? `${visible.length} items · ${currentTab==='christmas' ? 'crocs is a price range · ' : ''}prices can change at checkout.`
    : `${visible.length-t.missing} of ${visible.length} items priced · ${t.missing} price${t.missing===1?'':'s'} unknown. this is a subtotal, not the full cost.`;
  summary.replaceChildren();
  gallery.replaceChildren();
  visible.forEach((el,idx)=>{
    const name=el.dataset.name||el.querySelector('h2')?.textContent||'item';
    const range=getRange(el);
    const summaryRow=document.createElement('div');summaryRow.className='summary-row';
    const number=document.createElement('span');number.className='summary-num';number.textContent=String(idx+1).padStart(2,'0');
    const nameWrap=document.createElement('span');nameWrap.className='summary-name';nameWrap.textContent=name;
    const priority=document.createElement('small'); priority.textContent=(el.dataset.priority||'medium')+' priority';nameWrap.append(priority);
    const value=document.createElement('span');value.className='summary-price';value.textContent=formatRange(range);
    summaryRow.append(number,nameWrap,value);summary.append(summaryRow);
    const mainImage=el.querySelector('.gallery-main img')||el.querySelector('img');
    const card=document.createElement('article');card.className='final-item';
    const link=document.createElement('a');link.className='final-image';link.href='#'+el.id;link.setAttribute('aria-label','jump to '+name);
    if(mainImage){const image=document.createElement('img');image.src=mainImage.dataset.fallback||mainImage.src;image.alt=name;image.loading='lazy';image.decoding='async';link.append(image);}
    const meta=document.createElement('div');meta.className='final-meta';
    const title=document.createElement('span');title.textContent=name;
    const smallPrice=document.createElement('span');smallPrice.className='final-item-price';smallPrice.textContent=formatRange(range);
    meta.append(title,smallPrice);card.append(link,meta);gallery.append(card);
  });
  requestUpdate();
}
function changeTab(tab, jumpToTop=true){
  if (!names[tab]) return;
  currentTab=tab;
  document.body.dataset.occasion=tab;
  const active=activeProducts();
  for(const p of products){
    const shown=p.dataset.occasion===tab;
    p.hidden=!shown;
    if(shown){p.classList.remove('mobile-inview');p.style.removeProperty('--reveal');p.style.removeProperty('--copy-reveal');p.style.removeProperty('--detail-one');p.style.removeProperty('--detail-two');}
  }
  tabButtons.forEach(b=>{
    const selected=b.dataset.tab===tab;
    b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
  });
  introTitle.textContent='my 2026';introTitle.append(document.createElement('br'),document.createTextNode(tab==='both'?'christmas / birthday list':tab+' list'));
  introCount.textContent=`${active.length} things · ${names[tab]}`;
  introLink.href='#'+active[0].id;
  const collageIds=tab==='christmas'?['keyboard','headset','crocs']:tab==='birthday'?['mouse','azzaro','hoodie']:['ps5','gta6','mouse'];
  document.querySelectorAll('.photo-card img').forEach((img,i)=>{
    const el=document.getElementById(collageIds[i]);
    const source=el?.querySelector('.gallery-main img');
    if(source){img.src=source.dataset.fallback||source.src; img.alt=el.querySelector('h2')?.textContent||'wishlist photo';}
  });
  // The first photo collage stays the same personal selection across lists.
  topbarMeta.classList.remove('visible');
  refreshTotals();
  if(jumpToTop)window.scrollTo({top:0,behavior:'instant'});
  if(typeof revealObserver !== 'undefined' && revealObserver) {active.forEach(p=>{revealObserver.unobserve(p);revealObserver.observe(p);});}
  // If the document shrank from another tab, correct scroll and visible reveal state.
  requestUpdate();
}
let ticking=false;
function clamp(v){return Math.max(0,Math.min(1,v));}
function smoothstep(a,b,x){const t=clamp((x-a)/(b-a));return t*t*(3-2*t);}
function updateHeaderAndProgress(){
  const view=window.innerHeight;
  const max=document.documentElement.scrollHeight-view;
  progress.style.width=(max>0?100*clamp(window.scrollY/max):0)+'%';
  const list=activeProducts();if(!list.length)return;
  const reached=list[0].getBoundingClientRect().top<=view*.58;
  topbarMeta.classList.toggle('visible',reached);
  if(!reached)return;
  let active=0;
  const atTotal=totalSection.getBoundingClientRect().top<=view*.52;
  if(atTotal){sectionLabel.textContent='total';active=list.length-1;}
  else {
    let best=Infinity;
    list.forEach((el,i)=>{
      const r=el.getBoundingClientRect();
      const center=view*.49;
      const d=r.top<=center&&r.bottom>=center?0:Math.min(Math.abs(r.top-center),Math.abs(r.bottom-center));
      if(d<best){best=d;active=i;}
    });
    sectionLabel.textContent=`${String(active+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;
  }
  runningTotal.textContent=totalLabel(totalFor(list.slice(0,active+1)));
}
function revealDesktop(){
  if(mobileQuery.matches)return;
  const vh=window.innerHeight;
  for(const p of activeProducts()){
    const r=p.getBoundingClientRect();
    const length=Math.max(1,r.height-vh);
    const x=-r.top/length;
    p.style.setProperty('--reveal',smoothstep(0,.42,x).toFixed(3));
    p.style.setProperty('--copy-reveal',smoothstep(.1,.52,x).toFixed(3));
    p.style.setProperty('--detail-one',smoothstep(.24,.66,x).toFixed(3));
    p.style.setProperty('--detail-two',smoothstep(.36,.78,x).toFixed(3));
  }
}
function requestUpdate(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{updateHeaderAndProgress();revealDesktop();ticking=false;});}
tabButtons.forEach(button=>button.addEventListener('click',()=>changeTab(button.dataset.tab)));
for(const input of document.querySelectorAll('[data-price-input]')){
  if(savedPrices[input.dataset.priceInput]!==undefined) input.value=savedPrices[input.dataset.priceInput];
  input.addEventListener('input',()=>{
    const k=input.dataset.priceInput;
    if(input.value!==''&&Number.isFinite(Number(input.value))&&Number(input.value)>=0) savedPrices[k]=Number(input.value);
    else delete savedPrices[k];
    try{localStorage.setItem(priceKey,JSON.stringify(savedPrices));}catch{}
    refreshTotals();
  });
}
for(const button of document.querySelectorAll('[data-detail]')){
  button.addEventListener('click',()=>{
    const panel=document.getElementById(button.dataset.detail);if(!panel)return;
    const opening=panel.hidden;panel.hidden=!opening;
    button.setAttribute('aria-expanded',String(opening));button.textContent=opening?'Hide information':'View information';
  });
}
for(const button of document.querySelectorAll('.note-trigger')){
  button.addEventListener('click',()=>{
    const opening=button.getAttribute('aria-expanded')!=='true';
    document.querySelectorAll('.note-trigger').forEach(x=>x.setAttribute('aria-expanded','false'));
    button.setAttribute('aria-expanded',String(opening));
  });
}
for(const img of document.querySelectorAll('img[data-fallback]')){
  img.addEventListener('error',()=>{if(img.dataset.usedFallback||!img.dataset.fallback)return;img.dataset.usedFallback='1';img.src=img.dataset.fallback;});
}
for(const img of document.querySelectorAll('.amazon-photo img, .gta-cover img')){
  img.addEventListener('error',()=>{
    const holder=img.closest('figure');if(!holder||holder.querySelector('.image-unavailable'))return;
    const message=document.createElement('span');message.className='image-unavailable';
    message.textContent='photo unavailable · tap buy to see the product';holder.append(message);img.hidden=true;
  });
}
let revealObserver=null;
if('IntersectionObserver' in window){
  revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('mobile-inview');});
  },{threshold:.05,rootMargin:'0px 0px -10% 0px'});
  products.forEach(x=>revealObserver.observe(x));
}else products.forEach(x=>x.classList.add('mobile-inview'));
addEventListener('scroll',requestUpdate,{passive:true});
addEventListener('resize',requestUpdate,{passive:true});
mobileQuery.addEventListener?.('change',requestUpdate);
const hash=location.hash.slice(1);
const initialProduct=products.find(p=>p.id===hash);
changeTab(initialProduct?.dataset.occasion || (names[hash]?hash:'christmas'),false);
if(initialProduct)requestAnimationFrame(()=>initialProduct.scrollIntoView({behavior:'instant',block:'start'}));
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

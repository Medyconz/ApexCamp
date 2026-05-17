let siteConfigPromise;
let activeCampPricing={1:{1:185,2:333,3:471,4:592},2:{1:333,2:599,3:849,4:1065},3:{1:471,2:849,3:1202,4:1509}};

function ensureEnhancementStyles(){
  if(document.querySelector('link[href="enhancements.css"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='enhancements.css';
  document.head.appendChild(link);
}

function getSiteConfig(){
  if(!siteConfigPromise){
    siteConfigPromise=fetch('/api/site-config').then((response)=>response.ok?response.json():Promise.reject(new Error('Site settings are not available.')));
  }
  return siteConfigPromise;
}

function escapeHtml(value){
  return String(value||'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function initMobileNav(){
  document.querySelectorAll('.site-header').forEach((header)=>{
    const nav=header.querySelector('.site-nav');
    if(!nav||header.querySelector('.menu-toggle'))return;
    const button=document.createElement('button');
    button.className='menu-toggle';
    button.type='button';
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-label','Open menu');
    button.innerHTML='<span></span><span></span><span></span>';
    header.insertBefore(button,nav);
    button.addEventListener('click',()=>{
      const open=header.classList.toggle('nav-open');
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Close menu':'Open menu');
    });
    nav.querySelectorAll('a').forEach((link)=>link.addEventListener('click',()=>{
      header.classList.remove('nav-open');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Open menu');
    }));
  });
}

function normalizePricing(pricing){
  if(!pricing)return activeCampPricing;
  if(Array.isArray(pricing)){
    return pricing.reduce((matrix,row)=>{
      const children=Number(row.children);
      if(!children)return matrix;
      matrix[children]={1:Number(row.week_1)||0,2:Number(row.week_2)||0,3:Number(row.week_3)||0,4:Number(row.week_4)||0};
      return matrix;
    },{});
  }
  return pricing;
}

async function renderCampWeeks(config){
  const target=document.querySelector('[data-required-group="camp_weeks"] .choice-list');
  if(!target)return;
  try{
    config=config||await getSiteConfig();
    const weeks=(config.camp_weeks||[]).filter((week)=>week.active!==false);
    if(!weeks.length)return;
    target.innerHTML=weeks.map((week)=>`<label class="choice"><input type="checkbox" name="camp_weeks" value="${escapeHtml(week.label)}"> ${escapeHtml(week.label)}</label>`).join('');
  }catch(error){
    console.warn(error);
  }
}

function renderPricingTable(config){
  if(config?.camp_pricing)activeCampPricing=normalizePricing(config.camp_pricing);
  const body=document.querySelector('.pricing-table tbody');
  if(!body)return;
  body.innerHTML=[1,2,3].map((children)=>{
    const row=activeCampPricing[children]||{};
    return `<tr><th>${children} ${children===1?'Child':'Children'}</th><td>${formatPrice(row[1])}</td><td>${formatPrice(row[2])}</td><td>${formatPrice(row[3])}</td><td>${formatPrice(row[4])}</td></tr>`;
  }).join('');
}

function renderPaymentInfo(config){
  const panel=document.querySelector('#payment-info');
  if(!panel)return;
  const settings=config?.payment_settings||{};
  const instructions=settings.instructions||'Your registration will be saved first. The Apex Camp team will contact you to confirm availability and payment details.';
  const link=settings.payment_link||'';
  panel.querySelector('[data-payment-instructions]').textContent=instructions;
  const linkTarget=panel.querySelector('[data-payment-link]');
  if(link){
    linkTarget.href=link;
    linkTarget.hidden=false;
  }else{
    linkTarget.hidden=true;
  }
}

async function renderMerch(config){
  const target=document.querySelector('#merch-products');
  if(!target)return;
  try{
    config=config||await getSiteConfig();
    const products=(config.merch_products||[]).filter((product)=>product.active!==false);
    if(!products.length){
      target.innerHTML='<article><h2>Merch coming soon</h2><p>Apex Camp products will appear here once they are added in the admin dashboard.</p></article>';
      return;
    }
    target.innerHTML=products.map((product)=>`<article class="merch-card">${product.image_url?`<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">`:''}<div><h2>${escapeHtml(product.name)}</h2>${product.price?`<strong>${escapeHtml(product.price)}</strong>`:''}${product.description?`<p>${escapeHtml(product.description)}</p>`:''}${product.buy_url?`<a class="button" href="${escapeHtml(product.buy_url)}">Buy Now</a>`:''}</div></article>`).join('');
  }catch(error){
    target.innerHTML='<article><h2>Merch loading soon</h2><p>Please refresh in a moment.</p></article>';
  }
}

function initRegistrationTools(){
  const form=document.querySelector('.camp-form[data-endpoint="/api/register"]');
  if(!form)return;
  const childSelect=form.querySelector('#child-count');
  form.querySelector('[data-required-group="camp_weeks"]')?.addEventListener('change',()=>updateRegistrationPrice(form));
  childSelect?.addEventListener('change',()=>{updateStudentSections(form);updateRegistrationPrice(form)});
  updateStudentSections(form);
  updateRegistrationPrice(form);
}

function updateStudentSections(form){
  const count=Number(form.querySelector('#child-count')?.value||1);
  form.querySelectorAll('.student-section').forEach((section)=>{
    const studentNumber=Number(section.dataset.student||1);
    const active=studentNumber<=count;
    section.hidden=!active;
    section.querySelectorAll('[data-required-when-active]').forEach((field)=>{field.required=active});
  });
}

function updateRegistrationPrice(form){
  const weekCount=form.querySelectorAll('input[name="camp_weeks"]:checked').length;
  const childCount=Number(form.querySelector('#child-count')?.value||1);
  const estimate=form.querySelector('#price-estimate');
  const totalWeeks=form.querySelector('#total-weeks');
  const estimatedTotal=form.querySelector('#estimated-total-kd');
  if(totalWeeks)totalWeeks.value=String(weekCount);
  if(estimatedTotal)estimatedTotal.value='';
  if(!estimate)return;
  if(!weekCount){
    estimate.textContent='Choose camp dates to see the estimated total.';
    return;
  }
  if(weekCount>4){
    estimate.textContent=`${weekCount} weeks selected for ${childCount} ${childCount===1?'child':'children'}. The Apex Camp team will confirm pricing for 5 or more weeks.`;
    return;
  }
  const price=activeCampPricing[childCount]?.[weekCount];
  if(estimatedTotal&&price)estimatedTotal.value=String(price);
  estimate.textContent=price?`Estimated total: ${price} KD for ${childCount} ${childCount===1?'child':'children'} and ${weekCount} ${weekCount===1?'week':'weeks'}.`:'The Apex Camp team will confirm pricing for this selection.';
}

function formatPrice(value){
  const number=Number(value);
  return number?`${number} KD`:'Confirm';
}

function showRegistrationSummary(form,data,result){
  const target=document.querySelector('#registration-summary');
  if(!target)return;
  const weeks=Array.isArray(data.camp_weeks)?data.camp_weeks:[data.camp_weeks].filter(Boolean);
  const childCount=Number(data.child_count||1);
  const total=data.estimated_total_kd?`${data.estimated_total_kd} KD`:'To be confirmed';
  target.hidden=false;
  target.innerHTML=`<h2>Registration saved</h2><p>${escapeHtml(result.message||'Thank you. Your form was saved for the Apex Camp team.')}</p><dl><div><dt>Children</dt><dd>${childCount}</dd></div><div><dt>Weeks</dt><dd>${weeks.length}</dd></div><div><dt>Estimated total</dt><dd>${escapeHtml(total)}</dd></div><div><dt>Selected dates</dt><dd>${escapeHtml(weeks.join(', '))}</dd></div></dl><p class="form-hint">Apex Camp will contact you using the parent/guardian details to confirm availability and payment.</p>`;
  target.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function fileToUpload(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.name||!file.size){resolve('');return;}
    if(file.size>4*1024*1024){reject(new Error(`${file.name} must be smaller than 4 MB.`));return;}
    const reader=new FileReader();
    reader.onload=()=>resolve({name:file.name,type:file.type||'application/octet-stream',size:file.size,data_url:reader.result});
    reader.onerror=()=>reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function formDataToJson(form){
  const data={};
  for(const [key,value] of new FormData(form).entries()){
    const prepared=value instanceof File?await fileToUpload(value):value;
    if(prepared==='')continue;
    if(data[key]){data[key]=Array.isArray(data[key])?data[key]:[data[key]];data[key].push(prepared)}
    else data[key]=prepared;
  }
  return data;
}

async function initDynamicSite(){
  ensureEnhancementStyles();
  initMobileNav();
  try{
    const config=await getSiteConfig();
    await renderCampWeeks(config);
    renderPricingTable(config);
    renderPaymentInfo(config);
    await renderMerch(config);
  }catch(error){
    renderPricingTable();
    renderPaymentInfo();
    await renderMerch();
  }
  initRegistrationTools();
}

initDynamicSite();

document.querySelectorAll('.camp-form').forEach((form)=>{
  const message=form.querySelector('.form-message');
  form.addEventListener('submit',async(event)=>{
    if(!form.dataset.endpoint)return;
    event.preventDefault();
    if(form.dataset.endpoint==='/api/register')updateRegistrationPrice(form);
    const missingGroup=[...form.querySelectorAll('[data-required-group]')].find((group)=>!group.querySelector('input[type="checkbox"]:checked'));
    if(missingGroup){
      const legend=missingGroup.querySelector('legend')?.textContent||'This section';
      if(message)message.textContent=`Please choose at least one option for ${legend}.`;
      missingGroup.querySelector('input[type="checkbox"]')?.focus();
      return;
    }
    if(!form.checkValidity()){
      form.reportValidity();
      if(message)message.textContent='Please complete the required fields.';
      return;
    }
    const button=form.querySelector('button[type="submit"]');
    const oldLabel=button?button.textContent:'';
    if(button){button.disabled=true;button.textContent='Submitting...'}
    if(message)message.textContent='Sending your form...';
    try{
      const data=await formDataToJson(form);
      const response=await fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'The form could not be submitted.');
      if(form.dataset.endpoint==='/api/register')showRegistrationSummary(form,data,result);
      form.reset();
      if(form.dataset.endpoint==='/api/register'){
        updateStudentSections(form);
        updateRegistrationPrice(form);
      }
      if(message)message.textContent=result.message||'Thank you. Your form was saved for the Apex Camp team.';
    }catch(error){
      if(message)message.textContent=error.message||'The backend is not reachable yet.';
    }finally{
      if(button){button.disabled=false;button.textContent=oldLabel}
    }
  });
});

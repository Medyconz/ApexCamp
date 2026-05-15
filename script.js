let siteConfigPromise;

function getSiteConfig(){
  if(!siteConfigPromise){
    siteConfigPromise=fetch('/api/site-config').then((response)=>response.ok?response.json():Promise.reject(new Error('Site settings are not available.')));
  }
  return siteConfigPromise;
}

function escapeHtml(value){
  return String(value||'').replace(/[&<>\"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[char]));
}

async function renderCampWeeks(){
  const target=document.querySelector('[data-required-group="camp_weeks"] .choice-list');
  if(!target)return;
  try{
    const config=await getSiteConfig();
    const weeks=(config.camp_weeks||[]).filter((week)=>week.active!==false);
    if(!weeks.length)return;
    target.innerHTML=weeks.map((week)=>`<label class="choice"><input type="checkbox" name="camp_weeks" value="${escapeHtml(week.label)}"> ${escapeHtml(week.label)}</label>`).join('');
  }catch(error){
    console.warn(error);
  }
}

async function renderMerch(){
  const target=document.querySelector('#merch-products');
  if(!target)return;
  try{
    const config=await getSiteConfig();
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

renderCampWeeks();
renderMerch();

document.querySelectorAll('.camp-form').forEach((form)=>{
  const message=form.querySelector('.form-message');
  form.addEventListener('submit',async(event)=>{
    if(!form.dataset.endpoint)return;
    event.preventDefault();
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
    const data={};
    new FormData(form).forEach((value,key)=>{
      if(data[key]){data[key]=Array.isArray(data[key])?data[key]:[data[key]];data[key].push(value)}
      else data[key]=value;
    });
    try{
      const response=await fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'The form could not be submitted.');
      form.reset();
      if(message)message.textContent=result.message||'Thank you. Your form was saved for the Apex Camp team.';
    }catch(error){
      if(message)message.textContent=error.message||'The backend is not reachable yet.';
    }finally{
      if(button){button.disabled=false;button.textContent=oldLabel}
    }
  });
});

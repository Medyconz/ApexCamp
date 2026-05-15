const tokenKey='apexAdminToken';
const loginForm=document.querySelector('#admin-login');
const tokenInput=document.querySelector('#admin-token');
const loginMessage=document.querySelector('#admin-login-message');
const dashboard=document.querySelector('#admin-dashboard');
const logoutButton=document.querySelector('#admin-logout');
const statsTarget=document.querySelector('#admin-stats');
const tableHead=document.querySelector('#admin-table-head');
const tableBody=document.querySelector('#admin-table-body');
const mainTabs=document.querySelectorAll('.admin-main-tabs button');
const recordTabs=document.querySelectorAll('.record-tabs button');
const panels=document.querySelectorAll('[data-admin-panel]');
const searchInput=document.querySelector('#admin-search');
const refreshButton=document.querySelector('#admin-refresh');
const exportButton=document.querySelector('#admin-export');
const adminMessage=document.querySelector('#admin-message');
const weekEditor=document.querySelector('#week-editor');
const productEditor=document.querySelector('#product-editor');
const weeksForm=document.querySelector('#weeks-form');
const productsForm=document.querySelector('#products-form');
const addWeekButton=document.querySelector('#add-week');
const addProductButton=document.querySelector('#add-product');
const tableConfig={registrations:['id','created_at','status','camp_weeks','child_count','total_weeks','estimated_total_kd','parent_guardian_name','parent_guardian_email','parent_guardian_phone','emergency_contact_name','emergency_contact_mobile','student_1_name','student_1_date_of_birth','student_1_has_medical_condition','student_1_medical_condition_details','student_2_name','student_2_date_of_birth','student_2_has_medical_condition','student_2_medical_condition_details','student_3_name','student_3_date_of_birth','student_3_has_medical_condition','student_3_medical_condition_details'],counsellors:['id','created_at','status','name','email','phone','age','availability','experience','motivation'],instructors:['id','created_at','status','name','email','phone','specialty','availability','experience','motivation'],contacts:['id','created_at','status','name','email','phone','message']};
let currentType='registrations';
let rows=[];
let siteConfig={camp_weeks:[],merch_products:[]};

if(loginForm){
  const savedToken=localStorage.getItem(tokenKey);
  if(savedToken){tokenInput.value=savedToken;openDashboard()}
  loginForm.addEventListener('submit',(event)=>{event.preventDefault();localStorage.setItem(tokenKey,tokenInput.value.trim());openDashboard()});
}
logoutButton?.addEventListener('click',()=>{localStorage.removeItem(tokenKey);dashboard.hidden=true;logoutButton.hidden=true;loginForm.hidden=false;tokenInput.value=''});
mainTabs.forEach((tab)=>tab.addEventListener('click',()=>showPanel(tab.dataset.panel)));
recordTabs.forEach((tab)=>{tab.addEventListener('click',()=>{recordTabs.forEach((item)=>item.classList.remove('is-active'));tab.classList.add('is-active');currentType=tab.dataset.type;loadRows()})});
searchInput?.addEventListener('input',()=>renderTable());
refreshButton?.addEventListener('click',()=>loadAll());
exportButton?.addEventListener('click',()=>exportCsv());
addWeekButton?.addEventListener('click',()=>{siteConfig.camp_weeks.push({id:`week-${siteConfig.camp_weeks.length+1}`,label:'New week',active:true});renderWeekEditor()});
addProductButton?.addEventListener('click',()=>{siteConfig.merch_products.push({id:`product-${siteConfig.merch_products.length+1}`,name:'New product',price:'',image_url:'',description:'',buy_url:'',active:true});renderProductEditor()});
weeksForm?.addEventListener('submit',async(event)=>{event.preventDefault();siteConfig.camp_weeks=collectWeeks();await saveSiteConfig('Registration dates saved.')});
productsForm?.addEventListener('submit',async(event)=>{event.preventDefault();siteConfig.merch_products=collectProducts();await saveSiteConfig('Merch products saved.')});

function showPanel(name){
  mainTabs.forEach((tab)=>tab.classList.toggle('is-active',tab.dataset.panel===name));
  panels.forEach((panel)=>{panel.hidden=panel.dataset.adminPanel!==name});
}
async function openDashboard(){loginForm.hidden=true;dashboard.hidden=false;logoutButton.hidden=false;await loadAll();await loadSiteConfig()}
async function loadAll(){await Promise.all([loadSummary(),loadRows()])}
async function loadSummary(){try{const data=await adminFetch('/api/admin/summary');statsTarget.innerHTML=data.summary.map((item)=>`<article><span>${item.label}</span><strong>${item.total}</strong><small>${item.new_count} new</small></article>`).join('');loginMessage.textContent=''}catch(error){showAdminError(error)}}
async function loadRows(){try{const data=await adminFetch(`/api/admin/submissions?type=${currentType}`);rows=data.rows||[];renderTable();adminMessage.textContent=`${rows.length} records loaded.`}catch(error){showAdminError(error)}}
async function loadSiteConfig(){try{siteConfig=await adminFetch('/api/admin/site-config');renderWeekEditor();renderProductEditor()}catch(error){showAdminError(error)}}
function renderTable(){const columns=tableConfig[currentType];const query=searchInput.value.trim().toLowerCase();const visibleRows=rows.filter((row)=>JSON.stringify(row).toLowerCase().includes(query));tableHead.innerHTML=`<tr>${columns.map((column)=>`<th>${formatColumn(column)}</th>`).join('')}<th>Action</th></tr>`;tableBody.innerHTML=visibleRows.map((row)=>`<tr>${columns.map((column)=>`<td>${formatValue(row[column])}</td>`).join('')}<td><select data-id="${row.id}" aria-label="Update status for record ${row.id}">${['new','reviewed','contacted','accepted','archived'].map((status)=>`<option value="${status}" ${row.status===status?'selected':''}>${status}</option>`).join('')}</select></td></tr>`).join('');tableBody.querySelectorAll('select').forEach((select)=>{select.addEventListener('change',()=>updateStatus(select.dataset.id,select.value))})}
function renderWeekEditor(){if(!weekEditor)return;weekEditor.innerHTML=(siteConfig.camp_weeks||[]).map((week,index)=>`<article class="editor-row" data-index="${index}"><label>Week label <input data-field="label" value="${escapeAttr(week.label)}" required></label><label class="check-row"><input type="checkbox" data-field="active" ${week.active!==false?'checked':''}> Active on registration form</label><button class="button secondary" type="button" data-remove-week="${index}">Remove</button></article>`).join('');weekEditor.querySelectorAll('[data-remove-week]').forEach((button)=>button.addEventListener('click',()=>{siteConfig.camp_weeks.splice(Number(button.dataset.removeWeek),1);renderWeekEditor()}))}
function renderProductEditor(){
  if(!productEditor)return;
  productEditor.innerHTML=(siteConfig.merch_products||[]).map((product,index)=>`<article class="editor-row product-row" data-index="${index}"><label>Product name <input data-field="name" value="${escapeAttr(product.name)}" required></label><label>Price <input data-field="price" value="${escapeAttr(product.price)}" placeholder="8 KWD"></label><div class="wide-field image-upload-field"><span>Product image</span><div class="image-upload-preview">${product.image_url?`<img src="${escapeAttr(product.image_url)}" alt="${escapeAttr(product.name||'Product image')}">`:'<span>No image uploaded</span>'}</div><input type="hidden" data-field="image_url" value="${escapeAttr(product.image_url)}"><label class="upload-button">Upload image <input type="file" accept="image/*" data-image-upload></label><button class="button secondary" type="button" data-clear-image>Clear Image</button></div><label>Buy link <input data-field="buy_url" value="${escapeAttr(product.buy_url)}" placeholder="https://..."></label><label class="wide-field">Description <textarea data-field="description" rows="3">${escapeHtml(product.description)}</textarea></label><label class="check-row"><input type="checkbox" data-field="active" ${product.active!==false?'checked':''}> Visible on merch page</label><button class="button secondary" type="button" data-remove-product="${index}">Remove</button></article>`).join('');
  productEditor.querySelectorAll('[data-remove-product]').forEach((button)=>button.addEventListener('click',()=>{siteConfig.merch_products.splice(Number(button.dataset.removeProduct),1);renderProductEditor()}));
  productEditor.querySelectorAll('[data-clear-image]').forEach((button)=>button.addEventListener('click',()=>{const row=button.closest('.editor-row');row.querySelector('[data-field="image_url"]').value='';row.querySelector('.image-upload-preview').innerHTML='<span>No image uploaded</span>'}));
  productEditor.querySelectorAll('[data-image-upload]').forEach((input)=>input.addEventListener('change',async()=>{const file=input.files&&input.files[0];if(!file)return;try{adminMessage.textContent='Preparing image...';const dataUrl=await resizeImageFile(file);const row=input.closest('.editor-row');row.querySelector('[data-field="image_url"]').value=dataUrl;row.querySelector('.image-upload-preview').innerHTML=`<img src="${dataUrl}" alt="Uploaded product image">`;adminMessage.textContent='Image ready. Save merch products to publish it.'}catch(error){adminMessage.textContent=error.message||'Image upload failed.'}finally{input.value=''}}));
}
function collectWeeks(){return [...weekEditor.querySelectorAll('.editor-row')].map((row,index)=>({id:`week-${index+1}`,label:row.querySelector('[data-field="label"]').value.trim(),active:row.querySelector('[data-field="active"]').checked})).filter((week)=>week.label)}
function collectProducts(){return [...productEditor.querySelectorAll('.editor-row')].map((row,index)=>({id:`product-${index+1}`,name:row.querySelector('[data-field="name"]').value.trim(),price:row.querySelector('[data-field="price"]').value.trim(),image_url:row.querySelector('[data-field="image_url"]').value.trim(),buy_url:row.querySelector('[data-field="buy_url"]').value.trim(),description:row.querySelector('[data-field="description"]').value.trim(),active:row.querySelector('[data-field="active"]').checked})).filter((product)=>product.name)}
async function saveSiteConfig(message){try{const data=await adminFetch('/api/admin/site-config',{method:'PUT',body:JSON.stringify(siteConfig)});siteConfig=data.config;renderWeekEditor();renderProductEditor();adminMessage.textContent=message}catch(error){showAdminError(error)}}
async function updateStatus(id,status){try{await adminFetch('/api/admin/submissions',{method:'PATCH',body:JSON.stringify({type:currentType,id,status})});adminMessage.textContent=`Record ${id} updated to ${status}.`;const row=rows.find((item)=>item.id===id||item.id===Number(id));if(row)row.status=status;await loadSummary()}catch(error){showAdminError(error)}}
async function adminFetch(path,options={}){const response=await fetch(path,{...options,headers:{'Content-Type':'application/json','Authorization':`Bearer ${getToken()}`,...(options.headers||{})}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Admin request failed.');return data}
async function exportCsv(){try{const response=await fetch(`/api/admin/export?type=${currentType}`,{headers:{'Authorization':`Bearer ${getToken()}`}});if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'CSV export failed.')}const blob=await response.blob();const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`apex-${currentType}.csv`;link.click();URL.revokeObjectURL(link.href)}catch(error){showAdminError(error)}}
function resizeImageFile(file){
  if(!file.type.startsWith('image/'))return Promise.reject(new Error('Please upload an image file.'));
  if(file.size>10*1024*1024)return Promise.reject(new Error('Please upload an image smaller than 10 MB.'));
  return readFile(file).then(loadImage).then((image)=>{
    const maxSize=1000;
    const scale=Math.min(1,maxSize/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',0.82);
  });
}
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read image file.'));reader.readAsDataURL(file)})}
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not prepare image.'));image.src=src})}
function getToken(){return localStorage.getItem(tokenKey)||tokenInput.value.trim()}
function showAdminError(error){loginForm.hidden=false;dashboard.hidden=true;logoutButton.hidden=true;loginMessage.textContent=`${error.message} Check your admin token or backend deployment.`}
function formatColumn(column){return column.replaceAll('_',' ')}
function formatValue(value){if(value===null||value===undefined||value==='')return '';if(Array.isArray(value))return escapeHtml(value.join(', '));return escapeHtml(String(value))}
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function escapeAttr(value){return escapeHtml(value).replaceAll('`','&#096;')}

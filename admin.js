const tokenKey = 'apexAdminToken';
const auditKey = 'apexAdminAuditTrail';
const whatsappHistoryKey = 'apexWhatsAppWebHistory';
const resources = [
  { key: 'dashboard', label: 'Dashboard', panel: 'dashboard', hint: 'Overview', keywords: ['home', 'overview'] },
  { key: 'records', label: 'Submissions', panel: 'records', hint: 'Registrations and messages', keywords: ['database', 'registrations', 'contacts', 'applications'] },
  { key: 'dates', label: 'Registration Dates', panel: 'dates', hint: 'Camp weeks', keywords: ['weeks', 'dates', 'calendar'] },
  { key: 'pricing', label: 'Pricing & Payment', panel: 'pricing', hint: 'Prices and payment', keywords: ['payment', 'price', 'kd'] },
  { key: 'merch', label: 'Merch Products', panel: 'merch', hint: 'Products', keywords: ['shop', 'products', 'catalog'] },
  { key: 'whatsapp', label: 'WhatsApp Web', panel: 'whatsapp', hint: 'Open chats in WhatsApp Web', keywords: ['whatsapp', 'messages', 'business', 'web'] },
  { key: 'audit', label: 'Audit Trail', panel: 'audit', hint: 'Actions', keywords: ['log', 'history', 'actions'] }
];
const statusList = ['new', 'reviewed', 'contacted', 'accepted', 'archived'];
const tableConfig = {
  registrations: ['id', 'created_at', 'status', 'camp_weeks', 'child_count', 'total_weeks', 'estimated_total_kd', 'parent_guardian_name', 'parent_guardian_email', 'parent_guardian_phone', 'emergency_contact_name', 'emergency_contact_mobile', 'student_1_name', 'student_1_date_of_birth', 'student_1_has_medical_condition', 'student_1_medical_condition_details', 'student_2_name', 'student_2_date_of_birth', 'student_2_has_medical_condition', 'student_2_medical_condition_details', 'student_3_name', 'student_3_date_of_birth', 'student_3_has_medical_condition', 'student_3_medical_condition_details'],
  counsellors: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'age', 'availability', 'experience', 'motivation'],
  instructors: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'specialty', 'availability', 'experience', 'civil_id_file', 'resume_file', 'motivation'],
  contacts: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'message']
};
const loginForm = document.querySelector('#admin-login');
const tokenInput = document.querySelector('#admin-token');
const loginMessage = document.querySelector('#admin-login-message');
const dashboard = document.querySelector('#admin-dashboard');
const logoutButton = document.querySelector('#admin-logout');
const statsTarget = document.querySelector('#admin-stats');
const attentionCards = document.querySelector('#attention-cards');
const tableHead = document.querySelector('#admin-table-head');
const tableBody = document.querySelector('#admin-table-body');
const panels = document.querySelectorAll('[data-admin-panel]');
const resourceNav = document.querySelector('#admin-resource-nav');
const breadcrumbs = document.querySelector('#admin-breadcrumbs');
const searchInput = document.querySelector('#admin-search');
const filterPanel = document.querySelector('#admin-filters');
const filterStatus = document.querySelector('#filter-status');
const filterWeek = document.querySelector('#filter-week');
const filterChildren = document.querySelector('#filter-children');
const filterTotal = document.querySelector('#filter-total');
const refreshButton = document.querySelector('#admin-refresh');
const recordsRefreshButton = document.querySelector('#records-refresh');
const exportButton = document.querySelector('#admin-export');
const adminMessage = document.querySelector('#admin-message');
const recordTabs = document.querySelectorAll('.record-tabs button');
const selectionBar = document.querySelector('#selection-bar');
const selectionCount = document.querySelector('#selection-count');
const clearSelectionButton = document.querySelector('#clear-selection');
const exportSelectedButton = document.querySelector('#export-selected');
const deleteSelectedButton = document.querySelector('#delete-selected');
const rowsPerPageSelect = document.querySelector('#rows-per-page');
const pagePrev = document.querySelector('#page-prev');
const pageNext = document.querySelector('#page-next');
const pageStatus = document.querySelector('#page-status');
const weekEditor = document.querySelector('#week-editor');
const productEditor = document.querySelector('#product-editor');
const pricingEditor = document.querySelector('#pricing-editor');
const weeksForm = document.querySelector('#weeks-form');
const productsForm = document.querySelector('#products-form');
const pricingForm = document.querySelector('#pricing-form');
const addWeekButton = document.querySelector('#add-week');
const addProductButton = document.querySelector('#add-product');
const commandOpen = document.querySelector('#command-open');
const commandClose = document.querySelector('#command-close');
const commandDialog = document.querySelector('#command-dialog');
const commandInput = document.querySelector('#command-input');
const commandResults = document.querySelector('#command-results');
const detailDrawer = document.querySelector('#detail-drawer');
const detailContent = document.querySelector('#detail-content');
const auditList = document.querySelector('#audit-list');
const auditClearButton = document.querySelector('#audit-clear');
const mobileAdminToggle = document.querySelector('#mobile-admin-toggle');
const adminSidebar = document.querySelector('#admin-sidebar');
const whatsappWebForm = document.querySelector('#whatsapp-web-form');
const whatsappTo = document.querySelector('#whatsapp-to');
const whatsappMessage = document.querySelector('#whatsapp-message');
const whatsappMessageStatus = document.querySelector('#whatsapp-message-status');
const whatsappHistory = document.querySelector('#whatsapp-history');
const whatsappHistoryClear = document.querySelector('#whatsapp-history-clear');
let currentPanel = 'dashboard';
let currentType = 'registrations';
let rows = [];
let summaryRows = [];
let selectedIds = new Set();
let page = 1;
let siteConfig = { camp_weeks: [], camp_pricing: [], payment_settings: {}, merch_products: [] };

renderResourceNav();
renderCommandResults('');
renderAuditTrail();
renderWhatsAppHistory();

if (loginForm) {
  const savedToken = localStorage.getItem(tokenKey);
  if (savedToken) {
    tokenInput.value = savedToken;
    openDashboard();
  }
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    localStorage.setItem(tokenKey, tokenInput.value.trim());
    pushAudit('auth.login', 'Admin dashboard opened');
    openDashboard();
  });
}
logoutButton?.addEventListener('click', () => {
  pushAudit('auth.logout', 'Admin logged out');
  localStorage.removeItem(tokenKey);
  dashboard.hidden = true;
  logoutButton.hidden = true;
  loginForm.hidden = false;
  tokenInput.value = '';
});
refreshButton?.addEventListener('click', () => loadAll());
recordsRefreshButton?.addEventListener('click', () => loadRows());
exportButton?.addEventListener('click', () => exportRows(getVisibleRows(), `${currentType}-filtered`));
exportSelectedButton?.addEventListener('click', () => exportRows(rows.filter((row) => selectedIds.has(String(row.id))), `${currentType}-selected`));
deleteSelectedButton?.addEventListener('click', () => deleteRecords([...selectedIds]));
clearSelectionButton?.addEventListener('click', () => { selectedIds.clear(); renderTable(); });
[searchInput, filterStatus, filterWeek, filterChildren, filterTotal].forEach((input) => input?.addEventListener('input', () => { page = 1; renderTable(); }));
rowsPerPageSelect?.addEventListener('change', () => { page = 1; renderTable(); });
pagePrev?.addEventListener('click', () => { if (page > 1) { page -= 1; renderTable(); } });
pageNext?.addEventListener('click', () => { page += 1; renderTable(); });
recordTabs.forEach((tab) => tab.addEventListener('click', () => {
  recordTabs.forEach((item) => item.classList.remove('is-active'));
  tab.classList.add('is-active');
  currentType = tab.dataset.type;
  selectedIds.clear();
  page = 1;
  loadRows();
}));
addWeekButton?.addEventListener('click', () => {
  siteConfig.camp_weeks.push({ id: `week-${siteConfig.camp_weeks.length + 1}`, label: 'New week', active: true });
  renderWeekEditor();
});
addProductButton?.addEventListener('click', () => {
  siteConfig.merch_products.push({ id: `product-${siteConfig.merch_products.length + 1}`, name: 'New product', price: '', image_url: '', description: '', buy_url: '', active: true });
  renderProductEditor();
});
weeksForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  siteConfig.camp_weeks = collectWeeks();
  await saveSiteConfig('Registration dates saved.', 'site.edit_dates');
});
productsForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  siteConfig.merch_products = collectProducts();
  await saveSiteConfig('Merch products saved.', 'site.edit_merch');
});
pricingForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  siteConfig.camp_pricing = collectPricing();
  siteConfig.payment_settings = collectPaymentSettings();
  await saveSiteConfig('Pricing and payment saved.', 'site.edit_pricing');
});
whatsappWebForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  openWhatsAppChat(whatsappTo.value, whatsappMessage.value, 'Manual chat');
});
whatsappHistoryClear?.addEventListener('click', () => {
  localStorage.removeItem(whatsappHistoryKey);
  renderWhatsAppHistory();
});
commandOpen?.addEventListener('click', openCommandPalette);
commandClose?.addEventListener('click', closeCommandPalette);
commandDialog?.addEventListener('click', (event) => { if (event.target === commandDialog) closeCommandPalette(); });
commandInput?.addEventListener('input', () => renderCommandResults(commandInput.value));
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openCommandPalette();
  }
  if (event.key === 'Escape') {
    closeCommandPalette();
    closeDetailDrawer();
  }
});
document.querySelectorAll('[data-close-drawer]').forEach((item) => item.addEventListener('click', closeDetailDrawer));
auditClearButton?.addEventListener('click', () => {
  localStorage.removeItem(auditKey);
  renderAuditTrail();
});
mobileAdminToggle?.addEventListener('click', () => adminSidebar?.classList.toggle('is-collapsed'));

function renderResourceNav() {
  if (!resourceNav) return;
  resourceNav.innerHTML = resources.map((resource) => `<button type="button" data-resource="${resource.key}">${escapeHtml(resource.label)}</button>`).join('');
  resourceNav.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => showPanel(button.dataset.resource)));
  syncResourceNav();
}
function syncResourceNav() {
  resourceNav?.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button.dataset.resource === currentPanel));
  const resource = resources.find((item) => item.key === currentPanel);
  if (breadcrumbs && resource) breadcrumbs.textContent = `Admin / ${resource.label}`;
}
function showPanel(name) {
  currentPanel = name;
  panels.forEach((panel) => { panel.hidden = panel.dataset.adminPanel !== name; });
  syncResourceNav();
  if (name === 'records' && !rows.length) loadRows();
  if (name === 'audit') renderAuditTrail();
  if (name === 'whatsapp') renderWhatsAppHistory();
}
async function openDashboard() {
  loginForm.hidden = true;
  dashboard.hidden = false;
  logoutButton.hidden = false;
  await loadAll();
  await loadSiteConfig();
  showPanel(currentPanel || 'dashboard');
}
async function loadAll() { await Promise.all([loadSummary(), loadRows()]); }
async function loadSummary() {
  try {
    const data = await adminFetch('/api/admin/summary');
    summaryRows = data.summary || [];
    renderSummary();
    loginMessage.textContent = '';
  } catch (error) { showAdminError(error); }
}
async function loadRows() {
  try {
    const data = await adminFetch(`/api/admin/submissions?type=${currentType}`);
    rows = data.rows || [];
    selectedIds.clear();
    populateWeekFilter();
    renderTable();
  } catch (error) { showAdminError(error); }
}
async function loadSiteConfig() {
  try {
    siteConfig = await adminFetch('/api/admin/site-config');
    renderWeekEditor();
    renderPricingEditor();
    renderProductEditor();
  } catch (error) { showAdminError(error); }
}
function renderSummary() {
  if (statsTarget) statsTarget.innerHTML = summaryRows.map((item) => `<article class="ops-card"><span>${escapeHtml(item.label)}</span><strong>${item.total}</strong><small>${item.new_count} new</small></article>`).join('');
  if (attentionCards) {
    const cards = summaryRows.filter((item) => Number(item.new_count) > 0);
    attentionCards.innerHTML = (cards.length ? cards : summaryRows.slice(0, 4)).map((item) => `<article class="ops-card"><span>${escapeHtml(item.label)}</span><strong>${item.new_count}</strong><small>new items</small></article>`).join('');
  }
}
function getVisibleRows() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  const status = filterStatus?.value || '';
  const week = filterWeek?.value || '';
  const children = filterChildren?.value || '';
  const minTotal = Number(filterTotal?.value || 0);
  return rows.filter((row) => {
    if (query && !JSON.stringify(row).toLowerCase().includes(query)) return false;
    if (status && row.status !== status) return false;
    if (currentType === 'registrations') {
      if (week && !asArray(row.camp_weeks).includes(week)) return false;
      if (children && String(row.child_count) !== children) return false;
      if (minTotal && parseMoney(row.estimated_total_kd) < minTotal) return false;
    }
    return true;
  });
}
function renderTable() {
  if (!tableHead || !tableBody) return;
  const columns = tableConfig[currentType] || [];
  const visibleRows = getVisibleRows();
  const perPage = Number(rowsPerPageSelect?.value || 50);
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / perPage));
  page = Math.min(Math.max(1, page), pageCount);
  const pageRows = visibleRows.slice((page - 1) * perPage, page * perPage);
  if (filterPanel) filterPanel.hidden = currentType !== 'registrations';
  tableHead.innerHTML = `<tr><th><input type="checkbox" id="select-page" aria-label="Select visible rows"></th>${columns.map((column) => `<th>${formatColumn(column)}</th>`).join('')}<th>Actions</th></tr>`;
  tableBody.innerHTML = pageRows.map((row) => `<tr><td><input type="checkbox" data-select-row="${escapeAttr(row.id)}" ${selectedIds.has(String(row.id)) ? 'checked' : ''} aria-label="Select record ${escapeAttr(row.id)}"></td>${columns.map((column, index) => `<td>${index === 0 ? `<button class="row-link" type="button" data-detail="${escapeAttr(row.id)}">${formatValue(row[column])}</button>` : formatValue(row[column])}</td>`).join('')}<td><div class="admin-table-actions"><select data-id="${escapeAttr(row.id)}" aria-label="Update status for record ${escapeAttr(row.id)}">${statusList.map((status) => `<option value="${status}" ${row.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select>${recordPhone(row) ? `<button class="admin-ghost-button" type="button" data-whatsapp-row="${escapeAttr(row.id)}">WhatsApp</button>` : ''}<button class="admin-ghost-button danger-button" type="button" data-delete-row="${escapeAttr(row.id)}">Delete</button></div></td></tr>`).join('');
  tableBody.querySelectorAll('[data-select-row]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    if (checkbox.checked) selectedIds.add(String(checkbox.dataset.selectRow)); else selectedIds.delete(String(checkbox.dataset.selectRow));
    renderSelectionBar();
  }));
  tableBody.querySelectorAll('select[data-id]').forEach((select) => select.addEventListener('change', () => updateStatus(select.dataset.id, select.value)));
  tableBody.querySelectorAll('[data-detail]').forEach((button) => button.addEventListener('click', () => openDetailDrawer(button.dataset.detail)));
  tableBody.querySelectorAll('[data-whatsapp-row]').forEach((button) => button.addEventListener('click', () => prepareWhatsAppFromRow(button.dataset.whatsappRow)));
  tableBody.querySelectorAll('[data-delete-row]').forEach((button) => button.addEventListener('click', () => deleteRecords([button.dataset.deleteRow])));
  document.querySelector('#select-page')?.addEventListener('change', (event) => {
    pageRows.forEach((row) => { if (event.target.checked) selectedIds.add(String(row.id)); else selectedIds.delete(String(row.id)); });
    renderTable();
  });
  renderSelectionBar();
  if (pageStatus) pageStatus.textContent = `Page ${page} of ${pageCount} (${visibleRows.length} records)`;
  if (pagePrev) pagePrev.disabled = page <= 1;
  if (pageNext) pageNext.disabled = page >= pageCount;
  if (adminMessage) adminMessage.textContent = `Showing ${pageRows.length} of ${visibleRows.length} filtered records.`;
}
function renderSelectionBar() {
  const count = selectedIds.size;
  selectionBar?.classList.toggle('is-active', count > 0);
  if (selectionCount) selectionCount.textContent = `${count} selected`;
}
function populateWeekFilter() {
  if (!filterWeek || currentType !== 'registrations') return;
  const current = filterWeek.value;
  const weeks = [...new Set(rows.flatMap((row) => asArray(row.camp_weeks)))].sort();
  filterWeek.innerHTML = '<option value="">Any week</option>' + weeks.map((week) => `<option value="${escapeAttr(week)}">${escapeHtml(week)}</option>`).join('');
  filterWeek.value = weeks.includes(current) ? current : '';
}
function renderWeekEditor() {
  if (!weekEditor) return;
  weekEditor.innerHTML = (siteConfig.camp_weeks || []).map((week, index) => `<article class="editor-row" data-index="${index}"><label>Week label <input data-field="label" value="${escapeAttr(week.label)}" required></label><label class="check-row"><input type="checkbox" data-field="active" ${week.active !== false ? 'checked' : ''}> Active on registration form</label><button class="button secondary" type="button" data-remove-week="${index}">Remove</button></article>`).join('');
  weekEditor.querySelectorAll('[data-remove-week]').forEach((button) => button.addEventListener('click', () => { siteConfig.camp_weeks.splice(Number(button.dataset.removeWeek), 1); renderWeekEditor(); }));
}
function renderPricingEditor() {
  if (!pricingEditor || !pricingForm) return;
  const pricing = siteConfig.camp_pricing?.length ? siteConfig.camp_pricing : [{ children: 1, week_1: 185, week_2: 333, week_3: 471, week_4: 592 }, { children: 2, week_1: 333, week_2: 599, week_3: 849, week_4: 1065 }, { children: 3, week_1: 471, week_2: 849, week_3: 1202, week_4: 1509 }];
  pricingEditor.innerHTML = pricing.map((row) => `<article class="editor-row pricing-row" data-children="${row.children}"><h3>${row.children} ${Number(row.children) === 1 ? 'Child' : 'Children'}</h3><label>1 Week <input type="number" min="0" data-price="week_1" value="${escapeAttr(row.week_1)}"></label><label>2 Weeks <input type="number" min="0" data-price="week_2" value="${escapeAttr(row.week_2)}"></label><label>3 Weeks <input type="number" min="0" data-price="week_3" value="${escapeAttr(row.week_3)}"></label><label>4 Weeks <input type="number" min="0" data-price="week_4" value="${escapeAttr(row.week_4)}"></label></article>`).join('');
  const settings = siteConfig.payment_settings || {};
  pricingForm.querySelector('[data-payment-field="instructions"]').value = settings.instructions || '';
  pricingForm.querySelector('[data-payment-field="payment_link"]').value = settings.payment_link || '';
}
function renderProductEditor() {
  if (!productEditor) return;
  productEditor.innerHTML = (siteConfig.merch_products || []).map((product, index) => `<article class="editor-row product-row" data-index="${index}"><label>Product name <input data-field="name" value="${escapeAttr(product.name)}" required></label><label>Price <input data-field="price" value="${escapeAttr(product.price)}" placeholder="8 KWD"></label><div class="wide-field image-upload-field"><span>Product image</span><div class="image-upload-preview">${product.image_url ? `<img src="${escapeAttr(product.image_url)}" alt="${escapeAttr(product.name || 'Product image')}">` : '<span>No image uploaded</span>'}</div><input type="hidden" data-field="image_url" value="${escapeAttr(product.image_url)}"><label class="upload-button">Upload image <input type="file" accept="image/*" data-image-upload></label><button class="button secondary" type="button" data-clear-image>Clear Image</button><p class="media-upload-note">Uploads use R2 when configured, otherwise a compressed embedded image is saved.</p></div><label>Buy link <input data-field="buy_url" value="${escapeAttr(product.buy_url)}" placeholder="https://..."></label><label class="wide-field">Description <textarea data-field="description" rows="3">${escapeHtml(product.description)}</textarea></label><label class="check-row"><input type="checkbox" data-field="active" ${product.active !== false ? 'checked' : ''}> Visible on merch page</label><button class="button secondary" type="button" data-remove-product="${index}">Remove</button></article>`).join('');
  productEditor.querySelectorAll('[data-remove-product]').forEach((button) => button.addEventListener('click', () => { siteConfig.merch_products.splice(Number(button.dataset.removeProduct), 1); renderProductEditor(); }));
  productEditor.querySelectorAll('[data-clear-image]').forEach((button) => button.addEventListener('click', () => { const row = button.closest('.editor-row'); row.querySelector('[data-field="image_url"]').value = ''; row.querySelector('.image-upload-preview').innerHTML = '<span>No image uploaded</span>'; }));
  productEditor.querySelectorAll('[data-image-upload]').forEach((input) => input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      setMessage('Uploading image...');
      const imageUrl = await uploadProductImage(file);
      const row = input.closest('.editor-row');
      row.querySelector('[data-field="image_url"]').value = imageUrl;
      row.querySelector('.image-upload-preview').innerHTML = `<img src="${escapeAttr(imageUrl)}" alt="Uploaded product image">`;
      setMessage('Image ready. Save merch products to publish it.');
    } catch (error) { setMessage(error.message || 'Image upload failed.'); }
    finally { input.value = ''; }
  }));
}
function collectWeeks() { return [...weekEditor.querySelectorAll('.editor-row')].map((row, index) => ({ id: `week-${index + 1}`, label: row.querySelector('[data-field="label"]').value.trim(), active: row.querySelector('[data-field="active"]').checked })).filter((week) => week.label); }
function collectPricing() { return [...pricingEditor.querySelectorAll('.pricing-row')].map((row) => ({ children: Number(row.dataset.children), week_1: Number(row.querySelector('[data-price="week_1"]').value || 0), week_2: Number(row.querySelector('[data-price="week_2"]').value || 0), week_3: Number(row.querySelector('[data-price="week_3"]').value || 0), week_4: Number(row.querySelector('[data-price="week_4"]').value || 0) })); }
function collectPaymentSettings() { return { instructions: pricingForm.querySelector('[data-payment-field="instructions"]').value.trim(), payment_link: pricingForm.querySelector('[data-payment-field="payment_link"]').value.trim() }; }
function collectProducts() { return [...productEditor.querySelectorAll('.editor-row')].map((row, index) => ({ id: `product-${index + 1}`, name: row.querySelector('[data-field="name"]').value.trim(), price: row.querySelector('[data-field="price"]').value.trim(), image_url: row.querySelector('[data-field="image_url"]').value.trim(), buy_url: row.querySelector('[data-field="buy_url"]').value.trim(), description: row.querySelector('[data-field="description"]').value.trim(), active: row.querySelector('[data-field="active"]').checked })).filter((product) => product.name); }
async function saveSiteConfig(message, action) {
  try {
    const data = await adminFetch('/api/admin/site-config', { method: 'PUT', body: JSON.stringify(siteConfig) });
    siteConfig = data.config;
    renderWeekEditor();
    renderPricingEditor();
    renderProductEditor();
    pushAudit(action, message);
    setMessage(message);
  } catch (error) { showAdminError(error); }
}
async function updateStatus(id, status) {
  try {
    await adminFetch('/api/admin/submissions', { method: 'PATCH', body: JSON.stringify({ type: currentType, id, status }) });
    const row = rows.find((item) => String(item.id) === String(id));
    if (row) row.status = status;
    pushAudit('record.update_status', `${currentType} ${id} changed to ${status}`);
    await loadSummary();
    renderTable();
  } catch (error) { showAdminError(error); }
}
async function deleteRecords(ids) {
  const cleanIds = ids.map(String).filter(Boolean);
  if (!cleanIds.length) return;
  const noun = cleanIds.length === 1 ? 'record' : 'records';
  if (!confirm(`Delete ${cleanIds.length} ${currentType} ${noun}? This cannot be undone.`)) return;
  try {
    await adminFetch('/api/admin/submissions', { method: 'DELETE', body: JSON.stringify({ type: currentType, ids: cleanIds }) });
    rows = rows.filter((row) => !cleanIds.includes(String(row.id)));
    cleanIds.forEach((id) => selectedIds.delete(id));
    pushAudit('record.delete', `Deleted ${cleanIds.length} ${currentType} ${noun}`);
    await loadSummary();
    renderTable();
    setMessage(`Deleted ${cleanIds.length} ${noun}.`);
  } catch (error) { showAdminError(error); }
}
async function uploadProductImage(file) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/admin/media', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: form });
  if (response.ok) {
    const data = await response.json();
    pushAudit('media.upload', file.name);
    return data.url;
  }
  if (file.type.startsWith('image/')) return resizeImageFile(file);
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error || 'Media upload failed.');
}
function prepareWhatsAppFromRow(id) {
  const row = rows.find((item) => String(item.id) === String(id));
  if (!row) return;
  const phone = recordPhone(row);
  if (!phone) return;
  const message = recordMessage(row);
  if (whatsappTo) whatsappTo.value = phone;
  if (whatsappMessage) whatsappMessage.value = message;
  showPanel('whatsapp');
  whatsappMessage?.focus();
}
function openWhatsAppChat(phoneValue, messageValue, label) {
  const phone = normalizePhone(phoneValue);
  const message = String(messageValue || '').trim();
  if (!phone || !message) {
    if (whatsappMessageStatus) whatsappMessageStatus.textContent = 'Enter a phone number and message first.';
    return;
  }
  const url = `https://web.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
  saveWhatsAppHistory({ phone, message, label: label || 'Manual chat', url, at: new Date().toISOString() });
  pushAudit('whatsapp.open_web', `Opened WhatsApp Web chat for ${phone}`);
  if (whatsappMessageStatus) whatsappMessageStatus.textContent = 'WhatsApp Web opened in a new tab. If needed, scan the QR code there first.';
  renderWhatsAppHistory();
}
function recordPhone(row) {
  return normalizePhone(row.parent_guardian_phone || row.phone || row.emergency_contact_mobile || '');
}
function recordName(row) {
  return row.parent_guardian_name || row.name || row.student_1_name || 'there';
}
function recordMessage(row) {
  if (currentType === 'registrations') return `Hello ${recordName(row)}, this is Apex Camp Kuwait. We received your registration for ${asArray(row.camp_weeks).join(', ') || 'camp'}. We are contacting you to confirm availability and payment details.`;
  if (currentType === 'contacts') return `Hello ${recordName(row)}, this is Apex Camp Kuwait. Thank you for contacting us. We are following up on your message.`;
  if (currentType === 'instructors') return `Hello ${recordName(row)}, this is Apex Camp Kuwait. Thank you for applying to be an instructor. We are reviewing your application and will follow up here.`;
  if (currentType === 'counsellors') return `Hello ${recordName(row)}, this is Apex Camp Kuwait. Thank you for applying to be a counsellor. We are reviewing your application and will follow up here.`;
  return `Hello ${recordName(row)}, this is Apex Camp Kuwait.`;
}
function saveWhatsAppHistory(item) {
  const history = getWhatsAppHistory();
  history.unshift(item);
  localStorage.setItem(whatsappHistoryKey, JSON.stringify(history.slice(0, 25)));
}
function getWhatsAppHistory() {
  try { return JSON.parse(localStorage.getItem(whatsappHistoryKey) || '[]'); } catch { return []; }
}
function renderWhatsAppHistory() {
  if (!whatsappHistory) return;
  const history = getWhatsAppHistory();
  whatsappHistory.innerHTML = history.length ? history.map((item) => `<article><strong>${escapeHtml(item.label || item.phone)}</strong><p>${escapeHtml(new Date(item.at).toLocaleString())} · ${escapeHtml(item.phone)}</p><pre>${escapeHtml(item.message)}</pre><a class="admin-ghost-button" href="${escapeAttr(item.url)}" target="_blank" rel="noopener">Reopen Chat</a></article>`).join('') : '<article><strong>No WhatsApp chats yet</strong><p>Open a WhatsApp Web chat from a submission or the form above.</p></article>';
}
async function adminFetch(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Admin request failed.');
  return data;
}
function exportRows(exportRowsValue, name) {
  const columns = tableConfig[currentType] || [];
  const csv = [columns.join(','), ...exportRowsValue.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n');
  downloadBlob(csv, `apex-${name}.csv`, 'text/csv;charset=utf-8');
  pushAudit('export.csv', `Exported ${exportRowsValue.length} ${currentType} rows`);
  setMessage(`Exported ${exportRowsValue.length} records.`);
}
function openDetailDrawer(id) {
  const row = rows.find((item) => String(item.id) === String(id));
  if (!row || !detailDrawer || !detailContent) return;
  detailContent.innerHTML = Object.entries(row).map(([key, value]) => `<div><dt>${formatColumn(key)}</dt><dd>${formatValue(value)}</dd></div>`).join('');
  detailDrawer.classList.add('is-open');
  detailDrawer.setAttribute('aria-hidden', 'false');
}
function closeDetailDrawer() {
  detailDrawer?.classList.remove('is-open');
  detailDrawer?.setAttribute('aria-hidden', 'true');
}
function openCommandPalette() {
  commandDialog?.classList.add('is-open');
  commandInput.value = '';
  renderCommandResults('');
  setTimeout(() => commandInput?.focus(), 0);
}
function closeCommandPalette() { commandDialog?.classList.remove('is-open'); }
function renderCommandResults(query) {
  if (!commandResults) return;
  const needle = String(query || '').toLowerCase();
  const results = resources.filter((resource) => !needle || [resource.label, resource.hint, ...(resource.keywords || [])].join(' ').toLowerCase().includes(needle)).slice(0, 10);
  commandResults.innerHTML = results.map((resource) => `<button type="button" data-command-panel="${resource.panel}"><strong>${escapeHtml(resource.label)}</strong><small>${escapeHtml(resource.hint)}</small></button>`).join('');
  commandResults.querySelectorAll('[data-command-panel]').forEach((button) => button.addEventListener('click', () => { showPanel(button.dataset.commandPanel); closeCommandPalette(); }));
}
function pushAudit(action, detail) {
  const rowsValue = getAuditRows();
  rowsValue.unshift({ at: new Date().toISOString(), action, detail });
  localStorage.setItem(auditKey, JSON.stringify(rowsValue.slice(0, 80)));
  renderAuditTrail();
}
function getAuditRows() { try { return JSON.parse(localStorage.getItem(auditKey) || '[]'); } catch { return []; } }
function renderAuditTrail() {
  if (!auditList) return;
  const items = getAuditRows();
  auditList.innerHTML = items.length ? items.map((item) => `<article><strong>${escapeHtml(item.action)}</strong><p>${escapeHtml(new Date(item.at).toLocaleString())}</p><pre>${escapeHtml(item.detail)}</pre></article>`).join('') : '<article><strong>No actions yet</strong><p>Admin actions from this browser will appear here.</p></article>';
}
function resizeImageFile(file) {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Please upload an image file.'));
  if (file.size > 10 * 1024 * 1024) return Promise.reject(new Error('Please upload an image smaller than 10 MB.'));
  return readFile(file).then(loadImage).then((image) => {
    const maxSize = 1000;
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  });
}
function readFile(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read image file.')); reader.readAsDataURL(file); }); }
function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Could not prepare image.')); image.src = src; }); }
function getToken() { return localStorage.getItem(tokenKey) || tokenInput.value.trim(); }
function showAdminError(error) {
  loginForm.hidden = false;
  dashboard.hidden = true;
  logoutButton.hidden = true;
  loginMessage.textContent = `${error.message} Check your admin token or backend deployment.`;
}
function setMessage(text) { if (adminMessage) adminMessage.textContent = text; }
function formatColumn(column) { return String(column).replaceAll('_', ' '); }
function formatValue(value) {
  if (value === null || value === undefined || value === '') return '';
  const upload = parseUploadValue(value);
  if (upload) return `<a href="${escapeAttr(upload.data_url)}" download="${escapeAttr(upload.name)}">${escapeHtml(upload.name)}</a>`;
  if (Array.isArray(value)) return escapeHtml(value.join(', '));
  if (typeof value === 'object') return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  return escapeHtml(String(value));
}
function parseUploadValue(value) {
  if (typeof value === 'object' && value?.name && value?.data_url) return value;
  if (typeof value !== 'string' || !value.startsWith('{')) return null;
  try { const upload = JSON.parse(value); return upload?.name && upload?.data_url ? upload : null; } catch { return null; }
}
function normalizePhone(value) { return String(value || '').replace(/[^0-9]/g, ''); }
function asArray(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
function parseMoney(value) { const match = String(value || '').match(/\d+/); return match ? Number(match[0]) : 0; }
function csvCell(value) { const text = Array.isArray(value) ? value.join('; ') : typeof value === 'object' && value ? JSON.stringify(value) : String(value ?? ''); return `"${text.replaceAll('"', '""')}"`; }
function downloadBlob(content, filename, type) { const blob = new Blob([content], { type }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href); }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
function escapeAttr(value) { return escapeHtml(value).replaceAll('`', '&#096;'); }

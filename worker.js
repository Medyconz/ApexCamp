const PREFIX = 'apexcampwebsite:';
const CONFIG_KEY = `${PREFIX}site-config`;
const DEFAULT_CAMP_PRICING = [
  { children: 1, week_1: 185, week_2: 333, week_3: 471, week_4: 592 },
  { children: 2, week_1: 333, week_2: 599, week_3: 849, week_4: 1065 },
  { children: 3, week_1: 471, week_2: 849, week_3: 1202, week_4: 1509 }
];
const DEFAULT_SITE_CONFIG = {
  camp_weeks: [
    { id: 'week-1', label: 'Week 1: June 14-18, 2026', active: true },
    { id: 'week-2', label: 'Week 2: June 21-25, 2026', active: true },
    { id: 'week-3', label: 'Week 3: June 28-July 2, 2026', active: true },
    { id: 'week-4', label: 'Week 4: July 5-9, 2026', active: true },
    { id: 'week-5', label: 'Week 5: July 12-16, 2026', active: true },
    { id: 'week-6', label: 'Week 6: July 19-23, 2026', active: true },
    { id: 'week-7', label: 'Week 7: July 26-30, 2026', active: true },
    { id: 'week-8', label: 'Week 8: August 2-6, 2026', active: true },
    { id: 'week-9', label: 'Week 9: August 9-13, 2026', active: true }
  ],
  camp_pricing: DEFAULT_CAMP_PRICING,
  payment_settings: {
    instructions: 'Your registration will be saved first. The Apex Camp team will contact you to confirm availability and payment details.',
    payment_link: ''
  },
  merch_products: [
    { id: 'apex-shirt', name: 'Apex Camp T-Shirt', price: '8 KWD', image_url: 'Profile%20Picture%201.jpg.jpeg', description: 'Soft camp tee with Apex colors.', active: true },
    { id: 'apex-cap', name: 'Apex Camp Cap', price: '5 KWD', image_url: 'Profile%20Picture%201.jpg.jpeg', description: 'Easy everyday cap for camp days.', active: true }
  ]
};
const TABLES = {
  registrations: { label: 'Registrations', fields: ['id', 'created_at', 'status', 'camp_weeks', 'child_count', 'total_weeks', 'estimated_total_kd', 'parent_guardian_name', 'parent_guardian_email', 'parent_guardian_phone', 'emergency_contact_name', 'emergency_contact_mobile', 'student_1_name', 'student_1_date_of_birth', 'student_1_has_medical_condition', 'student_1_medical_condition_details', 'student_2_name', 'student_2_date_of_birth', 'student_2_has_medical_condition', 'student_2_medical_condition_details', 'student_3_name', 'student_3_date_of_birth', 'student_3_has_medical_condition', 'student_3_medical_condition_details'] },
  counsellors: { label: 'Counsellors', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'age', 'availability', 'experience', 'motivation'] },
  instructors: { label: 'Instructors', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'specialty', 'availability', 'experience', 'civil_id_file', 'resume_file', 'motivation'] },
  contacts: { label: 'Contact Messages', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'message'] }
};
const STATUSES = new Set(['new', 'reviewed', 'contacted', 'accepted', 'archived']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
      if (url.pathname.startsWith('/media/')) return serveMedia(env, url);
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error.message || 'Unexpected server error.' }, error.status || 500);
    }
  }
};

async function handleApi(request, env, url) {
  assertDb(env);

  if (request.method === 'GET' && url.pathname === '/api/site-config') return json(await getSiteConfig(env));
  if (request.method === 'POST' && url.pathname === '/api/register') return saveRecord(request, env, 'registrations');
  if (request.method === 'POST' && url.pathname === '/api/apply-counsellor') return saveRecord(request, env, 'counsellors');
  if (request.method === 'POST' && url.pathname === '/api/apply-instructor') return saveRecord(request, env, 'instructors');
  if (request.method === 'POST' && url.pathname === '/api/contact') return saveRecord(request, env, 'contacts');

  if (url.pathname.startsWith('/api/admin/')) {
    requireAdmin(request, env);
    if (request.method === 'GET' && url.pathname === '/api/admin/summary') return adminSummary(env);
    if (request.method === 'GET' && url.pathname === '/api/admin/submissions') return adminSubmissions(env, url);
    if (request.method === 'PATCH' && url.pathname === '/api/admin/submissions') return updateStatus(request, env);
    if (request.method === 'DELETE' && url.pathname === '/api/admin/submissions') return deleteSubmissions(request, env);
    if (request.method === 'GET' && url.pathname === '/api/admin/export') return exportCsv(env, url);
    if (request.method === 'GET' && url.pathname === '/api/admin/site-config') return json(await getSiteConfig(env));
    if (request.method === 'PUT' && url.pathname === '/api/admin/site-config') return saveSiteConfig(request, env);
    if (request.method === 'POST' && url.pathname === '/api/admin/media') return uploadMedia(request, env);
  }

  return json({ error: 'API route not found.' }, 404);
}

async function saveRecord(request, env, type) {
  const body = await readBody(request);
  const siteConfig = type === 'registrations' ? await getSiteConfig(env) : null;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record = { id, created_at: new Date().toISOString(), status: 'new', ...(await mapPublicRecord(type, body, siteConfig)) };
  await env.DB.put(storageKey(type, id), JSON.stringify(record));
  await sendNotification(env, type, record).catch((error) => console.warn('Notification skipped:', error.message));

  const acceptsJson = (request.headers.get('Accept') || '').includes('application/json');
  if (acceptsJson) return json({ ok: true, id, message: 'Thank you. Your form was saved for the Apex Camp team.', record: publicRecordSummary(type, record) });
  return Response.redirect(new URL('/thanks.html', request.url), 303);
}

async function mapPublicRecord(type, body, siteConfig) {
  if (type === 'registrations') {
    const campWeeks = requiredArray(body.camp_weeks, 'Camp dates');
    const childCount = requiredChildCount(body.child_count);
    return {
      camp_weeks: campWeeks,
      child_count: childCount,
      total_weeks: campWeeks.length,
      estimated_total_kd: estimateCampPrice(siteConfig, childCount, campWeeks.length),
      parent_guardian_name: requiredText(body.parent_guardian_name || body.guardian, 'Parent/Guardian Name'),
      parent_guardian_email: requiredEmail(body.parent_guardian_email || body.email),
      parent_guardian_phone: requiredText(body.parent_guardian_phone || body.phone, 'Parent/Guardian Phone'),
      emergency_contact_name: requiredText(body.emergency_contact_name, 'Name of Emergency Contact'),
      emergency_contact_mobile: requiredText(body.emergency_contact_mobile, 'Mobile Number'),
      ...studentRecord(body, 1, true),
      ...studentRecord(body, 2, childCount >= 2),
      ...studentRecord(body, 3, childCount >= 3)
    };
  }
  if (type === 'counsellors') return { name: requiredText(body.name, 'Full name'), email: requiredEmail(body.email), phone: requiredText(body.phone, 'Phone'), age: requiredNumber(body.age, 'Age'), availability: requiredText(body.availability, 'Availability'), experience: requiredText(body.experience, 'Experience'), motivation: requiredText(body.motivation, 'Motivation') };
  if (type === 'instructors') return { name: requiredText(body.name, 'Full name'), email: requiredEmail(body.email), phone: requiredText(body.phone, 'Phone'), specialty: requiredText(body.specialty, 'Specialty'), availability: requiredText(body.availability, 'Availability'), experience: requiredText(body.experience, 'Experience'), civil_id_file: await optionalUpload(body.civil_id_file), resume_file: await optionalUpload(body.resume_file), motivation: requiredText(body.motivation, 'Motivation') };
  if (type === 'contacts') return { name: requiredText(body.name, 'Name'), email: requiredEmail(body.email), phone: optionalText(body.phone), message: requiredText(body.message, 'Message') };
  fail('Unknown form type.', 400);
}

function studentRecord(body, number, required) {
  const prefix = `student_${number}`;
  return {
    [`${prefix}_name`]: required ? requiredText(body[`${prefix}_name`], `Student ${number} Name`) : optionalText(body[`${prefix}_name`]),
    [`${prefix}_date_of_birth`]: required ? requiredText(body[`${prefix}_date_of_birth`], `Student ${number} Date of Birth`) : optionalText(body[`${prefix}_date_of_birth`]),
    [`${prefix}_has_medical_condition`]: required ? requiredText(body[`${prefix}_has_medical_condition`], `Student ${number} Medical Condition`) : optionalText(body[`${prefix}_has_medical_condition`]),
    [`${prefix}_medical_condition_details`]: optionalText(body[`${prefix}_medical_condition_details`])
  };
}

async function getSiteConfig(env) {
  const stored = await env.DB.get(CONFIG_KEY, 'json');
  return normalizeSiteConfig(stored || DEFAULT_SITE_CONFIG);
}

async function saveSiteConfig(request, env) {
  const body = await request.json();
  const config = normalizeSiteConfig(body);
  if (!config.camp_weeks.some((week) => week.active)) fail('At least one camp week must be active.', 400);
  await env.DB.put(CONFIG_KEY, JSON.stringify(config));
  return json({ ok: true, config, message: 'Site settings saved.' });
}

function normalizeSiteConfig(input) {
  const campWeeks = Array.isArray(input?.camp_weeks) ? input.camp_weeks : DEFAULT_SITE_CONFIG.camp_weeks;
  const merchProducts = Array.isArray(input?.merch_products) ? input.merch_products : DEFAULT_SITE_CONFIG.merch_products;
  return {
    camp_weeks: campWeeks.map((week, index) => ({ id: slug(week.id || week.label || `week-${index + 1}`), label: requiredConfigText(week.label, `Week ${index + 1}`), active: week.active !== false })),
    camp_pricing: normalizePricing(input?.camp_pricing),
    payment_settings: { instructions: optionalText(input?.payment_settings?.instructions) || DEFAULT_SITE_CONFIG.payment_settings.instructions, payment_link: optionalText(input?.payment_settings?.payment_link) },
    merch_products: merchProducts.map((product, index) => ({ id: slug(product.id || product.name || `product-${index + 1}`), name: requiredConfigText(product.name, `Product ${index + 1}`), price: optionalText(product.price), image_url: optionalText(product.image_url), description: optionalText(product.description), buy_url: optionalText(product.buy_url), active: product.active !== false }))
  };
}

function normalizePricing(pricing) {
  const rows = Array.isArray(pricing) && pricing.length ? pricing : DEFAULT_CAMP_PRICING;
  return [1, 2, 3].map((children) => {
    const row = rows.find((item) => Number(item.children) === children) || {};
    return { children, week_1: money(row.week_1), week_2: money(row.week_2), week_3: money(row.week_3), week_4: money(row.week_4) };
  });
}

async function adminSummary(env) {
  const summary = [];
  for (const [type, config] of Object.entries(TABLES)) {
    const rows = await getRows(env, type);
    summary.push({ label: config.label, total: rows.length, new_count: rows.filter((row) => row.status === 'new').length });
  }
  return json({ summary });
}

async function adminSubmissions(env, url) {
  const type = url.searchParams.get('type') || 'registrations';
  const rows = await getRows(env, type);
  return json({ rows: rows.map((row) => pick(getConfig(type).fields, row)) });
}

async function updateStatus(request, env) {
  const body = await request.json();
  const type = body.type;
  const id = String(body.id || '');
  const status = String(body.status || '');
  getConfig(type);
  if (!id) fail('A valid record id is required.', 400);
  if (!STATUSES.has(status)) fail('A valid status is required.', 400);

  const key = storageKey(type, id);
  const record = await env.DB.get(key, 'json');
  if (!record) fail('Record not found.', 404);
  record.status = status;
  await env.DB.put(key, JSON.stringify(record));
  return json({ ok: true });
}

async function deleteSubmissions(request, env) {
  const body = await request.json();
  const type = body.type;
  getConfig(type);
  const ids = Array.isArray(body.ids) ? body.ids : [body.id];
  const cleanIds = ids.map((id) => String(id || '').trim()).filter(Boolean);
  if (!cleanIds.length) fail('At least one record id is required.', 400);
  await Promise.all(cleanIds.map((id) => env.DB.delete(storageKey(type, id))));
  return json({ ok: true, deleted: cleanIds.length });
}

async function exportCsv(env, url) {
  const type = url.searchParams.get('type') || 'registrations';
  const fields = getConfig(type).fields;
  const rows = await getRows(env, type);
  const csv = [fields.join(','), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(','))].join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="apex-${type}.csv"` } });
}

async function getRows(env, type) {
  getConfig(type);
  const listed = await env.DB.list({ prefix: `${PREFIX}${type}:`, limit: 1000 });
  const rows = await Promise.all(listed.keys.map(async (item) => JSON.parse(await env.DB.get(item.name))));
  return rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

async function uploadMedia(request, env) {
  if (!env.MEDIA) fail('R2 binding MEDIA is not configured. Add an R2 bucket binding named MEDIA to enable direct media uploads.', 400);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') fail('Upload an image or video file.', 400);
  if (!/^image\/|^video\//.test(file.type)) fail('Only image and video uploads are supported.', 400);
  if (file.size > 25 * 1024 * 1024) fail('Please upload a file smaller than 25 MB.', 400);
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
  const key = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ ok: true, url: `/${key}` });
}

async function serveMedia(env, url) {
  if (!env.MEDIA) return new Response('Media storage is not configured.', { status: 404 });
  const key = url.pathname.slice(1);
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Media not found.', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

async function sendNotification(env, type, record) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  const from = env.FROM_EMAIL || 'Apex Camp <onboarding@resend.dev>';
  const subject = `New Apex Camp ${TABLES[type]?.label || type}`;
  const html = `<h1>${escapeEmail(subject)}</h1><p>Status: ${escapeEmail(record.status)}</p><pre>${escapeEmail(JSON.stringify(record, null, 2))}</pre>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [env.NOTIFY_EMAIL], subject, html })
  });
  if (!response.ok) throw new Error(`Email notification failed with ${response.status}`);
}

async function readBody(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) return request.json();

  const formData = await request.formData();
  const body = {};
  for (const [key, value] of formData.entries()) {
    const prepared = typeof value === 'string' ? value : await serializeUpload(value);
    if (body[key]) body[key] = Array.isArray(body[key]) ? [...body[key], prepared] : [body[key], prepared];
    else body[key] = prepared;
  }
  return body;
}

async function serializeUpload(file) {
  if (!file || typeof file === 'string' || !file.name || !file.size) return '';
  if (file.size > 4 * 1024 * 1024) fail(`${file.name} must be smaller than 4 MB.`, 400);
  const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${arrayBufferToBase64(await file.arrayBuffer())}`;
  return { name: file.name, type: file.type || 'application/octet-stream', size: file.size, data_url: dataUrl };
}

async function optionalUpload(value) {
  if (!value) return '';
  if (typeof value === 'object' && value.name && value.data_url) return value;
  return value;
}

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) fail('ADMIN_TOKEN is not configured.', 500);
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== env.ADMIN_TOKEN) fail('Invalid admin token.', 401);
}

function publicRecordSummary(type, record) { return type === 'registrations' ? { child_count: record.child_count, total_weeks: record.total_weeks, estimated_total_kd: record.estimated_total_kd, camp_weeks: record.camp_weeks } : { id: record.id }; }
function estimateCampPrice(config, childCount, weekCount) { const row = normalizePricing(config?.camp_pricing).find((item) => Number(item.children) === Number(childCount)); const price = row?.[`week_${weekCount}`]; return price ? `${price} KD` : ''; }
function assertDb(env) { if (!env.DB) fail('Workers KV binding DB is not configured.', 500); }
function getConfig(type) { const config = TABLES[type]; if (!config) fail('Unknown database table.', 400); return config; }
function storageKey(type, id) { return `${PREFIX}${type}:${id}`; }
function pick(fields, row) { return Object.fromEntries(fields.map((field) => [field, row[field] ?? ''])); }
function requiredText(value, label) { const text = optionalText(value); if (!text) fail(`${label} is required.`, 400); return text; }
function requiredConfigText(value, fallback) { return optionalText(value) || fallback; }
function optionalText(value) { return typeof value === 'string' ? value.trim() : ''; }
function requiredEmail(value) { const email = requiredText(value, 'Email'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('A valid email is required.', 400); return email; }
function requiredNumber(value, label) { const number = Number(value); if (!Number.isFinite(number)) fail(`${label} must be a number.`, 400); return number; }
function requiredChildCount(value) { const number = Number(value || 1); if (![1, 2, 3].includes(number)) fail('Number of children must be 1, 2, or 3.', 400); return number; }
function money(value) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : 0; }
function asArray(value) { if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean); if (value) return [String(value).trim()].filter(Boolean); return []; }
function requiredArray(value, label) { const values = asArray(value); if (!values.length) fail(`${label} requires at least one selection.`, 400); return values; }
function csvCell(value) { const text = Array.isArray(value) ? value.join('; ') : typeof value === 'object' && value ? JSON.stringify(value) : String(value ?? ''); return `"${text.replaceAll('"', '""')}"`; }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `item-${Date.now()}`; }
function arrayBufferToBase64(buffer) { const bytes = new Uint8Array(buffer); let binary = ''; const chunkSize = 0x8000; for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize)); return btoa(binary); }
function escapeEmail(value) { return String(value || '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char])); }
function fail(message, status) { const error = new Error(message); error.status = status; throw error; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }

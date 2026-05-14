const PREFIX = 'apexcampwebsite:';
const ACTIVITIES = ['3D Printing', 'Aquatics', 'Karv Ski Block', 'Indoor Football', 'Gymnastics', 'Cooking', 'Treasure Hunt', 'Music', 'Arts and Crafts'];
const STATUSES = ['new', 'reviewed', 'contacted', 'accepted', 'archived'];
const TYPES = {
  registrations: { label: 'Registrations', fields: ['id', 'created_at', 'status', 'guardian_name', 'camper_name', 'camper_age', 'email', 'phone', 'activities', 'notes'] },
  counsellors: { label: 'Counsellors', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'age', 'availability', 'experience', 'motivation'] },
  instructors: { label: 'Instructors', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'specialty', 'availability', 'experience', 'motivation'] },
  contacts: { label: 'Contact Messages', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'message'] }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/styles.css') return text(styles(), 'text/css; charset=utf-8');
      if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
      return handlePage(request, env, url);
    } catch (error) {
      return html(page('Error | Apex Camp', `<section class="page"><p class="eyebrow">Error</p><h1>${escapeHtml(error.message || 'Something went wrong.')}</h1><p><a class="button" href="/">Back home</a></p></section>`), error.status || 500);
    }
  }
};

async function handleApi(request, env, url) {
  assertDb(env);

  if (request.method === 'POST' && url.pathname === '/api/register') return savePublic(request, env, 'registrations');
  if (request.method === 'POST' && url.pathname === '/api/apply-counsellor') return savePublic(request, env, 'counsellors');
  if (request.method === 'POST' && url.pathname === '/api/apply-instructor') return savePublic(request, env, 'instructors');
  if (request.method === 'POST' && url.pathname === '/api/contact') return savePublic(request, env, 'contacts');
  if (request.method === 'POST' && url.pathname === '/api/admin/status') return updateStatus(request, env);
  if (request.method === 'GET' && url.pathname === '/api/admin/export') return exportCsv(env, url);

  return json({ error: 'API route not found.' }, 404);
}

async function handlePage(request, env, url) {
  if (url.pathname === '/' || url.pathname === '/index.html') return html(page('Apex Camp', homePage()));
  if (url.pathname === '/activities.html') return html(page('Activities | Apex Camp', hero('See activities', 'Camp days with something for every kind of kid.') + `<section class="section">${activityList()}</section>`));
  if (url.pathname === '/register.html') return html(page('Register | Apex Camp', formPage('Register now', 'Save a place at Apex Camp.', '/api/register', registrationFields(), 'Submit Registration')));
  if (url.pathname === '/apply-counsellor.html') return html(page('Apply to be a Counsellor | Apex Camp', formPage('Join the team', 'Apply to be a Counsellor.', '/api/apply-counsellor', counsellorFields(), 'Submit Application')));
  if (url.pathname === '/apply-instructor.html') return html(page('Apply to be an Instructor | Apex Camp', formPage('Lead an activity', 'Apply to be an Instructor.', '/api/apply-instructor', instructorFields(), 'Submit Application')));
  if (url.pathname === '/about.html') return html(page('About | Apex Camp', aboutPage()));
  if (url.pathname === '/contact.html') return html(page('Contact | Apex Camp', formPage('Contact us', 'Ask about camp days, activities, or team roles.', '/api/contact', contactFields(), 'Send Message')));
  if (url.pathname === '/faq.html') return html(page('FAQ | Apex Camp', faqPage()));
  if (url.pathname === '/thanks.html') return html(page('Thank you | Apex Camp', `<section class="page"><p class="eyebrow">Saved</p><h1>Thank you. Your form was saved for the Apex Camp team.</h1><p><a class="button" href="/">Back home</a> <a class="button secondary" href="/admin.html">Admin</a></p></section>`));
  if (url.pathname === '/admin.html') return adminPage(env, url);

  return new Response('Not found', { status: 404 });
}

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="/styles.css"></head><body><header><a class="brand" href="/"><span class="logo">APEX</span><span>Apex Camp</span></a><nav>${nav()}</nav></header><main>${body}</main><footer><span class="logo small">APEX</span><p>Apex Camp. Bright days, brave starts, big smiles.</p></footer></body></html>`;
}

function nav() {
  return `<a href="/apply-counsellor.html">Apply to be a Counsellor</a><a href="/apply-instructor.html">Apply to be an Instructor</a><a class="nav-cta" href="/register.html">Register Now</a><a href="/activities.html">See Activities</a><a href="/about.html">About Us</a><a href="/contact.html">Contact Us</a><a href="/faq.html">FAQ</a><a href="/admin.html">Admin</a>`;
}

function hero(kicker, title) {
  return `<section class="page"><p class="eyebrow">${kicker}</p><h1>${title}</h1></section>`;
}

function homePage() {
  return `<section class="hero"><div><p class="eyebrow">Creative camp days. Big confidence.</p><h1>Apex Camp brings action, discovery, and new skills into one bright day.</h1><p>From 3D printing to aquatics, football, gymnastics, cooking, music, and treasure hunts, campers get movement, imagination, teamwork, and hands-on fun.</p><p><a class="button" href="/register.html">Register for Camp</a> <a class="button secondary" href="/activities.html">Explore Activities</a></p></div><div class="hero-card"><span class="big-logo">APEX</span><p><b>Sports</b> <b>STEM</b> <b>Arts</b></p></div></section><section class="section"><p class="eyebrow">Activity highlights</p><h2>Pick a spark, then chase it.</h2>${activityCards()}</section>`;
}

function aboutPage() {
  return hero('About us', 'Apex Camp is built for curious, active, creative campers.') + `<section class="section cards"><article><h2>Safe by design</h2><p>Structured, supervised activities help campers try new things with support.</p></article><article><h2>Variety every day</h2><p>Campers move between sports, creative workshops, STEM, and group challenges.</p></article><article><h2>Confidence first</h2><p>The goal is participation, progress, and pride.</p></article></section>`;
}

function faqPage() {
  return hero('FAQ', 'Answers for parents and future team members.') + `<section class="section faq"><details open><summary>What activities are included?</summary><p>${ACTIVITIES.join(', ')}.</p></details><details><summary>Do campers need experience?</summary><p>No. Activities are beginner friendly and guided.</p></details><details><summary>Where do registrations go?</summary><p>They are saved into the Apex Camp admin database.</p></details></section>`;
}

function activityCards() {
  return `<div class="grid">${ACTIVITIES.map((activity, index) => `<article class="activity tone${index % 4}"><span>${escapeHtml(activity.slice(0, 4))}</span><h3>${escapeHtml(activity)}</h3><p>Hands-on fun with supportive guidance.</p></article>`).join('')}</div>`;
}

function activityList() {
  return `<div class="list">${ACTIVITIES.map((activity) => `<article><strong>${escapeHtml(activity)}</strong><p>Guided, camper-friendly activity time built for confidence, teamwork, and fun.</p></article>`).join('')}</div>`;
}

function formPage(kicker, title, action, fields, button) {
  return `<section class="form-layout"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>Once submitted, this saves directly into the Apex Camp admin database.</p></div><form method="post" action="${action}">${fields}<button class="button" type="submit">${button}</button></form></section>`;
}

function registrationFields() {
  return `<label>Parent or guardian name <input name="guardian" required></label><label>Camper name <input name="camper" required></label><label>Camper age <input type="number" name="age" min="3" max="18" required></label><label>Email <input type="email" name="email" required></label><label>Phone <input name="phone" required></label><fieldset><legend>Preferred activities</legend>${ACTIVITIES.map((activity) => `<label><input type="checkbox" name="activity" value="${escapeHtml(activity)}"> ${escapeHtml(activity)}</label>`).join('')}</fieldset><label>Notes <textarea name="notes" rows="4"></textarea></label>`;
}

function counsellorFields() {
  return `<label>Full name <input name="name" required></label><label>Email <input type="email" name="email" required></label><label>Phone <input name="phone" required></label><label>Age <input type="number" name="age" min="16" required></label><label>Availability <input name="availability" required></label><label>Experience with children <textarea name="experience" rows="4" required></textarea></label><label>Why do you want this role? <textarea name="motivation" rows="4" required></textarea></label>`;
}

function instructorFields() {
  return `<label>Full name <input name="name" required></label><label>Email <input type="email" name="email" required></label><label>Phone <input name="phone" required></label><label>Activity specialty <select name="specialty" required><option value="">Choose one</option>${ACTIVITIES.map((activity) => `<option>${escapeHtml(activity)}</option>`).join('')}</select></label><label>Availability <input name="availability" required></label><label>Relevant experience <textarea name="experience" rows="4" required></textarea></label><label>How would you make it fun and safe? <textarea name="motivation" rows="4" required></textarea></label>`;
}

function contactFields() {
  return `<label>Name <input name="name" required></label><label>Email <input type="email" name="email" required></label><label>Phone <input name="phone"></label><label>Message <textarea name="message" rows="6" required></textarea></label>`;
}

async function savePublic(request, env, type) {
  const body = await readBody(request);
  const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, created_at: new Date().toISOString(), status: 'new', ...mapPublicRecord(type, body) };

  await env.DB.put(storageKey(type, record.id), JSON.stringify(record));

  const accept = request.headers.get('Accept') || '';
  if (accept.includes('application/json')) return json({ ok: true, id: record.id, message: 'Thank you. Your form was saved for the Apex Camp team.' });

  return Response.redirect(new URL('/thanks.html', request.url), 303);
}

function mapPublicRecord(type, body) {
  if (type === 'registrations') {
    return { guardian_name: requiredText(body.guardian, 'Parent or guardian name'), camper_name: requiredText(body.camper, 'Camper name'), camper_age: requiredNumber(body.age, 'Camper age'), email: requiredEmail(body.email), phone: requiredText(body.phone, 'Phone'), activities: asArray(body.activity), notes: optionalText(body.notes) };
  }

  if (type === 'counsellors') {
    return { name: requiredText(body.name, 'Full name'), email: requiredEmail(body.email), phone: requiredText(body.phone, 'Phone'), age: requiredNumber(body.age, 'Age'), availability: requiredText(body.availability, 'Availability'), experience: requiredText(body.experience, 'Experience'), motivation: requiredText(body.motivation, 'Motivation') };
  }

  if (type === 'instructors') {
    return { name: requiredText(body.name, 'Full name'), email: requiredEmail(body.email), phone: requiredText(body.phone, 'Phone'), specialty: requiredText(body.specialty, 'Specialty'), availability: requiredText(body.availability, 'Availability'), experience: requiredText(body.experience, 'Experience'), motivation: requiredText(body.motivation, 'Motivation') };
  }

  if (type === 'contacts') {
    return { name: requiredText(body.name, 'Name'), email: requiredEmail(body.email), phone: optionalText(body.phone), message: requiredText(body.message, 'Message') };
  }

  throw statusError('Unknown form type.', 400);
}

async function adminPage(env, url) {
  const token = url.searchParams.get('token') || '';
  const type = url.searchParams.get('type') || 'registrations';
  const q = (url.searchParams.get('q') || '').toLowerCase();

  if (!token) {
    return html(page('Admin | Apex Camp', `<section class="admin"><p class="eyebrow">Admin backend</p><h1>Apex Camp registrations and database</h1><form method="get" action="/admin.html"><label>Admin token <input type="password" name="token" required></label><button class="button">Open Dashboard</button></form></section>`));
  }

  requireToken(token, env);
  const rows = (await all(env, type)).filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  const stats = await buildStats(env);

  return html(page('Admin | Apex Camp', `<section class="admin"><p class="eyebrow">Admin backend</p><h1>Apex Camp registrations and database</h1><div class="stats">${stats}</div><div class="tabs">${Object.keys(TYPES).map((name) => `<a class="${name === type ? 'active' : ''}" href="/admin.html?token=${encodeURIComponent(token)}&type=${name}">${TYPES[name].label}</a>`).join('')}</div><form class="search" method="get"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="type" value="${escapeHtml(type)}"><input type="search" name="q" value="${escapeHtml(q)}" placeholder="Search records"><button class="button secondary">Search</button><a class="button" href="/api/admin/export?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}">Export CSV</a></form>${table(type, rows, token)}</section>`));
}

async function buildStats(env) {
  const stats = [];
  for (const type of Object.keys(TYPES)) {
    const rows = await all(env, type);
    stats.push(`<article><span>${TYPES[type].label}</span><strong>${rows.length}</strong><small>${rows.filter((row) => row.status === 'new').length} new</small></article>`);
  }
  return stats.join('');
}

function table(type, rows, token) {
  const fields = getConfig(type).fields;
  return `<div class="table-wrap"><table><thead><tr>${fields.map((field) => `<th>${escapeHtml(field.replaceAll('_', ' '))}</th>`).join('')}<th>Action</th></tr></thead><tbody>${rows.map((row) => `<tr>${fields.map((field) => `<td>${escapeHtml(Array.isArray(row[field]) ? row[field].join(', ') : (row[field] || ''))}</td>`).join('')}<td><form method="post" action="/api/admin/status"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="type" value="${escapeHtml(type)}"><input type="hidden" name="id" value="${escapeHtml(row.id)}"><select name="status">${STATUSES.map((status) => `<option ${row.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select><button>Save</button></form></td></tr>`).join('')}</tbody></table></div>`;
}

async function updateStatus(request, env) {
  const body = await readBody(request);
  requireToken(body.token, env);
  const type = body.type;
  const id = body.id;
  const status = body.status;

  getConfig(type);
  if (!STATUSES.includes(status)) throw statusError('Invalid status.', 400);

  const current = await env.DB.get(storageKey(type, id), 'json');
  if (!current) throw statusError('Record not found.', 404);

  current.status = status;
  await env.DB.put(storageKey(type, id), JSON.stringify(current));

  return Response.redirect(new URL(`/admin.html?token=${encodeURIComponent(body.token)}&type=${encodeURIComponent(type)}`, request.url), 303);
}

async function exportCsv(env, url) {
  const token = url.searchParams.get('token') || '';
  const type = url.searchParams.get('type') || 'registrations';
  requireToken(token, env);

  const fields = getConfig(type).fields;
  const rows = await all(env, type);
  const csv = [fields.join(','), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(','))].join('\n');

  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="apex-${type}.csv"` } });
}

async function all(env, type) {
  getConfig(type);
  const listed = await env.DB.list({ prefix: `${PREFIX}${type}:`, limit: 1000 });
  const rows = await Promise.all(listed.keys.map(async (item) => JSON.parse(await env.DB.get(item.name))));
  return rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

async function readBody(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) return request.json();

  const formData = await request.formData();
  const body = {};
  formData.forEach((value, key) => {
    if (body[key]) body[key] = Array.isArray(body[key]) ? [...body[key], value] : [body[key], value];
    else body[key] = value;
  });
  return body;
}

function assertDb(env) {
  if (!env.DB) throw statusError('Workers KV binding DB is not configured.', 500);
}

function requireToken(token, env) {
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) throw statusError('Invalid admin token.', 401);
}

function getConfig(type) {
  const config = TYPES[type];
  if (!config) throw statusError('Unknown table.', 400);
  return config;
}

function storageKey(type, id) {
  return `${PREFIX}${type}:${id}`;
}

function requiredText(value, label) {
  const text = optionalText(value);
  if (!text) throw statusError(`${label} is required.`, 400);
  return text;
}

function optionalText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredEmail(value) {
  const email = requiredText(value, 'Email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw statusError('A valid email is required.', 400);
  return email;
}

function requiredNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw statusError(`${label} must be a number.`, 400);
  return number;
}

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value) return [String(value).trim()].filter(Boolean);
  return [];
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function statusError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function text(body, contentType) {
  return new Response(body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300' } });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

function styles() {
  return `:root{--blue:#5d86f4;--dark:#14213d;--lime:#badd3e;--red:#ee4c3a;--muted:#5c667a;--line:#dbe3f4;--soft:#f4f7ff}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:var(--dark);background:#f8fbff}header,footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px clamp(16px,4vw,54px);background:white;border-bottom:1px solid var(--line)}footer{justify-content:center;background:var(--dark);color:white;border:0}nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}a{color:inherit}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:900}.logo{display:inline-grid;place-items:center;min-width:58px;height:42px;border-radius:8px;background:var(--blue);color:var(--lime);font-weight:900}.small{min-width:48px;height:34px;font-size:12px}nav a,.button,button{border:0;border-radius:8px;padding:11px 13px;text-decoration:none;font-weight:800;background:var(--dark);color:white;cursor:pointer}.nav-cta,.button:not(.secondary){background:var(--red)}.secondary{background:var(--blue)}.hero,.form-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.8fr);gap:42px;align-items:center;padding:clamp(42px,7vw,86px) clamp(16px,6vw,76px)}.page,.section,.admin{padding:clamp(42px,7vw,86px) clamp(16px,6vw,76px)}h1{font-size:clamp(2.3rem,6vw,5rem);line-height:.98;margin:0}h2{font-size:clamp(1.8rem,4vw,3rem);line-height:1}.eyebrow{text-transform:uppercase;font-weight:900;color:var(--blue)}p{color:var(--muted);line-height:1.65}.hero-card{min-height:320px;border-radius:8px;background:var(--blue);display:grid;place-items:center;color:white}.big-logo{font-size:clamp(4rem,10vw,8rem);font-weight:900;color:var(--lime)}.grid,.cards,.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.stats{grid-template-columns:repeat(4,minmax(0,1fr))}.activity,article,form,.faq details{border:1px solid var(--line);border-radius:8px;background:white;padding:22px;box-shadow:0 12px 30px rgba(20,33,61,.08)}.tone0{background:var(--blue);color:white}.tone1{background:#00a6c7;color:white}.tone2{background:#8bad15;color:white}.tone3{background:var(--red);color:white}.activity span{display:inline-grid;place-items:center;min-width:54px;height:54px;border-radius:8px;background:white;color:var(--dark);font-weight:900}.list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}form{display:grid;gap:16px}label,legend{display:grid;gap:8px;font-weight:800}input,textarea,select{width:100%;border:1px solid #c8d3e8;border-radius:8px;padding:12px;font:inherit}fieldset{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;border:1px solid var(--line);border-radius:8px}.tabs,.search{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.tabs a{border-radius:8px;padding:11px 13px;background:white;text-decoration:none;font-weight:800}.tabs .active{background:var(--blue);color:white}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:8px}table{width:100%;min-width:980px;border-collapse:collapse;background:white}th,td{padding:12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{background:var(--dark);color:white}@media(max-width:900px){.hero,.form-layout{grid-template-columns:1fr}.grid,.cards,.list,.stats{grid-template-columns:1fr}header{display:grid}nav{justify-content:flex-start}fieldset{grid-template-columns:1fr}}`;
}

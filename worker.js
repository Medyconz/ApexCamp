const PREFIX = 'apexcampwebsite:';
const TABLES = {
  registrations: { label: 'Registrations', fields: ['id', 'created_at', 'status', 'camp_weeks', 'parent_guardian_name', 'parent_guardian_email', 'parent_guardian_phone', 'emergency_contact_name', 'emergency_contact_mobile', 'student_1_name', 'student_1_date_of_birth', 'student_1_has_medical_condition', 'student_1_medical_condition_details'] },
  counsellors: { label: 'Counsellors', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'age', 'availability', 'experience', 'motivation'] },
  instructors: { label: 'Instructors', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'specialty', 'availability', 'experience', 'motivation'] },
  contacts: { label: 'Contact Messages', fields: ['id', 'created_at', 'status', 'name', 'email', 'phone', 'message'] }
};
const STATUSES = new Set(['new', 'reviewed', 'contacted', 'accepted', 'archived']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error.message || 'Unexpected server error.' }, error.status || 500);
    }
  }
};

async function handleApi(request, env, url) {
  assertDb(env);

  if (request.method === 'POST' && url.pathname === '/api/register') return saveRecord(request, env, 'registrations');
  if (request.method === 'POST' && url.pathname === '/api/apply-counsellor') return saveRecord(request, env, 'counsellors');
  if (request.method === 'POST' && url.pathname === '/api/apply-instructor') return saveRecord(request, env, 'instructors');
  if (request.method === 'POST' && url.pathname === '/api/contact') return saveRecord(request, env, 'contacts');

  if (url.pathname.startsWith('/api/admin/')) {
    requireAdmin(request, env);
    if (request.method === 'GET' && url.pathname === '/api/admin/summary') return adminSummary(env);
    if (request.method === 'GET' && url.pathname === '/api/admin/submissions') return adminSubmissions(env, url);
    if (request.method === 'PATCH' && url.pathname === '/api/admin/submissions') return updateStatus(request, env);
    if (request.method === 'GET' && url.pathname === '/api/admin/export') return exportCsv(env, url);
  }

  return json({ error: 'API route not found.' }, 404);
}

async function saveRecord(request, env, type) {
  const body = await readBody(request);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record = { id, created_at: new Date().toISOString(), status: 'new', ...mapPublicRecord(type, body) };
  await env.DB.put(storageKey(type, id), JSON.stringify(record));

  const acceptsJson = (request.headers.get('Accept') || '').includes('application/json');
  if (acceptsJson) return json({ ok: true, id, message: 'Thank you. Your form was saved for the Apex Camp team.' });
  return Response.redirect(new URL('/thanks.html', request.url), 303);
}

function mapPublicRecord(type, body) {
  if (type === 'registrations') {
    return {
      camp_weeks: requiredArray(body.camp_weeks, 'Camp dates'),
      parent_guardian_name: requiredText(body.parent_guardian_name || body.guardian, 'Parent/Guardian Name'),
      parent_guardian_email: requiredEmail(body.parent_guardian_email || body.email),
      parent_guardian_phone: requiredText(body.parent_guardian_phone || body.phone, 'Parent/Guardian Phone'),
      emergency_contact_name: requiredText(body.emergency_contact_name, 'Name of Emergency Contact'),
      emergency_contact_mobile: requiredText(body.emergency_contact_mobile, 'Mobile Number'),
      student_1_name: requiredText(body.student_1_name || body.camper, 'Student 1 Name'),
      student_1_date_of_birth: requiredText(body.student_1_date_of_birth, 'Date of Birth'),
      student_1_has_medical_condition: requiredText(body.student_1_has_medical_condition, 'Medical Condition'),
      student_1_medical_condition_details: optionalText(body.student_1_medical_condition_details)
    };
  }
  if (type === 'counsellors') {
    return {
      name: requiredText(body.name, 'Full name'),
      email: requiredEmail(body.email),
      phone: requiredText(body.phone, 'Phone'),
      age: requiredNumber(body.age, 'Age'),
      availability: requiredText(body.availability, 'Availability'),
      experience: requiredText(body.experience, 'Experience'),
      motivation: requiredText(body.motivation, 'Motivation')
    };
  }
  if (type === 'instructors') {
    return {
      name: requiredText(body.name, 'Full name'),
      email: requiredEmail(body.email),
      phone: requiredText(body.phone, 'Phone'),
      specialty: requiredText(body.specialty, 'Specialty'),
      availability: requiredText(body.availability, 'Availability'),
      experience: requiredText(body.experience, 'Experience'),
      motivation: requiredText(body.motivation, 'Motivation')
    };
  }
  if (type === 'contacts') {
    return {
      name: requiredText(body.name, 'Name'),
      email: requiredEmail(body.email),
      phone: optionalText(body.phone),
      message: requiredText(body.message, 'Message')
    };
  }
  fail('Unknown form type.', 400);
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

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) fail('ADMIN_TOKEN is not configured.', 500);
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== env.ADMIN_TOKEN) fail('Invalid admin token.', 401);
}

function assertDb(env) {
  if (!env.DB) fail('Workers KV binding DB is not configured.', 500);
}

function getConfig(type) {
  const config = TABLES[type];
  if (!config) fail('Unknown database table.', 400);
  return config;
}

function storageKey(type, id) {
  return `${PREFIX}${type}:${id}`;
}

function pick(fields, row) {
  return Object.fromEntries(fields.map((field) => [field, row[field] ?? '']));
}

function requiredText(value, label) {
  const text = optionalText(value);
  if (!text) fail(`${label} is required.`, 400);
  return text;
}

function optionalText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredEmail(value) {
  const email = requiredText(value, 'Email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('A valid email is required.', 400);
  return email;
}

function requiredNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) fail(`${label} must be a number.`, 400);
  return number;
}

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (value) return [String(value).trim()].filter(Boolean);
  return [];
}

function requiredArray(value, label) {
  const values = asArray(value);
  if (!values.length) fail(`${label} requires at least one selection.`, 400);
  return values;
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function fail(message, status) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

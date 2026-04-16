const BASE = '/api';

function token() { return localStorage.getItem('qrf_token'); }

async function req(method, path, body, isForm = false) {
  const headers = {};
  const t = token();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : undefined)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // auth
  login:    (u, p)        => req('POST', '/auth/login',    { username: u, password: p }),
  register: (u, p)        => req('POST', '/auth/register', { username: u, password: p }),
  me:       ()            => req('GET',  '/auth/me'),

  // templates
  getTemplates:   ()      => req('GET',    '/templates'),
  createTemplate: (fd)    => req('POST',   '/templates', fd, true),
  updateTemplate: (id, fd)=> req('PUT',    `/templates/${id}`, fd, true),
  deleteTemplate: (id)    => req('DELETE', `/templates/${id}`),
  setDefault:     (id)    => req('POST',   `/templates/${id}/set-default`),

  // admin
  getSettings:     ()     => req('GET',  '/admin/settings'),
  setSetting:      (k, v) => req('PUT',  `/admin/settings/${k}`, { value: v }),
  getUsers:        ()     => req('GET',  '/admin/users'),
  deleteUser:      (id)   => req('DELETE',`/admin/users/${id}`),
  getAllTemplates:  ()     => req('GET',  '/admin/all-templates'),

  // public (no auth)
  getPublicDefault: ()    => fetch(`${BASE}/admin/public-default`).then(r => r.json()),
};

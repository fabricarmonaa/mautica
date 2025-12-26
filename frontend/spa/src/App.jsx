import React, { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function useApi(token) {
  return useMemo(() => ({
    async request(path, options = {}) {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}${path}`, { ...options, headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return res.status === 204 ? null : res.json();
    }
  }), [token]);
}

function Login({ onLoggedIn }) {
  const [tenantId, setTenantId] = useState('');
  const [dni, setDni] = useState('00000000');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId || undefined, dni, password })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onLoggedIn(data.access_token, data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Tenant ID (vacío usa root-tenant)</label>
        <input value={tenantId} onChange={e => setTenantId(e.target.value)} />
        <label>DNI</label>
        <input value={dni} onChange={e => setDni(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Ingresar</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function SuperAdminPanel({ api, token }) {
  const [tenants, setTenants] = useState([]);
  const [name, setName] = useState('Empresa Demo');
  const [message, setMessage] = useState('');

  async function loadTenants() {
    const data = await api.request('/super/tenants');
    setTenants(data.tenants || []);
  }

  async function createTenant() {
    setMessage('');
    await api.request('/super/tenants', { method: 'POST', body: JSON.stringify({ name }) });
    setMessage('Tenant creado');
    await loadTenants();
  }

  useEffect(() => {
    if (token) loadTenants().catch(err => setMessage(err.message));
  }, [token]);

  return (
    <div className="card">
      <h2>SUPER_ADMIN</h2>
      <div className="row">
        <input value={name} onChange={e => setName(e.target.value)} />
        <button onClick={createTenant}>Crear tenant</button>
      </div>
      {message && <p>{message}</p>}
      <ul>
        {tenants.map(t => (
          <li key={t.id}>{t.name} ({t.status})</li>
        ))}
      </ul>
    </div>
  );
}

function AdminPanel({ api, tenant_id }) {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cash, setCash] = useState([]);
  const [form, setForm] = useState({ dni: '', first_name: '', last_name: '', email: '', phone: '', role: 'ADMIN', password: '' });

  async function loadAll() {
    const [u, o, p, c] = await Promise.all([
      api.request(`/admin/users?tenant_id=${tenant_id || ''}`),
      api.request(`/admin/orders?tenant_id=${tenant_id || ''}`),
      api.request(`/admin/payments?tenant_id=${tenant_id || ''}`),
      api.request(`/admin/cash?tenant_id=${tenant_id || ''}`)
    ]);
    setUsers(u.users || u);
    setOrders(o.orders || o);
    setPayments(p.payments || p);
    setCash(c.cash || c);
  }

  async function createUser() {
    await api.request(`/admin/users?tenant_id=${tenant_id || ''}`, {
      method: 'POST',
      body: JSON.stringify(form)
    });
    await loadAll();
  }

  useEffect(() => {
    loadAll().catch(() => {});
  }, [tenant_id]);

  return (
    <div className="card">
      <h2>Admin</h2>
      <div className="row">
        <input placeholder="DNI" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} />
        <input placeholder="Nombre" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
        <input placeholder="Apellido" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <button onClick={createUser}>Crear usuario</button>
      </div>
      <section>
        <h3>Usuarios</h3>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </section>
      <section>
        <h3>Pedidos</h3>
        <pre>{JSON.stringify(orders, null, 2)}</pre>
      </section>
      <section>
        <h3>Pagos</h3>
        <pre>{JSON.stringify(payments, null, 2)}</pre>
      </section>
      <section>
        <h3>Caja</h3>
        <pre>{JSON.stringify(cash, null, 2)}</pre>
      </section>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('mautica_token') || '');
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('mautica_user');
    return cached ? JSON.parse(cached) : null;
  });
  const api = useApi(token);

  function handleLogin(newToken, userInfo) {
    setToken(newToken);
    setUser(userInfo);
    localStorage.setItem('mautica_token', newToken);
    localStorage.setItem('mautica_user', JSON.stringify(userInfo));
  }

  function logout() {
    setToken('');
    setUser(null);
    localStorage.clear();
  }

  return (
    <div className="container">
      <header>
        <h1>Mautica Multi-tenant SPA</h1>
        {token && <button onClick={logout}>Cerrar sesión</button>}
      </header>
      {!token && <Login onLoggedIn={handleLogin} />}
      {token && user?.role === 'SUPER_ADMIN' && <SuperAdminPanel api={api} token={token} />}
      {token && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <AdminPanel api={api} tenant_id={user?.tenant_id} />
      )}
      {token && user?.role === 'USER' && <p>Panel de usuario final pendiente.</p>}
    </div>
  );
}

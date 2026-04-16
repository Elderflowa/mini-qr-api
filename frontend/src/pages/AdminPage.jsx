import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import './AdminPage.css';

export default function AdminPage() {
  const [users,      setUsers]      = useState([]);
  const [settings,   setSettings]   = useState({});
  const [allTpls,    setAllTpls]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [confirm,    setConfirm]    = useState(null);
  const [savingKey,  setSavingKey]  = useState(null);

  async function load() {
    try {
      const [u, s, t] = await Promise.all([api.getUsers(), api.getSettings(), api.getAllTemplates()]);
      setUsers(u); setSettings(s); setAllTpls(t);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggleSignups(val) {
    setSavingKey('signups_enabled');
    try {
      await api.setSetting('signups_enabled', val ? 'true' : 'false');
      setSettings(s => ({ ...s, signups_enabled: val ? 'true' : 'false' }));
    } finally { setSavingKey(null); }
  }

  async function setGlobalDefault(val) {
    setSavingKey('global_default_template');
    try {
      await api.setSetting('global_default_template', val);
      setSettings(s => ({ ...s, global_default_template: val }));
    } finally { setSavingKey(null); }
  }

  async function deleteUser(id) {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setAllTpls(prev => prev.filter(t => t.user_id !== id));
    } catch (err) { alert(err.message); }
    setConfirm(null);
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}><div className="spinner" /></div>;

  const signupsOn = settings.signups_enabled === 'true';
  const currentDefault = settings.global_default_template || 'classic';

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <h1>Admin</h1>
        <p className="page-sub">Manage users, signups, and global QR defaults.</p>
      </div>

      {/* Settings */}
      <section className="admin-section">
        <h2 className="section-title">Settings</h2>
        <div className="settings-grid">

          <div className="setting-row">
            <div>
              <div className="setting-name">User signups</div>
              <div className="setting-desc">Allow new users to register accounts</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={signupsOn}
                onChange={e => toggleSignups(e.target.checked)}
                disabled={savingKey === 'signups_enabled'} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div style={{ flex:1 }}>
              <div className="setting-name">Default QR template</div>
              <div className="setting-desc">Used when generating QR codes via <code>/?data=</code> URL</div>
            </div>
            <select
              value={currentDefault}
              onChange={e => setGlobalDefault(e.target.value)}
              disabled={savingKey === 'global_default_template'}
              style={{ width: 200 }}
            >
              <option value="classic">Classic (plain black)</option>
              {allTpls.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* Users */}
      <section className="admin-section">
        <h2 className="section-title">Users <span className="count-badge">{users.length}</span></h2>
        <div className="users-table">
          <div className="table-header">
            <span>Username</span>
            <span>Role</span>
            <span>Templates</span>
            <span>Joined</span>
            <span></span>
          </div>
          {users.map(u => {
            const tplCount = allTpls.filter(t => t.user_id === u.id).length;
            return (
              <div key={u.id} className="table-row">
                <span className="table-username">{u.username}</span>
                <span>
                  <span className={`tag ${u.role === 'admin' ? 'tag-orange' : 'tag-gray'}`}>{u.role}</span>
                </span>
                <span className="table-dim">{tplCount}</span>
                <span className="table-dim">{new Date(u.created_at * 1000).toLocaleDateString()}</span>
                <span>
                  {u.role !== 'admin' && (
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirm(u.id)}>Delete</button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {confirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal fade-in" style={{ maxWidth:360 }}>
            <div className="modal-header"><h2>Delete user?</h2></div>
            <div className="modal-body">
              <p style={{ color:'var(--text-dim)' }}>This will permanently delete the user and all their templates.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteUser(confirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import QRPreview from '../components/QRPreview';
import TemplateEditor from '../components/TemplateEditor';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [templates,    setTemplates]    = useState([]);
  const [settings,     setSettings]     = useState({});
  const [allTpls,      setAllTpls]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showEditor,   setShowEditor]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [confirm,      setConfirm]      = useState(null);
  const [savingDefault, setSavingDefault] = useState(false);
  const [defaultSaved,  setDefaultSaved]  = useState(false);

  async function load() {
    try {
      const mine = await api.getTemplates();
      setTemplates(mine);
      // admins can see all templates for the global default picker
      if (user?.role === 'admin') {
        const [s, all] = await Promise.all([api.getSettings(), api.getAllTemplates()]);
        setSettings(s);
        setAllTpls(all);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditTarget(null); setShowEditor(true); }
  function openEdit(t)  { setEditTarget(t);    setShowEditor(true); }
  function closeEditor() { setShowEditor(false); setEditTarget(null); }

  function handleSaved(tpl) {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === tpl.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = tpl; return n; }
      return [tpl, ...prev];
    });
    // also update allTpls for admin picker
    if (user?.role === 'admin') {
      setAllTpls(prev => {
        const idx = prev.findIndex(t => t.id === tpl.id);
        const enriched = { ...tpl, username: user.username };
        if (idx >= 0) { const n = [...prev]; n[idx] = enriched; return n; }
        return [enriched, ...prev];
      });
    }
    closeEditor();
  }

  async function handleDelete(id) {
    try {
      await api.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setAllTpls(prev => prev.filter(t => t.id !== id));
    } catch (err) { alert(err.message); }
    setConfirm(null);
  }

  async function handleSetDefault(id) {
    try {
      await api.setDefault(id);
      setTemplates(prev => prev.map(t => ({ ...t, is_default: t.id === id })));
    } catch (err) { alert(err.message); }
  }

  async function handleGlobalDefault(val) {
    setSavingDefault(true);
    try {
      await api.setSetting('global_default_template', val);
      setSettings(s => ({ ...s, global_default_template: val }));
      setDefaultSaved(true);
      setTimeout(() => setDefaultSaved(false), 2000);
    } catch (err) { alert(err.message); }
    finally { setSavingDefault(false); }
  }

  const isAdmin = user?.role === 'admin';
  const currentGlobalDefault = settings.global_default_template || 'classic';

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Templates</h1>
          <p className="page-sub">Create QR styles. The global default is used when visiting <code>/?data=&lt;url&gt;</code>.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
          New template
        </button>
      </div>

      {/* Global default picker — visible to admins */}
      {isAdmin && !loading && (
        <div className="default-picker-bar">
          <div className="default-picker-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <span>Query default template</span>
            <span className="default-picker-hint">used by <code>/?data=</code></span>
          </div>
          <div className="default-picker-controls">
            <select
              value={currentGlobalDefault}
              onChange={e => handleGlobalDefault(e.target.value)}
              disabled={savingDefault}
              className="default-select"
            >
              <option value="classic">⬛ Classic (plain black &amp; white)</option>
              {allTpls.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.username !== user.username ? ` (${t.username})` : ''}
                </option>
              ))}
            </select>
            {defaultSaved && <span className="saved-indicator">✓ Saved</span>}
            {savingDefault && <span className="spinner" style={{ width:14, height:14 }} />}
          </div>
        </div>
      )}

      {loading ? (
        <div className="center-spinner"><div className="spinner" /></div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
          <p>No templates yet</p>
          <p className="empty-sub">Create a template to customise how your QR codes look</p>
          <button className="btn btn-primary" onClick={openCreate}>Create first template</button>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map(tpl => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              isGlobalDefault={isAdmin && tpl.id === currentGlobalDefault}
              onEdit={() => openEdit(tpl)}
              onDelete={() => setConfirm(tpl.id)}
              onSetDefault={() => handleSetDefault(tpl.id)}
              onSetGlobalDefault={isAdmin ? () => handleGlobalDefault(tpl.id) : null}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <TemplateEditor
          existing={editTarget}
          onSave={handleSaved}
          onClose={closeEditor}
        />
      )}

      {confirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal fade-in" style={{ maxWidth:360 }}>
            <div className="modal-header"><h2>Delete template?</h2></div>
            <div className="modal-body">
              <p style={{ color:'var(--text-dim)' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ tpl, isGlobalDefault, onEdit, onDelete, onSetDefault, onSetGlobalDefault }) {
  const cfg    = tpl.config || {};
  const type   = cfg.type === 'classic' ? 'classic' : 'custom';
  const logoPath = tpl.logo_path || cfg.logoPath;
  const previewConfig = { ...cfg, logoPath: logoPath || undefined };

  return (
    <div className={`tpl-card ${tpl.is_default ? 'is-default' : ''} ${isGlobalDefault ? 'is-global-default' : ''}`}>
      <div className="tpl-preview">
        <QRPreview data="https://qr.eldr.uk" config={previewConfig} type={type} size={130} />
      </div>
      <div className="tpl-info">
        <div className="tpl-name-row">
          <span className="tpl-name">{tpl.name}</span>
          <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
            {isGlobalDefault && <span className="tag tag-orange">query default</span>}
            <span className="tag tag-gray">{type}</span>
          </div>
        </div>
        <div className="tpl-actions">
          {onSetGlobalDefault && !isGlobalDefault && (
            <button className="btn btn-ghost btn-sm" onClick={onSetGlobalDefault} title="Use for /?data= queries">
              Set query default
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}

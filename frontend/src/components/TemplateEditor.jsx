import { useState, useRef } from 'react';
import { api } from '../lib/api';
import QRPreview from './QRPreview';
import './TemplateEditor.css';

const DOT_STYLES    = ['square','dots','rounded','classy','classy-rounded','extra-rounded'];
const CORNER_STYLES = ['square','extra-rounded','dot'];

const DEFAULT_CONFIG = {
  dotStyle:        'rounded',
  cornerStyle:     'extra-rounded',
  cornerDotStyle:  'dot',
  primaryColor:    '#000000',
  secondaryColor:  '#000000',
  backgroundColor: '#ffffff',
  logoPath:        '',
  logoSize:        0.3,
};

export default function TemplateEditor({ existing, onSave, onClose }) {
  const isEdit = !!existing;
  const [name,     setName]     = useState(existing?.name || '');
  const [type,     setType]     = useState(existing ? 'custom' : 'classic');
  const [config,   setConfig]   = useState(existing?.config || { ...DEFAULT_CONFIG });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(existing?.logo_path || '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const fileRef = useRef();

  function set(key, val) {
    setConfig(c => ({ ...c, [key]: val }));
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    set('logoPath', URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!name.trim()) { setError('Template name is required'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('config', JSON.stringify(type === 'classic'
        ? { type: 'classic' }
        : { ...config, type: 'custom' }
      ));
      if (logoFile) fd.append('logo', logoFile);

      const result = isEdit
        ? await api.updateTemplate(existing.id, fd)
        : await api.createTemplate(fd);
      onSave(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const previewConfig = type === 'classic' ? {} : {
    ...config,
    logoPath: logoPreview || config.logoPath || undefined,
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit template' : 'New template'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="editor-layout">
            {/* Left: controls */}
            <div className="editor-controls">
              <div className="form-group">
                <label className="label">Template name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="My template" autoFocus />
              </div>

              <div className="form-group">
                <label className="label">Style</label>
                <div className="type-toggle">
                  <button
                    className={`type-btn ${type === 'classic' ? 'active' : ''}`}
                    onClick={() => setType('classic')}
                  >Classic</button>
                  <button
                    className={`type-btn ${type === 'custom' ? 'active' : ''}`}
                    onClick={() => setType('custom')}
                  >Custom</button>
                </div>
              </div>

              {type === 'custom' && (<>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Primary color</label>
                    <div className="color-row">
                      <input type="color" className="color-swatch" value={config.primaryColor}
                        onChange={e => set('primaryColor', e.target.value)} />
                      <input value={config.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                        placeholder="#000000" style={{ fontFamily:'var(--mono)', fontSize:'12px' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Secondary color</label>
                    <div className="color-row">
                      <input type="color" className="color-swatch" value={config.secondaryColor}
                        onChange={e => set('secondaryColor', e.target.value)} />
                      <input value={config.secondaryColor} onChange={e => set('secondaryColor', e.target.value)}
                        placeholder="#000000" style={{ fontFamily:'var(--mono)', fontSize:'12px' }} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Background color</label>
                  <div className="color-row">
                    <input type="color" className="color-swatch" value={config.backgroundColor}
                      onChange={e => set('backgroundColor', e.target.value)} />
                    <input value={config.backgroundColor} onChange={e => set('backgroundColor', e.target.value)}
                      placeholder="#ffffff" style={{ fontFamily:'var(--mono)', fontSize:'12px' }} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Dot style</label>
                    <select value={config.dotStyle} onChange={e => set('dotStyle', e.target.value)}>
                      {DOT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Corner style</label>
                    <select value={config.cornerStyle} onChange={e => set('cornerStyle', e.target.value)}>
                      {CORNER_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Logo</label>
                  <div className="logo-upload-area" onClick={() => fileRef.current.click()}>
                    {logoPreview
                      ? <img src={logoPreview} alt="logo preview" className="logo-thumb" />
                      : <span className="logo-placeholder">Click to upload image (PNG, JPG, SVG)</span>
                    }
                  </div>
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp"
                    style={{ display:'none' }} onChange={handleLogoChange} />
                  {logoPreview && (
                    <button className="btn btn-ghost btn-sm" style={{ marginTop:6 }} onClick={() => {
                      setLogoFile(null); setLogoPreview(''); set('logoPath', '');
                    }}>Remove logo</button>
                  )}
                </div>

                <div className="form-group">
                  <label className="label">Logo size — {Math.round((config.logoSize || 0.3) * 100)}%</label>
                  <input type="range" min="0.1" max="0.5" step="0.05"
                    value={config.logoSize || 0.3}
                    onChange={e => set('logoSize', parseFloat(e.target.value))}
                    style={{ width:'100%', accentColor:'var(--accent)' }} />
                </div>
              </>)}
            </div>

            {/* Right: live preview */}
            <div className="editor-preview">
              <p className="label" style={{ textAlign:'center', marginBottom:12 }}>Preview</p>
              <div className="preview-box">
                <QRPreview
                  data="https://qr.eldr.uk"
                  config={previewConfig}
                  type={type}
                  size={200}
                />
              </div>
            </div>
          </div>

          {error && <p className="error-msg" style={{ marginTop:12 }}>{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : (isEdit ? 'Save changes' : 'Create template')}
          </button>
        </div>
      </div>
    </div>
  );
}

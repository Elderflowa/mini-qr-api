import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { createQR } from '../lib/qr';
import './QRViewPage.css';

function getData() {
  // Try ?data= query param first
  const params = new URLSearchParams(window.location.search);
  let d = params.get('data');
  if (d) {
    // Fix collapsed https:/ -> https:// (nginx merge_slashes side effect)
    d = d.replace(/^(https?):\/([^/])/, '$1://$2');
    return d;
  }
  // Fall back to reading the path itself (e.g. /https://example.com)
  const path = window.location.pathname.slice(1);
  if (path.startsWith('http')) {
    return path.replace(/^(https?):\/([^/])/, '$1://$2');
  }
  return null;
}

export default function QRViewPage() {
  const ref       = useRef(null);
  const [error,   setError]   = useState('');
  const [ready,   setReady]   = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');

  const data = getData();

  useEffect(() => {
    if (!data) { setError('No data provided. Use ?data=<url>'); return; }

    function render(config, qrType) {
      const bg = (!qrType || qrType === 'classic' || !config?.backgroundColor)
        ? '#ffffff'
        : (config.backgroundColor || '#ffffff');
      setBgColor(bg);

      const size = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.45);
      const qr = createQR(data, config, qrType);
      qr.update({ width: size, height: size });

      if (ref.current) {
        ref.current.innerHTML = '';
        qr.append(ref.current);
      }
      setReady(true);
    }

    api.getPublicDefault()
      .then(({ type, template }) => {
        if (type === 'custom' && template) {
          render({ ...template.config, logoPath: template.logo_path || template.config?.logoPath }, 'custom');
        } else {
          render({}, 'classic');
        }
      })
      .catch(() => render({}, 'classic'));
  }, [data]);

  if (error) {
    return (
      <div className="qrview-shell">
        <p className="qrview-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="qrview-shell">
      {!ready && <div className="spinner" style={{ borderTopColor: '#888' }} />}
      <div
        className={`qrview-wrap ${ready ? 'visible' : ''}`}
        style={{ background: bgColor }}
      >
        <div ref={ref} style={{ lineHeight: 0, display: 'block' }} />
      </div>
    </div>
  );
}

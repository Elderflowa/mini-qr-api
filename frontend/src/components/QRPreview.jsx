import { useEffect, useRef } from 'react';
import { createQR } from '../lib/qr';

export default function QRPreview({ data, config, type, size = 220 }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const qr = createQR(data || 'https://example.com', config || {}, type || 'classic');
    wrapRef.current.innerHTML = '';
    qr.append(wrapRef.current);
    const canvas = wrapRef.current.querySelector('canvas');
    if (canvas) {
      canvas.style.width   = size + 'px';
      canvas.style.height  = size + 'px';
      canvas.style.display = 'block';
    }
  }, [data, config, type, size]);

  const bg = (!type || type === 'classic' || !config?.backgroundColor)
    ? '#ffffff'
    : (config.backgroundColor || '#ffffff');

  return (
    <div style={{
      lineHeight: 0,
      display: 'block',
      background: bg,
      borderRadius: '10px',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div ref={wrapRef} />
    </div>
  );
}

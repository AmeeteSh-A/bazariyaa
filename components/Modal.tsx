'use client';

import { ReactNode, useEffect } from 'react';

export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 10000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: '16px' 
    }}>
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
        onClick={onClose} 
      />
      
      <div style={{ 
        position: 'relative', background: '#fff', borderRadius: 16, 
        width: '100%', maxWidth: 480, maxHeight: '90vh', 
        display: 'flex', flexDirection: 'column', 
        boxShadow: '0 12px 48px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>{title}</h2>
            {subtitle && <p style={{ margin: 0, fontSize: 14, color: 'var(--faint)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--faint)' }}>&times;</button>
        </div>
        
        <div style={{ padding: 24, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
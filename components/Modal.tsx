'use client';

import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from './Icons';

export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <>
      <div className="modal-scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <div>
            <h3 className="h3">{title}</h3>
            {subtitle && <p className="sub">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon size={16} /></button>
        </div>
        {children}
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import type { Faq } from '@/types';

export function FaqList({ items, defaultOpen = 0 }: { items: Faq[]; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="faq">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="faq__item" data-open={isOpen}>
            <button type="button" className="faq__q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
              <span>{f.q}</span><span className="faq__plus" aria-hidden="true">+</span>
            </button>
            {isOpen && <div className="faq__a">{f.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/data/products';
import { GROCERY_CATEGORIES, GROCERY_PRODUCTS } from '@/data/grocery';
import { inr } from '@/utils/format';
import { ArrowIcon, MicIcon, SearchIcon } from './Icons';

interface Suggestion { id: string; icon: string; title: string; meta: string; tag?: string; to: string; }

interface Props {
  placeholder?: string;
  size?: 'sm' | 'lg';
  scope?: 'all' | 'grocery';
  submitLabel?: string;
  onSubmit?: (q: string) => void;
}

export function SearchBar({ placeholder = 'What are you shopping for today?', size = 'lg', scope = 'all', submitLabel, onSubmit }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const listId = useId();
  const blurT = useRef<number>();

  // Live catalogue hits from /api/search (Supabase). Static showcase products below act as fallback.
  const [live, setLive] = useState<Suggestion[]>([]);
  useEffect(() => {
    const s = q.trim();
    if (scope !== 'all' || s.length < 2) { setLive([]); return; }
    const ctl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(s), { signal: ctl.signal });
        if (!res.ok) return;
        const data = await res.json();
        const rows: Array<{ id: string; name: string; brand?: string; price?: string; buy?: number }> = [...(data.exact ?? []), ...(data.similar ?? [])].slice(0, 5);
        setLive(rows.map(r => ({ id: 'db-' + r.id, icon: '🔎', title: r.name, meta: [r.brand, r.price].filter(Boolean).join(' · '), tag: r.buy ? '👍 ' + r.buy + '%' : undefined, to: '/product/' + r.id })));
      } catch { /* aborted or offline: keep static results */ }
    }, 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, scope]);

  const results = useMemo<Suggestion[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const out: Suggestion[] = [...live];
    if (scope === 'all') {
      PRODUCTS.filter(p => (p.name + ' ' + p.brand + ' ' + p.category).toLowerCase().includes(s)).slice(0, 4)
        .forEach(p => out.push({ id: p.id, icon: p.icon, title: p.name, meta: p.brand + ' · ' + inr(p.price), tag: '👍 ' + p.recommended + '%', to: '/product/' + p.slug }));
    }
    GROCERY_PRODUCTS.filter(p => (p.brand + ' ' + p.name + ' ' + p.sub).toLowerCase().includes(s)).slice(0, scope === 'grocery' ? 5 : 2)
      .forEach(p => out.push({ id: p.id, icon: p.emoji, title: p.brand + ' ' + p.name, meta: p.size + ' ' + p.unit + ' · ' + inr(p.price), tag: 'Grocery', to: '/grocery/' + p.cat }));
    GROCERY_CATEGORIES.filter(c => c.name.toLowerCase().includes(s)).slice(0, 2)
      .forEach(c => out.push({ id: 'c-' + c.id, icon: c.icon, title: c.name, meta: c.count + ' products', tag: 'Category', to: '/grocery/' + c.id }));
    return out;
  }, [q, scope, live]);

  const go = (to?: string) => {
    setOpen(false);
    if (to) { router.push(to); return; }
    if (onSubmit) { onSubmit(q); return; }
    router.push(scope === 'grocery' ? '/grocery/search?q=' + encodeURIComponent(q) : results[0]?.to ?? '/');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]?.to); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const showDrop = open && q.trim().length > 0;

  return (
    <div className={'search' + (size === 'sm' ? ' search--sm' : '')}>
      <div className="search__bar">
        <SearchIcon className="muted" />
        <input
          value={q}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={showDrop}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={e => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurT.current = window.setTimeout(() => setOpen(false), 150); }}
          onKeyDown={onKey}
        />
        {size === 'lg' && (
          <>
            <button type="button" className="icon-btn" aria-label="Voice search" onClick={() => { setQ(scope === 'grocery' ? 'sunflower oil' : 'phone under 40000'); setOpen(true); }}><MicIcon className="muted" /></button>
            {submitLabel
              ? <button type="button" className="btn btn--primary" onClick={() => go()}>{submitLabel}</button>
              : <button type="button" className="icon-btn" style={{ background: 'var(--violet)', borderColor: 'var(--violet)', color: '#fff' }} aria-label="Search" onClick={() => go()}><ArrowIcon /></button>}
          </>
        )}
      </div>
      {showDrop && (
        <div className="search__drop" role="listbox" id={listId}>
          <div className="search__label">Results</div>
          {results.length === 0 && <div className="search__item"><span className="search__meta">No match — try a brand, a category or “oil”.</span></div>}
          {results.map((r, i) => (
            <button key={r.id} type="button" role="option" aria-selected={i === active} className="search__item" onMouseDown={e => e.preventDefault()} onClick={() => go(r.to)}>
              <span className="search__ic">{r.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}><span className="search__title">{r.title}</span><span className="search__meta">{r.meta}</span></span>
              {r.tag && <span className="badge">{r.tag}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

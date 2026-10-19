'use client';

import { useMemo, useState } from 'react';
import { PHONES } from '@/data/products';
import type { PhoneSpec } from '@/types';
import { inr } from '@/utils/format';
import { CloseIcon } from './Icons';

type Key = keyof PhoneSpec;
interface RowDef { label: string; note?: string; key: Key; fmt?: (v: never) => string; best?: 'min' | 'max'; }

const ROWS: RowDef[] = [
  { label: 'Buy Score', note: 'Bazariyaa overall', key: 'buy', fmt: (v: number) => v + '/100', best: 'max' },
  { label: 'Price', note: 'today, lowest store', key: 'price', fmt: (v: number) => inr(v), best: 'min' },
  { label: 'Value for money', note: 'per rupee', key: 'value', fmt: (v: number) => v.toFixed(1) + '/10', best: 'max' },
  { label: 'Review trust', note: 'genuine reviews', key: 'trust', fmt: (v: number) => v + '%', best: 'max' },
  { label: 'Display', key: 'display' },
  { label: 'Processor', key: 'processor' },
  { label: 'RAM · Storage', key: 'ramStorage' },
  { label: 'Battery', key: 'battery', fmt: (v: number) => v + ' mAh', best: 'max' },
  { label: 'Camera', key: 'camera' },
  { label: 'Charging', key: 'charging' },
  { label: 'Warranty', key: 'warranty' },
];

/** First column is always the product whose PDP is open. */
export function ComparisonMatrix({ baseId }: { baseId: string }) {
  const [extra, setExtra] = useState<string[]>(['nova', 'zenith']);
  const ids = [baseId, ...extra.filter(i => i !== baseId)].slice(0, 4);
  const cols = ids.map(id => PHONES[id]).filter(Boolean);
  const options = Object.values(PHONES).filter(p => !ids.includes(p.id));

  const bestIdx = useMemo(() => {
    const map: Partial<Record<Key, number>> = {};
    if (cols.length < 2) return map;
    ROWS.forEach(r => {
      if (!r.best) return;
      const vals = cols.map(c => c[r.key] as number);
      const target = r.best === 'min' ? Math.min(...vals) : Math.max(...vals);
      map[r.key] = vals.indexOf(target);
    });
    return map;
  }, [cols]);

  const winner = [...cols].sort((a, b) => b.value - a.value)[0];
  const verdict = cols.length > 1 ? {
    overall: [...cols].sort((a, b) => b.buy - a.buy)[0].name,
    value: winner.name,
    budget: [...cols].sort((a, b) => a.price - b.price)[0].name,
  } : null;

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {verdict && (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14 }}>
          <strong>Verdict</strong>
          <span><span className="muted">Best overall:</span> <b>{verdict.overall}</b></span>
          <span><span className="muted">Best value:</span> <b>{verdict.value}</b></span>
          <span><span className="muted">Best for budget:</span> <b>{verdict.budget}</b></span>
        </div>
      )}
      <div className="matrix">
        <table>
          <thead>
            <tr>
              <th style={{ width: 200 }}><span className="faint" style={{ fontSize: 11, textTransform: 'uppercase' }}>Comparing {cols.length} phones</span></th>
              {cols.map((c, i) => (
                <th key={c.id} style={i === 0 ? { position: 'sticky', left: 200, zIndex: 1, background: 'var(--violet-soft)' } : undefined}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <div>
                      <div className="placeholder" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 10 }} />
                      <div className="muted" style={{ fontSize: 12, fontWeight: 500 }}>{c.brand}{i === 0 && ' · this product'}</div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                    </div>
                    {i > 0 && <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} aria-label={'Remove ' + c.name} onClick={() => setExtra(e => e.filter(x => x !== c.id))}><CloseIcon size={14} /></button>}
                  </div>
                </th>
              ))}
              {cols.length < 4 && (
                <th>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--violet)', marginBottom: 8 }} htmlFor="add-phone">+ Add a product</label>
                  <select id="add-phone" value="" onChange={e => e.target.value && setExtra(x => [...x, e.target.value])} className="chip" style={{ width: '100%' }}>
                    <option value="">Choose…</option>
                    {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r.label}>
                <td><b style={{ fontWeight: 600 }}>{r.label}</b>{r.note && <div className="faint" style={{ fontSize: 12 }}>{r.note}</div>}</td>
                {cols.map((c, i) => {
                  const raw = c[r.key] as never;
                  const val = r.fmt ? r.fmt(raw) : String(raw);
                  return (
                    <td key={c.id} style={i === 0 ? { position: 'sticky', left: 200, zIndex: 1, background: 'var(--violet-soft)' } : undefined}>
                      {bestIdx[r.key] === i ? <span className="best">{val}<em>BEST</em></span> : val}
                    </td>
                  );
                })}
                {cols.length < 4 && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

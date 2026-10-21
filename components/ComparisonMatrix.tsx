'use client';

import { useMemo, useState } from 'react';
import type { PhoneSpec } from '@/types';
import { inr } from '@/utils/format';
import { CloseIcon } from './Icons';

type Key = keyof PhoneSpec;
interface RowDef {
  label: string;
  note?: string;
  key: Key;
  fmt?: (v: never) => string;
  best?: 'min' | 'max';
}

const ROWS: RowDef[] = [
  { label: 'Buy Score', note: 'Bazariyaa overall', key: 'buy', fmt: (v: number) => v + '/100', best: 'max' },
  { label: 'Price', note: 'today, lowest store', key: 'price', fmt: (v: number) => inr(v), best: 'min' },
  { label: 'Value for money', note: 'per rupee', key: 'value', fmt: (v: number) => Number(v).toFixed(1) + '/10', best: 'max' },
  { label: 'Review trust', note: 'genuine reviews', key: 'trust', fmt: (v: number) => v + '%', best: 'max' },
  { label: 'Display', key: 'display' },
  { label: 'Processor', key: 'processor' },
  { label: 'RAM & Storage', key: 'ramStorage' },
  { label: 'Battery', key: 'battery', fmt: (v: number) => v + ' mAh', best: 'max' },
  { label: 'Camera', key: 'camera' },
  { label: 'Charging', key: 'charging' },
  { label: 'Warranty', key: 'warranty' },
];

export function ComparisonMatrix({ 
  baseSpec, 
  availableSpecs = []
}: { 
  baseSpec?: PhoneSpec; 
  availableSpecs?: PhoneSpec[]; 
}) {
  const [extra, setExtra] = useState<PhoneSpec[]>([]);
  
  if (!baseSpec) {
    return (
      <div className="card card--pad" style={{ textAlign: 'center', padding: 48, color: 'var(--slate-text)' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
        Comparison data not available for this product yet.
      </div>
    );
  }

  // Combine base product with selected extras, max 4
  const cols = [baseSpec, ...extra].slice(0, 4);
  
  // Filter out products that are already in the comparison columns
  const options = availableSpecs.filter(
    spec => !cols.some(c => c.id === spec.id)
  );

  const bestIdx = useMemo(() => {
    const map: Partial<Record<Key, number>> = {};
    if (cols.length < 2) return map;
    ROWS.forEach(r => {
      if (!r.best) return;
      const vals = cols.map(c => Number(c[r.key]) || 0);
      const target = r.best === 'min' ? Math.min(...vals) : Math.max(...vals);
      map[r.key] = vals.indexOf(target);
    });
    return map;
  }, [cols]);

  const winner = [...cols].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  const verdict = cols.length > 1 ? {
    overall: [...cols].sort((a, b) => (b.buy || 0) - (a.buy || 0))[0].name,
    value: winner.name,
    budget: [...cols].sort((a, b) => (a.price || 0) - (b.price || 0))[0].name,
  } : null;

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {verdict && (
        <div style={{ padding: '20px 24px', background: 'var(--canvas)', borderBottom: '1px solid var(--divider)' }}>
          <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ color: 'var(--violet)' }}>Overall Winner</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{verdict.overall}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ color: 'var(--green)' }}>Best Value</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{verdict.value}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Best Budget</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{verdict.budget}</div>
            </div>
          </div>
        </div>
      )}
      <div className="matrix scroll-x">
        <table>
          <thead>
            <tr>
              <th style={{ width: 200 }}><span className="faint" style={{ fontSize: 11, textTransform: 'uppercase' }}>Comparing {cols.length} phones</span></th>
              {cols.map((c, i) => (
                <th key={c.id} style={i === 0 ? { position: 'sticky', left: 200, zIndex: 1, background: 'var(--violet-soft)' } : undefined}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <div>
                      <div className="placeholder" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 10 }} />
                      <div className="muted" style={{ fontSize: 12, fontWeight: 500 }}>{c.brand}{i === 0 && ' • this product'}</div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                    </div>
                    {i > 0 && (
                      <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} aria-label={'Remove ' + c.name} onClick={() => setExtra(e => e.filter(x => x.id !== c.id))}>
                        <CloseIcon size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {cols.length < 4 && (
                <th>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--violet)', marginBottom: 8 }} htmlFor="add-phone">+ Add a product</label>
                  <select 
                    id="add-phone" 
                    value="" 
                    onChange={e => {
                      const selected = options.find(o => o.id === e.target.value);
                      if (selected) setExtra(x => [...x, selected]);
                    }} 
                    className="chip" 
                    style={{ width: '100%' }}
                  >
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
                  const val = r.fmt ? r.fmt(raw) : String(raw || '-');
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
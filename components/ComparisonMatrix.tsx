'use client';

import { useMemo, useState } from 'react';
import type { ProductSpec } from '@/types';
import { inr } from '@/utils/format';
import { CloseIcon } from './Icons';

const BASE_ROWS = [
  { label: 'Buy Score', note: 'Bazariyaa overall', key: 'buy', fmt: (v: number) => v + '/100', best: 'max' },
  { label: 'Price', note: 'today, lowest store', key: 'price', fmt: (v: number) => inr(v), best: 'min' },
  { label: 'Value for money', note: 'per rupee', key: 'value', fmt: (v: number) => Number(v).toFixed(1) + '/10', best: 'max' },
  { label: 'Review trust', note: 'genuine reviews', key: 'trust', fmt: (v: number) => v + '%', best: 'max' },
] as const;

export function ComparisonMatrix({ 
  baseSpec, 
  availableSpecs = []
}: { 
  baseSpec?: ProductSpec; 
  availableSpecs?: ProductSpec[]; 
}) {
  const [extra, setExtra] = useState<ProductSpec[]>([]);
  
  if (!baseSpec) {
    return (
      <div className="card card--pad" style={{ textAlign: 'center', padding: 48, color: 'var(--slate-text)' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
        Comparison data not available for this product yet.
      </div>
    );
  }

  const cols = [baseSpec, ...extra].slice(0, 4);
  const options = availableSpecs.filter(spec => !cols.some(c => c.id === spec.id));

  const dynamicFeatures = useMemo(() => {
    const keys = new Set<string>();
    cols.forEach(c => {
      if (c.features) {
        Object.keys(c.features).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [cols]);

  const bestIdx = useMemo(() => {
    const map: Record<string, number> = {};
    if (cols.length < 2) return map;
    BASE_ROWS.forEach(r => {
      if (!r.best) return;
      const vals = cols.map(c => Number(c[r.key as keyof ProductSpec]) || 0);
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
              <th style={{ width: 200 }}><span className="faint" style={{ fontSize: 11, textTransform: 'uppercase' }}>Comparing {cols.length} items</span></th>
              {cols.map((c, i) => (
                <th key={c.id} style={i === 0 ? { position: 'sticky', left: 200, zIndex: 1, background: 'var(--violet-soft)' } : undefined}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <div>
                      {c.image ? (
                        <img src={c.image} alt={c.name} style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 10, objectFit: 'contain', background: '#fff' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div className="placeholder" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 10 }} />
                      )}
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
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--violet)', marginBottom: 8 }} htmlFor="add-product">+ Add a product</label>
                  <select 
                    id="add-product" 
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
            {BASE_ROWS.map(r => (
              <tr key={r.label}>
                <td><b style={{ fontWeight: 600 }}>{r.label}</b>{r.note && <div className="faint" style={{ fontSize: 12 }}>{r.note}</div>}</td>
                {cols.map((c, i) => {
                  const val = r.fmt ? r.fmt(c[r.key as keyof ProductSpec] as number) : String(c[r.key as keyof ProductSpec] || '-');
                  return (
                    <td key={c.id} style={i === 0 ? { position: 'sticky', left: 200, zIndex: 1, background: 'var(--violet-soft)' } : undefined}>
                      {bestIdx[r.key] === i ? <span className="best">{val}<em>BEST</em></span> : val}
                    </td>
                  );
                })}
                {cols.length < 4 && <td />}
              </tr>
            ))}
            
            {dynamicFeatures.map(feat => (
              <tr key={feat}>
                <td><b style={{ fontWeight: 600 }}>{feat}</b></td>
                {cols.map((c, i) => (
                  <td key={c.id} style={i === 0 ? { position: 'sticky', left: 200, zIndex: 1, background: 'var(--violet-soft)' } : undefined}>
                    {c.features[feat] || '-'}
                  </td>
                ))}
                {cols.length < 4 && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import type { GroceryProduct } from '@/types';
import { discountPct, inr, unitPrice } from '@/utils/format';
import { useCompare } from '@/context/CompareContext';
import { CheckIcon, HeartIcon, InfoIcon } from './Icons';

// Fallback variants if the DB unit matches
const VARIANTS: Record<string, string[]> = {
  L: ['1 L', '2 L', '5 L'], 
  ml: ['500 ml', '1 L', '2 L'], 
  kg: ['1 kg', '5 kg', '10 kg'], 
  g: ['100 g', '200 g', '500 g'], 
  pc: ['6 pc', '12 pc', '30 pc'],
};

export function GroceryCard({ p }: { p: GroceryProduct }) {
  const [wished, setWished] = useState(false);
  const cmp = useCompare();
  const compared = cmp.has(p.id);
  
  // Map new DB fields
  const pack = `${p.size_value || ''} ${p.size_unit || ''}`.trim();
  const [variant, setVariant] = useState(pack);
  
  const mrp = p.regular_price || p.price;
  const up = unitPrice(p.price, p.size_value || 1, p.size_unit || 'pc');
  const pct = discountPct(p.price, mrp);
  const save = mrp - p.price;

  // The primary store is pulled dynamically from the database. 
  // Secondary stores are generated for the comparison UI.
  const stores = [
    { name: p.retailer || 'Store', logo: (p.retailer?.[0] || 'S').toUpperCase(), bg: 'var(--violet)', mult: 1, delivery: 'Today' },
    { name: 'Blinkit', logo: 'b', bg: '#E4A800', mult: 1.05, delivery: '10 min' },
    { name: 'Zepto', logo: 'Z', bg: '#5433EB', mult: 1.08, delivery: '10 min' },
    { name: 'Amazon', logo: 'a', bg: '#232F3E', mult: 1.12, delivery: 'Tomorrow' },
  ].map((s, i) => ({ ...s, price: i === 0 ? p.price : Math.round(p.price * s.mult) }));

  const unitVariants = p.size_unit && VARIANTS[p.size_unit] ? VARIANTS[p.size_unit] : [pack];

  return (
    <article className="card card--hover gcard">
      <div className="gcard__product">
        <div className="gcard__img">
          {p.image_url ? (
            <img src={p.image_url} alt={`${p.brand || ''} ${p.name}`} loading="lazy" />
          ) : (
            <span className="emoji" aria-hidden="true">🛒</span>
          )}
          <button type="button" className={'icon-btn gcard__heart' + (wished ? ' icon-btn--on' : '')} aria-pressed={wished} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => setWished(w => !w)}>
            <HeartIcon size={16} filled={wished} />
          </button>
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="row">
            <h3 className="gcard__title" style={{ margin: 0 }}>{p.brand} {p.name}</h3>
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>{pack}</div>
          <div className="row" style={{ gap: 6, marginTop: 10 }} role="group" aria-label="Pack size">
            {unitVariants.map(v => (
              <button key={v} type="button" className="variant" aria-pressed={v === variant} onClick={() => setVariant(v)}>{v}</button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <div className="info info--violet tip" tabIndex={0}>
              <b>{up.short}</b><span>Unit price ⓘ</span>
              <span className="tip__pop" role="tooltip">{up.label} · normalised so pack sizes compare fairly</span>
            </div>
          </div>
          <button type="button" className="row" style={{ background: 'none', border: 0, padding: 0, marginTop: 12, alignSelf: 'flex-start', fontSize: 12.5, fontWeight: 500, color: compared ? 'var(--violet)' : '#55504A' }} aria-pressed={compared} onClick={() => cmp.toggle(p.id)}>
            <span className={'check' + (compared ? ' check--on' : '')}>{compared && <CheckIcon size={10} color="#fff" strokeWidth={3.5} />}</span>
            Compare
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.035em' }}>{inr(p.price)}</div>
        <div className="row" style={{ marginTop: 2 }}>
          <s className="faint" style={{ fontSize: 12.5 }}>{inr(mrp)}</s>
          {save > 0 && (
            <span className="tip" tabIndex={0} style={{ fontSize: 11.5, fontWeight: 600, color: '#B4462E', cursor: 'help' }}>
              {pct}% OFF<span className="tip__pop" role="tooltip">You save {inr(save)} vs MRP</span>
            </span>
          )}
        </div>
        {save > 0 && (
          <div className="row" style={{ gap: 4, fontSize: 12, fontWeight: 500, color: 'var(--green)', marginTop: 8 }}>
            You save {inr(save)} <InfoIcon size={12} />
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>LOWEST PRICE</div>
        <div className="row gcard__stores" style={{ flexWrap: 'nowrap', alignItems: 'stretch' }}>
          {stores.map((s, i) => (
            <div key={s.name} className={'store tip' + (i === 0 ? ' store--lowest' : '')} tabIndex={0}>
              <div className="row" style={{ gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}>
                <span className="store__logo" style={{ background: s.bg }}>{s.logo}</span>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: '#55504A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
              </div>
              <div className="store__price">{inr(s.price)}</div>
              <div className="faint" style={{ fontSize: 9.5, marginTop: 2 }}>{s.delivery}</div>
              <span className="tip__pop" role="tooltip">{s.name} · {inr(s.price)} · {s.delivery} · in stock</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <button type="button" className="btn btn--primary btn--block" style={{ flexDirection: 'column', gap: 0, lineHeight: 1.25 }}>
          Add to Cart<span style={{ fontSize: 10.5, fontWeight: 500, color: '#CFC4F7' }}>{inr(p.price)} at {stores[0].name}</span>
        </button>
        <button type="button" className="btn btn--ghost btn--sm" style={{ color: compared ? 'var(--violet)' : '#55504A', justifySelf: 'center' }} onClick={() => cmp.toggle(p.id)}>
          {compared ? '✓ Added to compare' : '+ Add to Compare'}
        </button>
      </div>
    </article>
  );
}
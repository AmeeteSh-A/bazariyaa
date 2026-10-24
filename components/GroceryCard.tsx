'use client';

import { useState } from 'react';
import type { Unit } from '@/types';
import { discountPct, inr, unitPrice } from '@/utils/format';
import { HeartIcon, InfoIcon } from './Icons';

function getStoreBrand(name: string) {
  const n = name.toLowerCase();
  if (n.includes('blinkit')) return { logo: 'b', bg: '#E4A800' };
  if (n.includes('zepto')) return { logo: 'Z', bg: '#5433EB' };
  if (n.includes('amazon')) return { logo: 'a', bg: '#232F3E' };
  if (n.includes('bigbasket')) return { logo: 'bb', bg: '#84C225' };
  if (n.includes('instamart')) return { logo: 'i', bg: '#F14C23' };
  if (n.includes('noon')) return { logo: 'n', bg: '#FEE000' };
  if (n.includes('carrefour')) return { logo: 'c', bg: '#00387B' };
  if (n.includes('razi')) return { logo: 'R', bg: '#1F7A5A' };
  if (n.includes('barakat')) return { logo: 'B', bg: '#B4462E' };
  if (n.includes('alnamoos')) return { logo: 'Al', bg: '#000000' };
  return { logo: name[0].toUpperCase(), bg: 'var(--violet)' };
}

type GroupedGrocery = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  image_url?: string;
  sizes: {
    sizeKey: string;
    size_value: number;
    size_unit: string;
    stores: { id: string; name: string; price: number; mrp: number; url: string; inStock: boolean }[];
  }[];
};

export function GroceryCard({ p }: { p: GroupedGrocery }) {
  const [wished, setWished] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(0);

  const currentSize = p.sizes[sizeIdx] || p.sizes[0];
  if (!currentSize) return null;

  const dynamicStores = currentSize.stores;
  const bestStore = dynamicStores[0];
  const bestPrice = bestStore.price;
  
  const bestMrp = bestStore.mrp > bestPrice ? bestStore.mrp : bestPrice;

  const up = unitPrice(bestPrice, currentSize.size_value, (currentSize.size_unit as Unit) || 'pc');
  const pct = discountPct(bestPrice, bestMrp);
  const save = bestMrp - bestPrice;

  return (
    <article className="card card--hover gcard">
      <div className="gcard__product">
        <div className="gcard__img">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} loading="lazy" />
          ) : (
            <span className="emoji" aria-hidden="true">🛒</span>
          )}
          <button type="button" className={'icon-btn gcard__heart' + (wished ? ' icon-btn--on' : '')} aria-pressed={wished} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => setWished(w => !w)}>
            <HeartIcon size={16} filled={wished} />
          </button>
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="row">
            <h3 className="gcard__title" style={{ margin: 0 }}>
              {p.brand ? `${p.brand} ${p.name}` : p.name}
            </h3>
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>{currentSize.sizeKey}</div>
          
          <div className="row" style={{ gap: 6, marginTop: 10 }} role="group" aria-label="Pack size">
            {p.sizes.map((s, idx) => (
              <button key={s.sizeKey} type="button" className="variant" aria-pressed={idx === sizeIdx} onClick={() => setSizeIdx(idx)}>
                {s.sizeKey}
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="info info--violet tip" tabIndex={0}>
              <b>{up.short}</b><span>Unit price ⓘ</span>
              <span className="tip__pop" role="tooltip">{up.label} · normalised so pack sizes compare fairly</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.035em' }}>{inr(bestPrice)}</div>
        
        {bestMrp > bestPrice && (
          <div className="row" style={{ marginTop: 2 }}>
            <s className="faint" style={{ fontSize: 12.5 }}>{inr(bestMrp)}</s>
            {pct > 0 && (
              <span className="tip" tabIndex={0} style={{ fontSize: 11.5, fontWeight: 600, color: '#B4462E', cursor: 'help' }}>
                {pct}% OFF<span className="tip__pop" role="tooltip">You save {inr(save)} vs MRP</span>
              </span>
            )}
          </div>
        )}
        
        {save > 0 && (
          <div className="row" style={{ gap: 4, fontSize: 12, fontWeight: 500, color: 'var(--green)', marginTop: 8 }}>
            You save {inr(save)} <InfoIcon size={12} />
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
          {dynamicStores.length > 1 ? 'COMPARE PRICES' : 'LOWEST PRICE'}
        </div>
        <div className="row gcard__stores" style={{ flexWrap: 'nowrap', alignItems: 'stretch' }}>
          {dynamicStores.slice(0, 4).map((s, i) => {
            const brand = getStoreBrand(s.name);
            return (
              <div key={s.id} className={'store tip' + (i === 0 ? ' store--lowest' : '')} tabIndex={0}>
                <div className="row" style={{ gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}>
                  <span className="store__logo" style={{ background: brand.bg }}>{brand.logo}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: '#55504A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                </div>
                <div className="store__price" style={!s.inStock ? { textDecoration: 'line-through', color: 'var(--faint)' } : {}}>{inr(s.price)}</div>
                <span className="tip__pop" role="tooltip">{s.name} · {inr(s.price)} · {s.inStock ? 'In stock' : 'Out of stock'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <a href={bestStore.url || '#'} target="_blank" rel="noreferrer" className="btn btn--primary btn--block" style={{ flexDirection: 'column', gap: 0, lineHeight: 1.25, textDecoration: 'none' }}>
          Buy at {bestStore.name}<span style={{ fontSize: 10.5, fontWeight: 500, color: '#CFC4F7' }}>{inr(bestPrice)}</span>
        </a>
      </div>
    </article>
  );
}
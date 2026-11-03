'use client';

import { useState } from 'react';
import { inr } from '@/utils/format';
import { HeartIcon } from './Icons';

type GroceryStore = {
  name: string;
  listing_title: string;
  price: number;
  inStock: boolean;
  url: string;
};

type GrocerySize = {
  sizeKey: string;
  size_value: number;
  size_unit: string;
  from_unit_price: number;
  stores: GroceryStore[];
};

type GroceryForm = {
  form: string;
  sizes: GrocerySize[];
};

type PostgresGroceryProduct = {
  key: string;
  title: string;
  image_url: string;
  forms: GroceryForm[];
};

function getStoreBrand(name: string) {
  const n = name.toLowerCase();
  if (n.includes('noon')) return { logo: 'n', bg: '#FEE000' };
  if (n.includes('carrefour')) return { logo: 'c', bg: '#00387B' };
  if (n.includes('razi')) return { logo: 'R', bg: '#1F7A5A' };
  if (n.includes('barakat')) return { logo: 'B', bg: '#B4462E' };
  if (n.includes('alnamoos')) return { logo: 'Al', bg: '#000000' };
  if (n.includes('amazon')) return { logo: 'a', bg: '#232F3E' };
  if (n.includes('talabat')) return { logo: 't', bg: '#FF5A00' };
  if (n.includes('careem')) return { logo: 'C', bg: '#47A23F' };
  if (n.includes('lulu')) return { logo: 'L', bg: '#E22028' };
  if (n.includes('blinkit')) return { logo: 'b', bg: '#E4A800' };
  if (n.includes('zepto')) return { logo: 'Z', bg: '#5433EB' };
  if (n.includes('instamart')) return { logo: 'i', bg: '#F14C23' };
  if (n.includes('bigbasket')) return { logo: 'bb', bg: '#84C225' };
  return { logo: name[0].toUpperCase(), bg: 'var(--violet)' };
}

export function GroceryCard({ p }: { p: PostgresGroceryProduct }) {
  const [wished, setWished] = useState(false);
  const [formIdx, setFormIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  
  const currentForm = p.forms[formIdx] || p.forms[0];
  if (!currentForm) return null;

  const currentSize = currentForm.sizes[sizeIdx] || currentForm.sizes[0];
  if (!currentSize) return null;

  const dynamicStores = currentSize.stores || [];
  const bestStore = dynamicStores[0];
  if (!bestStore) return null;

  const bestPrice = bestStore.price;

  return (
    <article className="card card--hover gcard">
      <div className="gcard__product">
        <div className="gcard__img">
          {p.image_url ? (
            <img src={p.image_url} alt={p.title} loading="lazy" />
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
              {p.title}
            </h3>
          </div>
          
          {p.forms.length > 1 && (
            <div className="row" style={{ gap: 6, marginTop: 10 }} role="group" aria-label="Product form">
              {p.forms.map((f, idx) => (
                <button 
                  key={f.form} 
                  type="button" 
                  className="chip chip--soft" 
                  aria-pressed={idx === formIdx} 
                  onClick={() => { setFormIdx(idx); setSizeIdx(0); }}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  {f.form}
                </button>
              ))}
            </div>
          )}

          <div className="row" style={{ gap: 6, marginTop: p.forms.length > 1 ? 8 : 10 }} role="group" aria-label="Pack options">
            {currentForm.sizes.map((s, idx) => (
              <button key={s.sizeKey} type="button" className="variant" aria-pressed={idx === sizeIdx} onClick={() => setSizeIdx(idx)}>
                {s.sizeKey}
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="info info--violet tip" tabIndex={0}>
              <b>
                {currentSize.from_unit_price < 1 
                  ? `${inr(currentSize.from_unit_price * 100)}/100${currentSize.size_unit}` 
                  : `${inr(currentSize.from_unit_price)}/${currentSize.size_unit}`}
              </b>
              <span>Unit price </span>
              <span className="tip__pop" role="tooltip">Calculated unit price to compare fairly</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.035em' }}>{inr(bestPrice)}</div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
          {dynamicStores.length > 1 ? `COMPARE ${dynamicStores.length} STORES` : 'LOWEST PRICE'}
        </div>
        <div className="row gcard__stores" style={{ flexWrap: 'nowrap', alignItems: 'stretch' }}>
          {dynamicStores.slice(0, 4).map((s, i) => {
            const brand = getStoreBrand(s.name);
            return (
              <div key={s.name + i} className={'store tip' + (i === 0 ? ' store--lowest' : '')} tabIndex={0}>
                <div className="row" style={{ gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}>
                  <span className="store__logo" style={{ background: brand.bg }}>{brand.logo}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: '#55504A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                </div>
                <div className="store__price" style={!s.inStock ? { textDecoration: 'line-through', color: 'var(--faint)' } : {}}>{inr(s.price)}</div>
                <span className="tip__pop" role="tooltip">{currentForm.form} {currentSize.sizeKey} — {inr(s.price)} at {s.name}</span>
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
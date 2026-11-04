'use client';

import { useState, useEffect } from 'react';
import { inr } from '@/utils/format';
import { HeartIcon } from './Icons';
import { useCart } from './Cart';

type GroceryStore = { name: string; listing_title: string; price: number; inStock: boolean; url: string; image_url: string; };
type GrocerySize = { sizeKey: string; size_value: number; size_unit: string; from_unit_price: number; stores: GroceryStore[]; };
type GroceryVariant = { brand: string; variant: string; form: string; variant_label: string; sizes: GrocerySize[]; };

type PostgresGroceryProduct = {
  key: string;
  title: string;
  image_url: string;
  variants: GroceryVariant[];
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
  return { logo: name[0].toUpperCase(), bg: 'var(--violet)' };
}

export function GroceryCard({ p }: { p: PostgresGroceryProduct }) {
  const { addToCart } = useCart();
  const [wished, setWished] = useState(false);
  
  const [variantIdx, setVariantIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
  
  const currentVariant = p.variants[variantIdx] || p.variants[0];
  const currentSize = currentVariant?.sizes[sizeIdx] || currentVariant?.sizes[0];
  const dynamicStores = currentSize?.stores || [];
  
  useEffect(() => {
    setSelectedStoreIndex(0);
  }, [variantIdx, sizeIdx]);

  if (!currentVariant || !currentSize || dynamicStores.length === 0) return null;

  const activeStore = dynamicStores[selectedStoreIndex] || dynamicStores[0];
  const displayImage = activeStore.image_url || p.image_url;

  const handleAddToCart = () => {
    addToCart({
      id: `${p.key}-${currentVariant.variant_label}-${currentSize.sizeKey}-${activeStore.name}-${activeStore.price}`,
      title: p.title,
      variantLabel: currentVariant.variant_label,
      sizeLabel: currentSize.sizeKey,
      price: activeStore.price,
      storeName: activeStore.name,
      storeUrl: activeStore.url,
      listingTitle: activeStore.listing_title,
      imageUrl: displayImage
    });
  };

  return (
    <article className="card card--hover gcard">
      <div className="gcard__product">
        <div className="gcard__img">
          {displayImage ? (
            <img src={displayImage} alt={p.title} loading="lazy" />
          ) : (
            <span className="emoji" aria-hidden="true">🛒</span>
          )}
          <button type="button" className={'icon-btn gcard__heart' + (wished ? ' icon-btn--on' : '')} onClick={() => setWished(w => !w)}>
            <HeartIcon size={16} filled={wished} />
          </button>
        </div>
        
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="row">
            <h3 className="gcard__title" style={{ margin: 0 }}>{p.title}</h3>
          </div>
          
          {p.variants.length > 1 && (
            <div className="row" style={{ gap: 6, marginTop: 10 }}>
              {p.variants.map((v, idx) => (
                <button key={`${v.brand}-${v.variant}-${v.form}`} type="button" className="chip chip--soft" aria-pressed={idx === variantIdx} onClick={() => { setVariantIdx(idx); setSizeIdx(0); }} style={{ padding: '4px 10px', fontSize: 12 }}>
                  {v.variant_label}
                </button>
              ))}
            </div>
          )}

          <div className="row" style={{ gap: 6, marginTop: p.variants.length > 1 ? 8 : 10 }}>
            {currentVariant.sizes.map((s, idx) => (
              <button key={s.sizeKey} type="button" className="variant" aria-pressed={idx === sizeIdx} onClick={() => setSizeIdx(idx)}>
                {s.sizeKey}
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="info info--violet tip" tabIndex={0}>
              <b>
                {currentSize.from_unit_price < 1 ? `${inr(currentSize.from_unit_price * 100)}/100${currentSize.size_unit}` : `${inr(currentSize.from_unit_price)}/${currentSize.size_unit}`}
              </b>
              <span>Unit price</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.035em' }}>{inr(activeStore.price)}</div>
        <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>from {activeStore.name}</div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
          {dynamicStores.length > 1 ? `COMPARE ${dynamicStores.length} STORES` : 'AVAILABLE AT'}
        </div>
        <div className="row gcard__stores" style={{ flexWrap: 'nowrap', alignItems: 'stretch' }}>
          {dynamicStores.slice(0, 4).map((s, i) => {
            const brand = getStoreBrand(s.name);
            const isSelected = selectedStoreIndex === i;
            return (
              <div 
                key={s.url + i} 
                className={`store tip ${isSelected ? 'store--selected' : ''}`} 
                onClick={() => setSelectedStoreIndex(i)}
                style={{
                  cursor: 'pointer', border: isSelected ? '2px solid var(--violet)' : '1px solid transparent', background: isSelected ? 'var(--violet-light)' : undefined
                }}
              >
                <div className="row" style={{ gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}><span className="store__logo" style={{ background: brand.bg }}>{brand.logo}</span><span style={{ fontSize: 10.5, fontWeight: 500, color: '#55504A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span></div>
                <div className="store__price" style={!s.inStock ? { textDecoration: 'line-through', color: 'var(--faint)' } : {}}>{inr(s.price)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={handleAddToCart} className="btn btn--secondary" style={{ flex: 1, padding: '10px 0', fontSize: 13, background: '#F3F0FE', color: 'var(--violet)' }}>Add to Cart</button>
        <a href={activeStore.url || '#'} target="_blank" rel="noreferrer" className="btn btn--primary" style={{ flex: 1, padding: '10px 0', fontSize: 13, textDecoration: 'none' }}>Buy Now</a>
      </div>
    </article>
  );
}
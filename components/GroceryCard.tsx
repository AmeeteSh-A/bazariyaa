'use client';

import { useState, useEffect } from 'react';
import { inr, formatNormalizedUnit } from '@/utils/format';
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

function findBrandVariantIndex(variants: GroceryVariant[], preferredBrand?: string | null) {
  if (!preferredBrand) return 0;
  const target = preferredBrand.toLowerCase();
  const idx = variants.findIndex(
    (v) => v.brand.toLowerCase() === target || v.variant_label.toLowerCase() === target
  );
  return idx >= 0 ? idx : 0;
}

function formatUnitPrice(price: number, size: GrocerySize) {
  const unitPrice = size.size_value > 0 ? price / size.size_value : size.from_unit_price;
  const decimals = unitPrice >= 1 ? 2 : unitPrice >= 0.01 ? 3 : 4;
  const formatted = unitPrice
    .toFixed(decimals)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');
  const currency = inr(0).replace(/0(?:\.0+)?/, formatted);
  return `${currency}/${size.size_unit}`;
}

export function GroceryCard({
  p,
  preferredBrand
}: {
  p: PostgresGroceryProduct;
  preferredBrand?: string | null;
}) {
  const { addToCart } = useCart();
  const [wished, setWished] = useState(false);
  const [variantIdx, setVariantIdx] = useState(() => findBrandVariantIndex(p.variants, preferredBrand));
  const [sizeIdx, setSizeIdx] = useState(0);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
  const [hoveredStoreIndex, setHoveredStoreIndex] = useState<number | null>(null);

  useEffect(() => {
    setVariantIdx(findBrandVariantIndex(p.variants, preferredBrand));
    setSizeIdx(0);
  }, [p.key, preferredBrand]);

  const currentVariant = p.variants[variantIdx] || p.variants[0];

  const sortedSizes = [...(currentVariant?.sizes || [])].sort((a, b) => {
    const getNorm = (s: GrocerySize) => {
      const u = s.size_unit.toLowerCase();
      if (['kg', 'kilo', 'l', 'liter', 'litre'].includes(u)) return s.size_value * 1000;
      if (u === 'dozen') return s.size_value * 12;
      return s.size_value;
    };
    return getNorm(a) - getNorm(b);
  });

  const currentSize = sortedSizes[sizeIdx] || sortedSizes[0];
  const dynamicStores = [...(currentSize?.stores || [])].sort((a, b) => a.price - b.price);

  useEffect(() => {
    setSelectedStoreIndex(0);
    setHoveredStoreIndex(null);
  }, [variantIdx, sizeIdx]);

  if (!currentVariant || !currentSize || dynamicStores.length === 0) return null;

  const activeStore = dynamicStores[selectedStoreIndex] || dynamicStores[0];
  const displayImage = activeStore.image_url || p.image_url;

  const handleAddToCart = () => {
    addToCart({
      id: `${p.key}-${currentVariant.variant_label}-${currentSize.sizeKey}-${activeStore.name}-${activeStore.price}`,
      productKey: p.key,
      sizeKey: currentSize.sizeKey,
      title: p.title,
      variantLabel: currentVariant.variant_label,
      sizeLabel: formatNormalizedUnit(currentSize.size_value, currentSize.size_unit),
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
            {sortedSizes.map((s, idx) => (
              <button key={s.sizeKey} type="button" className="variant" aria-pressed={idx === sizeIdx} onClick={() => setSizeIdx(idx)}>
                {formatNormalizedUnit(s.size_value, s.size_unit)}
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="info info--violet tip" tabIndex={0}>
              <b>{formatUnitPrice(activeStore.price, currentSize)}</b>
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
        <div
          className="gcard__stores"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 6,
            alignItems: 'stretch',
            overflow: 'visible'
          }}
        >
          {dynamicStores.map((s, i) => {
            const brand = getStoreBrand(s.name);
            const isSelected = selectedStoreIndex === i;
            const isHovered = hoveredStoreIndex === i;
            return (
              <div 
                key={s.url + i} 
                className={`store ${isSelected ? 'store--selected' : ''}`} 
                onClick={() => setSelectedStoreIndex(i)}
                onMouseEnter={() => setHoveredStoreIndex(i)}
                onMouseLeave={() => setHoveredStoreIndex(null)}
                style={{
                  position: 'relative',
                  minWidth: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                  overflow: 'visible',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--violet)' : '1px solid var(--divider)',
                  background: isSelected ? 'var(--violet-light)' : '#fff'
                }}
              >
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#1F1D1A',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 30,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {formatUnitPrice(s.price, currentSize)}
                  </div>
                )}
                <div className="row" style={{ gap: 4, justifyContent: 'center', flexWrap: 'nowrap', minWidth: 0 }}>
                  <span className="store__logo" style={{ background: brand.bg, flexShrink: 0 }}>{brand.logo}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: '#55504A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                </div>
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
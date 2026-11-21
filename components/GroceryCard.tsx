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
  if (n.includes('noon')) return { logo: 'n', bg: '#FEE000', color: '#1F1D1A' };
  if (n.includes('carrefour')) return { logo: 'c', bg: '#00387B', color: '#fff' };
  if (n.includes('razi')) return { logo: 'R', bg: '#1F7A5A', color: '#fff' };
  if (n.includes('barakat')) return { logo: 'B', bg: '#B4462E', color: '#fff' };
  if (n.includes('alnamoos')) return { logo: 'Al', bg: '#000000', color: '#fff' };
  if (n.includes('amazon')) return { logo: 'a', bg: '#232F3E', color: '#fff' };
  if (n.includes('talabat')) return { logo: 't', bg: '#FF5A00', color: '#fff' };
  if (n.includes('careem')) return { logo: 'C', bg: '#47A23F', color: '#fff' };
  return { logo: name[0].toUpperCase(), bg: 'var(--violet)', color: '#fff' };
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
  const storeCount = dynamicStores.length;
  const storeCols = Math.min(storeCount, 3);
  const isSingleStore = storeCount === 1;
  const isTwoStores = storeCount === 2;
  const isDense = storeCount > 3 || p.variants.length > 3 || sortedSizes.length > 4;
  const isLowestSelected = storeCount > 1 && selectedStoreIndex === 0;

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
    <article
      className="card card--hover gcard"
      style={{
        alignItems: isDense ? 'start' : 'center',
        overflow: 'visible'
      }}
    >
      <div className="gcard__product" style={{ alignItems: isDense ? 'flex-start' : 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'stretch' }}>
          <a
            href={activeStore.url || '#'}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '4px 8px',
              fontSize: 10.5,
              fontWeight: 600,
              lineHeight: 1.2,
              textDecoration: 'none',
              color: 'var(--violet)',
              background: '#F3F0FE',
              border: '1px solid rgba(94, 53, 177, 0.16)',
              borderRadius: 7,
              whiteSpace: 'nowrap',
              transition: 'background 0.15s ease'
            }}
          >
            <span>Go to product page</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
          <div className="gcard__img" style={{ width: '100%' }}>
            {displayImage ? (
              <img src={displayImage} alt={p.title} loading="lazy" />
            ) : (
              <span className="emoji" aria-hidden="true">🛒</span>
            )}
            <button type="button" className={'icon-btn gcard__heart' + (wished ? ' icon-btn--on' : '')} onClick={() => setWished(w => !w)}>
              <HeartIcon size={16} filled={wished} />
            </button>
          </div>
        </div>

        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 className="gcard__title" style={{ margin: 0 }}>{p.title}</h3>
            {p.variants.length === 1 && currentVariant.brand && currentVariant.brand.toLowerCase() !== 'generic' && currentVariant.brand.toLowerCase() !== 'unknown' && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--faint)', background: 'var(--canvas)', padding: '2px 8px', borderRadius: 999 }}>
                {currentVariant.variant_label}
              </span>
            )}
          </div>

          {p.variants.length > 1 && (
            <div className="row" style={{ gap: 6, marginTop: isDense ? 8 : 10, flexWrap: 'wrap' }}>
              {p.variants.map((v, idx) => (
                <button
                  key={`${v.brand}-${v.variant}-${v.form}`}
                  type="button"
                  className="chip chip--soft"
                  aria-pressed={idx === variantIdx}
                  onClick={() => { setVariantIdx(idx); setSizeIdx(0); }}
                  style={{ padding: isDense ? '3px 9px' : '4px 11px', fontSize: 12 }}
                >
                  {v.variant_label}
                </button>
              ))}
            </div>
          )}

          <div className="row" style={{ gap: 6, marginTop: p.variants.length > 1 ? 8 : 10, flexWrap: 'wrap' }}>
            {sortedSizes.map((s, idx) => (
              <button
                key={s.sizeKey}
                type="button"
                className="variant"
                aria-pressed={idx === sizeIdx}
                onClick={() => setSizeIdx(idx)}
                style={!isDense && sortedSizes.length <= 2 ? { padding: '6px 12px' } : undefined}
              >
                {formatNormalizedUnit(s.size_value, s.size_unit)}
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: isDense ? 10 : 12 }}>
            <div className="info info--violet tip" tabIndex={0}>
              <b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUnitPrice(activeStore.price, currentSize)}</b>
              <span>Unit price</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {inr(activeStore.price)}
          </div>
          {isLowestSelected && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: '#ECFDF5', padding: '2px 6px', borderRadius: 999, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Lowest
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          from <span style={{ color: '#55504A', fontWeight: 500 }}>{activeStore.name}</span>
        </div>
        {!activeStore.inStock && (
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--red, #E22028)' }}>Out of stock</div>
        )}
      </div>

      <div style={{ minWidth: 0, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--green)' }}>
            {storeCount > 1 ? `COMPARE ${storeCount} STORES` : 'AVAILABLE AT'}
          </span>
        </div>
        <div
          className="gcard__stores"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${storeCols}, minmax(0, 1fr))`,
            gap: isSingleStore ? 0 : isTwoStores ? 8 : 6,
            alignItems: 'stretch',
            overflow: 'visible',
            width: '100%'
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
                  borderRadius: 10,
                  padding: isSingleStore ? '12px 14px' : isTwoStores ? '10px 10px' : '8px 6px',
                  display: 'flex',
                  flexDirection: isSingleStore ? 'row' : 'column',
                  alignItems: 'center',
                  justifyContent: isSingleStore ? 'space-between' : 'center',
                  gap: isSingleStore ? 12 : 4,
                  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                  border: isSelected ? '2px solid var(--violet)' : '1px solid var(--divider)',
                  background: isSelected ? 'var(--violet-light)' : '#fff',
                  boxShadow: isHovered && !isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : undefined
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
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {formatUnitPrice(s.price, currentSize)}
                  </div>
                )}

                {isSingleStore ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <span
                        className="store__logo"
                        style={{
                          background: brand.bg,
                          color: brand.color,
                          flexShrink: 0,
                          width: 26,
                          height: 26,
                          fontSize: 12,
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        {brand.logo}
                      </span>
                      <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F1D1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.name}
                        </div>
                        {s.listing_title && (
                          <div style={{ fontSize: 11, color: 'var(--faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                            {s.listing_title}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className="store__price"
                      style={{
                        flexShrink: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        ...(!s.inStock ? { textDecoration: 'line-through', color: 'var(--faint)' } : {})
                      }}
                    >
                      {inr(s.price)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row" style={{ gap: 5, justifyContent: 'center', flexWrap: 'nowrap', minWidth: 0, width: '100%' }}>
                      <span
                        className="store__logo"
                        style={{ background: brand.bg, color: brand.color, flexShrink: 0 }}
                      >
                        {brand.logo}
                      </span>
                      <span
                        style={{
                          fontSize: isTwoStores ? 12 : 10.5,
                          fontWeight: 500,
                          color: '#55504A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {s.name}
                      </span>
                    </div>
                    <div
                      className="store__price"
                      style={{
                        fontSize: isTwoStores ? 14 : undefined,
                        fontVariantNumeric: 'tabular-nums',
                        ...(!s.inStock ? { textDecoration: 'line-through', color: 'var(--faint)' } : {})
                      }}
                    >
                      {inr(s.price)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: isDense ? 10 : 12, width: '100%' }}>
        <button
          onClick={handleAddToCart}
          className="btn btn--secondary"
          style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, background: '#F3F0FE', color: 'var(--violet)', borderRadius: 10 }}
        >
          Add to Cart
        </button>
        <a
          href={activeStore.url || '#'}
          target="_blank"
          rel="noreferrer"
          className="btn btn--primary"
          style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: 10 }}
        >
          Buy Now
        </a>
      </div>
    </article>
  );
}
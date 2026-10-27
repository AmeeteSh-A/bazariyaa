'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ComparisonMatrix } from '@/components/ComparisonMatrix';
import { FaqList } from '@/components/FaqList';
import { ProductCard } from '@/components/ProductCard';
import { CheckIcon, CompareIcon, HeartIcon, InfoIcon, PlayIcon, ThumbIcon } from '@/components/Icons';
import { useCompare } from '@/context/CompareContext';
import type { Product, ProductSpec, RetailerOffer, Review, Faq } from '@/types';
import { discountPct, money, sparkPoints } from '@/utils/format';

const FALLBACK_THUMBS = [['📱', 'Front view'], ['🔄', 'Back view'], ['📐', 'Side profile'], ['🤳', 'In hand'], ['🏡', 'Lifestyle']];
const TABS = ['Overview', 'Price', 'Specs', 'Reviews', 'Alternatives', 'FAQ'];

export default function ProductView({ 
  product: p,
  baseSpec,
  availableSpecs = [],
  offers = [],
  alternatives = [],
  specs = [],
  pros = [],
  cons = [],
  reviewsData = [],
  faqs = [],
  videos = [],
  currentColor = '',
  currentRam = '',
  currentStorage = '',
  currentSize = '',
  colorVariants = [],
  ramVariants = [],
  storageVariants = [],
  sizeVariants = []
}: { 
  product: Product & { images?: string[] }; 
  baseSpec?: ProductSpec;
  availableSpecs?: ProductSpec[];
  offers?: RetailerOffer[];
  alternatives?: Product[];
  specs?: [string, string][];
  pros?: string[];
  cons?: string[];
  reviewsData?: Review[];
  faqs?: Faq[];
  videos?: any[];
  currentColor?: string;
  currentRam?: string;
  currentStorage?: string;
  currentSize?: string;
  colorVariants?: { label: string; id: string }[];
  ramVariants?: { label: string; id: string }[];
  storageVariants?: { label: string; id: string }[];
  sizeVariants?: { label: string; id: string }[];
}) {
  const inr = (n: number) => money(n, p.currency);
  const cmp = useCompare();
  const compared = cmp.has(p.id);
  const [thumb, setThumb] = useState(0);
  const [wished, setWished] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'Verified' | 'Expert'>('all');
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > 640);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const price = p.price;
  const mrp = p.mrp > p.price ? p.mrp : p.price;
  const lowest = (offers[0] || { retailer: 'Store', price: p.price, delivery: 'Check store', url: '#' }) as RetailerOffer & { url?: string };
  const reviews = reviewFilter === 'all' ? reviewsData : reviewsData.filter(r => r.badge === reviewFilter);
  const realImages = p.images?.length ? p.images : (p.image ? [p.image] : []);
  const hasImages = realImages.length > 0;

  const validHistory = p.history.filter(h => h > 0);
  const minPrice = validHistory.length > 0 ? Math.min(...validHistory, price) : price;
  const avgPrice = validHistory.length > 0 ? Math.round(validHistory.reduce((a, b) => a + b, 0) / validHistory.length) : price;
  const priceVerdict = price <= minPrice ? 'Lowest ever — Great time to buy' : price > avgPrice ? 'Price is high — Consider waiting' : 'Average price — Good to buy';

  const hasVariants = !!(currentColor || colorVariants.length > 0 || currentRam || ramVariants.length > 0 || currentStorage || storageVariants.length > 0 || currentSize || sizeVariants.length > 0);

  return (
    <>
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/#trending">{p.category}</Link><span>/</span><span style={{ color: '#000', fontWeight: 500 }}>{p.name}</span></nav>

        <section className="pdp">
          <div>
            <div className="gallery__main" style={{ position: 'relative', background: 'var(--canvas)', borderRadius: 16, overflow: 'hidden', aspectRatio: '1/1', display: 'grid', placeItems: 'center' }}>
              {hasImages ? (
                <img src={realImages[thumb] || realImages[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 24 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span className="placeholder">{FALLBACK_THUMBS[thumb][0]}</span>
              )}
              <span className="badge" style={{ position: 'absolute', top: 16, left: 16 }}>✦ {p.category}</span>
              <div className="gallery__actions">
                <button type="button" className={'icon-btn' + (compared ? ' icon-btn--on' : '')} aria-pressed={compared} aria-label="Add to compare" onClick={() => cmp.toggle(p.id)}><CompareIcon size={17} /></button>
                <button type="button" className={'icon-btn' + (wished ? ' icon-btn--on' : '')} aria-pressed={wished} aria-label="Save to wishlist" onClick={() => setWished(w => !w)}><HeartIcon size={17} filled={wished} /></button>
              </div>
            </div>
            <div className="gallery__thumbs" role="group" aria-label="Product images">
              {hasImages ? (
                realImages.map((img, i) => (
                  <button key={i} type="button" className="gallery__thumb" aria-pressed={i === thumb} onClick={() => setThumb(i)} style={{ padding: 4, background: 'var(--canvas)', overflow: 'hidden' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </button>
                ))
              ) : (
                FALLBACK_THUMBS.map(([ic, label], i) => (
                  <button key={label} type="button" className="gallery__thumb placeholder" aria-pressed={i === thumb} aria-label={label} onClick={() => setThumb(i)}>{ic}</button>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{p.brand}</div>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.035em', margin: '4px 0 0' }}>{p.name}</h1>
            <div className="row" style={{ marginTop: 14 }}><strong>★ {p.rating}</strong><span className="muted" style={{ fontSize: 13 }}>{p.reviews} reviews</span><span className="badge">👍 {p.recommended}% Recommended</span></div>

            {hasVariants && (
              <div className="variants">
                {(currentColor || colorVariants.length > 0) && (
                  <>
                    <div className="variant-label">Colour</div>
                    <div className="row">
                      {currentColor && (
                        <span className="chip chip--soft" aria-pressed="true" style={{ textTransform: 'capitalize' }}>{currentColor}</span>
                      )}
                      {colorVariants.map(cv => (
                        <Link key={cv.id} href={`/product/${encodeURIComponent(cv.id)}`} className="chip" style={{ textTransform: 'capitalize', textDecoration: 'none' }}>
                          {cv.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                
                {(currentRam || ramVariants.length > 0) && (
                  <>
                    <div className="variant-label">RAM</div>
                    <div className="row" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                      {currentRam && (
                        <span className="storage" aria-pressed="true">
                          <b style={{ display: 'block', fontSize: 13.5, textTransform: 'uppercase' }}>{currentRam}</b>
                        </span>
                      )}
                      {ramVariants.map(rv => (
                        <Link key={rv.id} href={`/product/${encodeURIComponent(rv.id)}`} className="storage" style={{ textDecoration: 'none' }}>
                          <b style={{ display: 'block', fontSize: 13.5, textTransform: 'uppercase' }}>{rv.label}</b>
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {(currentStorage || storageVariants.length > 0) && (
                  <>
                    <div className="variant-label">Storage</div>
                    <div className="row" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                      {currentStorage && (
                        <span className="storage" aria-pressed="true">
                          <b style={{ display: 'block', fontSize: 13.5, textTransform: 'uppercase' }}>{currentStorage}</b>
                        </span>
                      )}
                      {storageVariants.map(sv => (
                        <Link key={sv.id} href={`/product/${encodeURIComponent(sv.id)}`} className="storage" style={{ textDecoration: 'none' }}>
                          <b style={{ display: 'block', fontSize: 13.5, textTransform: 'uppercase' }}>{sv.label}</b>
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {(currentSize || sizeVariants.length > 0) && (
                  <>
                    <div className="variant-label">Size / Volume</div>
                    <div className="row" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                      {currentSize && (
                        <span className="storage" aria-pressed="true">
                          <b style={{ display: 'block', fontSize: 13.5, textTransform: 'lowercase' }}>{currentSize}</b>
                        </span>
                      )}
                      {sizeVariants.map(sz => (
                        <Link key={sz.id} href={`/product/${encodeURIComponent(sz.id)}`} className="storage" style={{ textDecoration: 'none' }}>
                          <b style={{ display: 'block', fontSize: 13.5, textTransform: 'lowercase' }}>{sz.label}</b>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="card buybox">
              <div className="buybox__price">
                <strong>{inr(price)}</strong>
                {mrp > price && (
                  <>
                    <span className="buybox__mrp">{inr(mrp)}</span>
                    <span className="badge badge--green tip" tabIndex={0} style={{ marginBottom: 4, cursor: 'help' }}>{discountPct(price, mrp)}% OFF <InfoIcon size={12} /><span className="tip__pop" role="tooltip">You save {inr(mrp - price)} vs MRP</span></span>
                  </>
                )}
              </div>
              <div className="row muted" style={{ fontSize: 13, marginTop: 8 }}><CheckIcon size={15} color="var(--green)" />{price <= minPrice ? 'Lowest recorded price' : 'Available across stores'}</div>
              <div className="row" style={{ marginTop: 12 }}>
                <span className="faint" style={{ fontSize: 11 }}>Available at</span>
                {offers.map((o, i) => (
                  <span key={o.retailer} className={'retailer-chip tip' + (i === 0 ? ' retailer-chip--lowest' : '')} tabIndex={0}>
                    {o.retailer}<span className="tip__pop" role="tooltip">{inr(o.price)} · {i === 0 ? 'Lowest price' : 'In stock'} · {o.delivery}</span>
                  </span>
                ))}
              </div>
              <a href={lowest.url || '#'} target="_blank" rel="noreferrer" className="btn btn--primary btn--block" style={{ marginTop: 16, textDecoration: 'none' }}>
                Buy now — {inr(lowest.price)} <span style={{ fontSize: 12, fontWeight: 500, color: '#CFC4F7' }}>at {lowest.retailer}</span>
              </a>
              <button type="button" className="btn btn--secondary btn--block" style={{ marginTop: 10 }} aria-pressed={compared} onClick={() => cmp.toggle(p.id)}><CompareIcon size={16} />{compared ? '✓ Added to compare' : 'Add to compare'}</button>
            </div>
          </div>
        </section>
      </div>

      <div className="tabs"><div className="container scroll-x">{TABS.map(t => <a key={t} href={'#' + t.toLowerCase()} className="chip">{t}</a>)}</div></div>

      <div className="container">
        <section className="section--tight" id="overview">
          <div className="card card--pad" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.04em' }}>{p.recommended}%</div><div className="muted" style={{ fontSize: 12 }}>Recommended</div></div>
            <div><span className="badge">✦ AI Summary</span><p style={{ margin: '10px 0 0', lineHeight: 1.55 }}>Based on current pricing patterns and available verified specs, this {p.brand} product offers solid value in the {p.category} category. It maintains a strong {p.trust}% verified-review score. {price <= minPrice ? "Given it's currently at its lowest recorded price, it is a confident buy." : "Prices fluctuate, but it remains a strong contender."}</p><p className="faint" style={{ fontSize: 12, margin: '8px 0 0' }}>Based on {p.reviews} verified ratings</p></div>
          </div>
          {(pros.length > 0 || cons.length > 0) && (
            <div className="grid g2" style={{ marginTop: 16 }}>
              {pros.length > 0 && <div className="card card--pad"><b className="row" style={{ gap: 8 }}><CheckIcon size={16} color="var(--green)" />What's great</b><ul className="pros">{pros.map(x => <li key={x}><span style={{ color: 'var(--green)' }}>+</span>{x}</li>)}</ul></div>}
              {cons.length > 0 && <div className="card card--pad"><b>✕ Worth knowing</b><ul className="cons">{cons.map(x => <li key={x}><span className="muted">–</span>{x}</li>)}</ul></div>}
            </div>
          )}
        </section>

        <section className="section--tight" id="price">
          <div className="card card--pad">
            <h2 className="h3">Price history & prediction</h2><p className="sub">Recorded history across retailers</p>
            <svg width="100%" height="200" viewBox="0 0 700 200" preserveAspectRatio="none" style={{ marginTop: 16 }} aria-label="Price trend chart">
              <polyline points={sparkPoints(validHistory, 560, 200, 16)} fill="none" stroke="var(--violet)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="grid g4" style={{ marginTop: 16 }}>
              {[['Current', inr(price)], ['Lowest ever', inr(minPrice)], ['Average', inr(avgPrice)]].map(([l, v]) => <div key={l as string} className="card" style={{ padding: '14px 16px', borderRadius: 14 }}><div className="muted" style={{ fontSize: 12 }}>{l as string}</div><div style={{ fontSize: 18, fontWeight: 600 }}>{v as string}</div></div>)}
              <div className="card" style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--violet-soft)', borderColor: 'var(--violet-border)' }}><div style={{ fontSize: 12, color: 'var(--violet)', fontWeight: 500 }}>Bazariyaa verdict</div><div style={{ fontWeight: 600, fontSize: 14 }}>{priceVerdict}</div></div>
            </div>
          </div>
        </section>

        {offers.length > 0 && (
          <section className="section--tight">
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '24px 24px 16px' }}><h2 className="h3">Compare prices across retailers</h2></div>
              {offers.map((o: any, i) => (
                <div key={o.retailer} className="offer">
                  <div className="row"><b>{o.retailer}</b>{i === 0 && <span className="badge badge--green">LOWEST</span>}</div>
                  <span className="muted" style={{ fontSize: 13 }}>{o.delivery}</span>
                  <b>{inr(o.price)}</b>
                  <a href={o.url || '#'} target="_blank" rel="noreferrer" className={'btn btn--sm ' + (i === 0 ? 'btn--primary' : 'btn--secondary')} style={{ textDecoration: 'none' }}>
                    {i === 0 ? 'Buy now' : 'Visit'}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {specs.length > 0 && (
          <section className="section--tight" id="specs">
            <div className="card card--pad">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}><h2 className="h3">Specifications</h2><span className="badge badge--white">✦ AI-extracted</span></div>
              <dl className="specs" style={{ margin: 0 }}>{specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="section--tight" id="reviews">
            <div className="sec-head">
              <div><h2 className="h3">Community & expert reviews</h2><p className="sub">Only verified, genuine reviews count toward the rating</p></div>
              <div className="row">{(['all', 'Verified', 'Expert'] as const).map(f => <button key={f} type="button" className="chip" aria-pressed={f === reviewFilter} onClick={() => setReviewFilter(f)}>{f === 'all' ? 'All' : f === 'Verified' ? 'Verified buyers' : 'Experts'}</button>)}</div>
            </div>
            <div className="grid g2">
              {reviews.map(r => (
                <article key={r.name} className="card card--pad">
                  <div className="row" style={{ flexWrap: 'nowrap', marginBottom: 14 }}>
                    <span className="avatar" style={{ background: r.avatar, width: 42, height: 42 }}>{r.initials}</span>
                    <div style={{ flex: 1 }}><div className="row" style={{ gap: 6 }}><b>{r.name}</b><span className={'badge' + (r.badge === 'Verified' ? ' badge--green' : '')}>{r.badge}</span></div><div className="muted" style={{ fontSize: 12.5 }}>{r.meta}</div></div>
                    <span aria-label={r.stars + ' out of 5'}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                  </div>
                  <p style={{ margin: '0 0 14px', lineHeight: 1.55, color: 'var(--ink-2)' }}>{r.text}</p>
                  <div className="row muted" style={{ paddingTop: 14, borderTop: '1px solid var(--divider)', fontSize: 12.5 }}>
                    <span className="row" style={{ gap: 6 }}><ThumbIcon size={14} />{r.helpful} helpful</span>
                    {r.platform && <span style={{ color: 'var(--green)', fontWeight: 500 }}>✓ Verified purchase · {r.platform}</span>}
                    <span style={{ marginLeft: 'auto' }}>{r.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {alternatives.length > 0 && (
          <section className="section--tight" id="alternatives">
            <div className="sec-head"><div><h2 className="h3">Alternatives & frequently compared</h2><p className="sub">Shoppers who viewed this also considered these</p></div></div>
            <div className="grid g4">{alternatives.map(a => <ProductCard key={a.id} p={a} />)}</div>
          </section>
        )}

        <section className="section--tight" id="compare">
          <div className="sec-head"><div><div className="eyebrow">Signature tool</div><h2 className="h3" style={{ marginTop: 4 }}>Comparison Matrix</h2><p className="sub">Starts with this product — add up to three more to see the winner on every row</p></div></div>
          <ComparisonMatrix baseSpec={baseSpec} availableSpecs={availableSpecs} />
        </section>

        {videos.length > 0 && (
          <section className="section--tight">
            <div className="sec-head"><div><h2 className="h3">Popular video reviews</h2><p className="sub">Hand-picked from trusted creators · complements written reviews</p></div></div>
            <div className="grid g4">
              {videos.map(v => (
                <article key={v.title} className="card card--hover" style={{ overflow: 'hidden', borderRadius: 20 }}>
                  <div className="placeholder" style={{ aspectRatio: '16/9', position: 'relative' }}>
                    <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', color: 'var(--violet)' }}><PlayIcon /></span>
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.72)', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 6 }}>{v.duration}</span>
                  </div>
                  <div style={{ padding: 14 }}><div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>{v.title}</div><div className="muted" style={{ fontSize: 12, marginTop: 8 }}><b style={{ color: '#000', fontWeight: 500 }}>{v.creator}</b> · {v.views} views</div></div>
                </article>
              ))}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="section" id="faq" style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 className="h3" style={{ marginBottom: 20 }}>Frequently asked</h2>
            <FaqList items={faqs} />
          </section>
        )}
      </div>

      <div className="stickybar" data-show={showBar} aria-hidden={!showBar}>
        <div className="stickybar__in">
          <span style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', background: 'var(--canvas)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
            {hasImages ? (
              <img src={realImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              p.icon
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.brand} {p.name}</b><span className="muted" style={{ fontSize: 12 }}>👍 {p.recommended}% Recommended · lowest at {lowest.retailer}</span></div>
          <div style={{ textAlign: 'right' }}>
            <b style={{ fontSize: 18 }}>{inr(price)}</b>
            {mrp > price && <div className="muted" style={{ fontSize: 11 }}>{discountPct(price, mrp)}% off</div>}
          </div>
          <a href={lowest.url || '#'} target="_blank" rel="noreferrer" className="btn btn--primary" tabIndex={showBar ? 0 : -1} style={{ textDecoration: 'none' }}>
            Buy now
          </a>
        </div>
      </div>
    </>
  );
}
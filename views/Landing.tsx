'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { ProductCard } from '@/components/ProductCard';
import { FaqList } from '@/components/FaqList';
import { CheckIcon, ChevronRight, ThumbIcon } from '@/components/Icons';
import { LANDING_CATEGORIES, LANDING_FAQS, TESTIMONIALS, TICKERS } from '@/data/products';
import type { Category, Product } from '@/types';
import { money, sparkPoints } from '@/utils/format';

const FILTERS: Array<'All' | Category> = ['All', 'Mobiles', 'Audio', 'Laptops', 'Home', 'Wearables', 'Cameras'];
const MOVES = ['↑ 24%', '↑ 12%', 'NEW', '↑ 8%', '↓ 3%', '↑ 5%'];

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; 
    const t0 = performance.now();
    const tick = (t: number) => { 
      const p = Math.min(1, (t - t0) / ms); 
      setV(target * (1 - Math.pow(1 - p, 3))); 
      if (p < 1) raf = requestAnimationFrame(tick); 
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Stat({ target, decimals = 0, prefix = '', suffix = '', label }: { target: number; decimals?: number; prefix?: string; suffix?: string; label: string }) {
  const v = useCountUp(target);
  return (
    <div>
      <div className="v">{prefix}{decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN')}{suffix}</div>
      <div className="l">{label}</div>
    </div>
  );
}

export default function Landing({ liveProducts = [] }: { liveProducts?: Product[] }) {
  const PRODUCTS = liveProducts;
  const [filter, setFilter] = useState<'All' | Category>('All');
  const [tick, setTick] = useState(0);
  const [tIdx, setTIdx] = useState(0);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => { 
    const i = setInterval(() => setTick(t => (t + 1) % TICKERS.length), 3000); 
    return () => clearInterval(i); 
  }, []);
  
  const list = useMemo(() => (filter === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter)), [filter, PRODUCTS]);
  const t = TESTIMONIALS[tIdx];

  const dealsData = PRODUCTS.slice(0, 3).map((p, i) => ({
    p,
    win: ['3 months', '6 months', '30 days'][i] || '30 days',
    verdict: ['Great price', 'Lowest ever', 'Wait — rising'][i] || 'Good time to buy',
    good: i !== 2,
    rets: [['Amazon AE', 'Sharaf DG', 'Noon'], ['Sharaf DG', 'Amazon AE', 'Carrefour'], ['Noon', 'Amazon AE', 'Carrefour']][i] || ['Amazon AE']
  }));

  return (
    <>
      <div className="container" id="top">
        <section className="hero">
          <div className="hero__copy">
            <span className="badge">● Live across UAE & India</span>
            <h1 className="h1" style={{ marginTop: 24 }}>Know what's<br />worth buying<span style={{ color: 'var(--violet)' }}>.</span></h1>
            <p className="lead">The honest product-discovery platform. Real reviews, live price history and a score you can trust — before you spend a dime.</p>
            <div className="hero__search"><SearchBar /></div>
            <div className="row" style={{ marginTop: 24, fontSize: 13 }}>
              <span className="muted" style={{ fontWeight: 500 }}>Trending:</span>
              {['Laptops under 3000 AED', 'Best air fryer', 'Noise-cancelling buds', 'Sunflower oil'].map(q => <span key={q} className="chip">{q}</span>)}
            </div>
          </div>
          <div>
            <div className="card feed">
              <div className="feed__head">
                <div><div className="faint" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Trending right now</div><div className="h3" style={{ marginTop: 4 }}>What people are buying</div></div>
                <span className="live">LIVE</span>
              </div>
              
              {PRODUCTS.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--slate-text)' }}>
                  Loading live trends...
                </div>
              )}

              {PRODUCTS.slice(0, 6).map((p, i) => (
                <Link key={p.id} href={'/product/' + p.slug} className="feed__row">
                  <span className="feed__rank">{i + 1}</span>
                  <span className="feed__thumb" style={{ background: 'var(--canvas)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : p.icon}
</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.brand} {p.name}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{p.category} · <b style={{ color: '#000', fontWeight: 500 }}>{money(p.price, p.currency)}</b></span>
                  </span>
                  <span className={'badge' + (MOVES[i] === 'NEW' ? '' : ' badge--white')}>{MOVES[i] || 'LIVE'}</span>
                </Link>
              ))}
              <div className="feed__ticker" aria-live="polite"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)' }} />{TICKERS[tick]}</div>
            </div>
            <div className="trustline">
              {['No paid rankings', 'Verified reviews', 'Updated hourly'].map(x => <span key={x} className="row" style={{ gap: 6 }}><CheckIcon size={15} color="var(--violet)" />{x}</span>)}
            </div>
          </div>
        </section>
      </div>

      <section className="section" id="categories">
        <div className="container">
          <div className="sec-head"><h2 className="h3">Popular categories <ChevronRight size={16} style={{ verticalAlign: -2 }} /></h2></div>
          <div className="grid g4">
            {LANDING_CATEGORIES.map(c => (
              <Link key={c.name} href={c.key === 'grocery' ? '/grocery' : '/#trending'} onClick={() => c.key !== 'grocery' && setFilter(c.key === 'All' ? 'All' : (c.key as Category))} className="cat-card card--hover">
                <div className="cat-card__ic">{c.icon}</div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{c.count} products</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="trending">
        <div className="container">
          <div className="eyebrow">Reviewed & ranked</div>
          <h2 className="h2">Top-reviewed products</h2>
          <div className="scroll-x" style={{ margin: '24px 0' }} role="group" aria-label="Filter by category">
            {FILTERS.map(f => <button key={f} type="button" className="chip" aria-pressed={f === filter} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
          
          {list.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--slate-text)' }}>
              No products found for this category yet.
            </div>
          ) : (
            <div className="grid g4">{list.map(p => <ProductCard key={p.id} p={p} />)}</div>
          )}
        </div>
      </section>

      <section className="section" id="trust">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 40px' }}>
            <div className="eyebrow">Why trust us</div>
            <h2 className="h2">Three scores. Zero guesswork.</h2>
            <p className="lead" style={{ marginTop: 16, fontSize: 17 }}>Every product is graded by the same transparent system — never by who pays us.</p>
          </div>
          <div className="grid g3">
            {[['🛡️', '94', 'Review Trust Score', 'Share of reviews from genuine, verified buyers — fake and coordinated reviews filtered out.', 94], ['💎', '8.8', 'Value for Money', 'How much you get per unit versus every comparable product, updated as prices move.', 88], ['👍', '96%', 'Recommended', 'One honest number combining trust, value, price fairness and reliability.', 96]].map(([ic, n, ti, body, bar]) => (
              <div key={ti as string} className="card card--pad score-card">
                <div className="row" style={{ justifyContent: 'space-between' }}><div className="cat-card__ic" style={{ margin: 0 }}>{ic}</div><div className="num">{n}</div></div>
                <h3 className="h3" style={{ fontSize: 18, margin: '16px 0 8px' }}>{ti}</h3>
                <p className="muted" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{body}</p>
                <div className="bar"><span style={{ width: bar as number + '%' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {dealsData.length > 0 && (
        <section className="section" id="deals">
          <div className="container">
            <div className="sec-head"><div><div className="eyebrow">Price intelligence</div><h2 className="h2">Best time to buy</h2></div><p className="muted" style={{ maxWidth: 340, margin: 0, fontSize: 14 }}>We track every price change so you never overpay at the wrong moment.</p></div>
            <div className="grid g3">
              {dealsData.map(({ p, win, verdict, good, rets }) => (
                <div key={p.id} className="card card--pad" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="row"><span className="feed__thumb" style={{ background: 'var(--canvas)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : p.icon}
</span><div><div style={{ fontWeight: 600 }}>{p.brand} {p.name}</div><div className="muted" style={{ fontSize: 12.5 }}>{p.category}</div></div></div>
                  <svg width="100%" height="70" viewBox="0 0 260 70" preserveAspectRatio="none" style={{ margin: '24px 0 8px' }} aria-hidden="true"><polyline points={sparkPoints(p.history, 260, 70, 8)} fill="none" stroke="#787574" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
                    <div><div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.035em' }}>{money(p.price, p.currency)}</div><div className="muted" style={{ fontSize: 12.5 }}>lowest in {win}</div></div>
                    <span className={'badge' + (good ? '' : ' badge--white')}>{verdict}</span>
                  </div>
                  <Link href={'/product/' + p.slug} className={'btn btn--block ' + (good ? 'btn--primary' : 'btn--secondary')}>{good ? 'Buy now' : 'Set price alert'}</Link>
                  <div className="row" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--divider)' }}>
                    <span className="faint" style={{ fontSize: 11 }}>Available at</span>
                    {rets.map(r => <span key={r} className="retailer-chip">{r}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" id="community">
        <div className="container">
          <div className="sec-head">
            <div><div className="eyebrow">Trusted by shoppers</div><h2 className="h2">A community that buys with confidence</h2></div>
            <div className="row" style={{ gap: 32 }}>{[['4.8 / 5', 'Average rating'], ['2.1M', 'Verified reviews'], ['98%', 'Would buy again']].map(([v, l]) => <div key={l}><div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.035em' }}>{v}</div><div className="muted" style={{ fontSize: 12.5 }}>{l}</div></div>)}</div>
          </div>
          <div className="card spotlight" aria-live="polite">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="badge" style={{ alignSelf: 'flex-start' }}><CheckIcon size={13} /> Verified Buyer · {t.platform}</span>
              <p className="spotlight__quote">“{t.text}”</p>
              <div className="row" style={{ marginTop: 'auto', flexWrap: 'nowrap' }}>
                <span className="avatar" style={{ background: t.avatar }}>{t.initials}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{t.name}</div><div className="muted" style={{ fontSize: 13 }}>{t.meta} · {t.date}</div></div>
                <div className="row">
                  <button type="button" className="icon-btn" aria-label="Previous review" onClick={() => setTIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}>‹</button>
                  <button type="button" className="icon-btn" aria-label="Next review" onClick={() => setTIdx(i => (i + 1) % TESTIMONIALS.length)}>›</button>
                </div>
              </div>
              <div className="row muted" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--divider)', fontSize: 13 }}><ThumbIcon size={15} /><b style={{ color: '#000' }}>{t.helpful}</b> found this helpful<span style={{ marginLeft: 'auto' }}>{tIdx + 1} / {TESTIMONIALS.length}</span></div>
            </div>
            <div className="card" style={{ padding: 8 }}>
              <div className="placeholder" style={{ aspectRatio: '4/3', borderRadius: 16 }}>{t.product?.toUpperCase()} — PHOTO</div>
              <div style={{ padding: '14px 10px 6px' }}><div className="muted" style={{ fontSize: 12 }}>Purchased & reviewed</div><div style={{ fontWeight: 600, marginTop: 4 }}>{t.product}</div><div className="faint" style={{ fontSize: 12, marginTop: 4 }}>bought via {t.platform}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section--tight"><div className="container"><div className="stats">
        <Stat target={2.4} decimals={1} suffix="M" label="Products tracked" />
        <Stat target={8.9} decimals={1} suffix="M" label="Verified reviews" />
        <Stat target={40} suffix="M" label="Price points daily" />
        <Stat target={420} prefix="AED " label="Avg. saved per buyer" />
      </div></div></section>

      <section className="section"><div className="container" style={{ maxWidth: 900 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}><div className="eyebrow">Good to know</div><h2 className="h2">Questions, answered</h2></div>
        <FaqList items={LANDING_FAQS} />
      </div></section>

      <section className="section--tight"><div className="container">
        <div className="newsletter">
          <div><h2 className="h2" style={{ color: '#fff', margin: 0 }}>Buy smarter, every single time.</h2><p style={{ color: 'var(--slate-text)', fontSize: 17, lineHeight: 1.45, marginTop: 16 }}>Weekly price drops, honest verdicts and early access to the AI Buying Assistant.</p></div>
          <div>
            <form onSubmit={e => { e.preventDefault(); if (email.includes('@')) setSubscribed(true); }}>
              <label className="visually-hidden" htmlFor="nl">Email address</label>
              <input id="nl" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <button className="btn btn--primary" type="submit">{subscribed ? '✓ Subscribed' : 'Notify me'}</button>
            </form>
            <div style={{ fontSize: 12.5, color: '#9A938E', marginTop: 12 }}>{subscribed ? 'You’re in! Watch your inbox.' : 'No spam. Unsubscribe anytime.'}</div>
          </div>
        </div>
      </div></section>
    </>
  );
}
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { GroceryCard } from '@/components/GroceryCard';
import { Modal } from '@/components/Modal';
import { SearchBar } from '@/components/SearchBar';
import { CheckIcon, ChevronRight, ClipIcon, ImageIcon, ListIcon, MicIcon, PinIcon, UploadIcon } from '@/components/Icons';
import { GROCERY_CATEGORIES, GROCERY_PRODUCTS, GROCERY_STORES, SAMPLE_LIST } from '@/data/grocery';
import { inr, unitPrice } from '@/utils/format';

type Sort = 'value' | 'price' | 'unit' | 'rating' | 'discount';

interface ListItem { name: string; qty: string; base: number; }

const MATCH = [
  { key: 'milk', name: 'Amul Taaza Toned Milk', base: 136, qty: '2 L' },
  { key: 'rice', name: 'India Gate Basmati Rice', base: 545, qty: '5 kg' },
  { key: 'sunflower', name: 'Fortune Sunflower Oil Jar', base: 685, qty: '5 L' },
  { key: 'butter', name: 'Amul Butter', base: 275, qty: '500 g' },
  { key: 'egg', name: 'Farm Made Brown Eggs', base: 84, qty: '12 pc' },
  { key: 'atta', name: 'Aashirvaad Whole Wheat Atta', base: 265, qty: '5 kg' },
  { key: 'parle', name: 'Parle-G Biscuits', base: 85, qty: '800 g' },
];

function parseList(text: string): ListItem[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const m = MATCH.find(x => line.toLowerCase().includes(x.key));
    return m ? { name: m.name, qty: m.qty, base: m.base } : { name: line.charAt(0).toUpperCase() + line.slice(1), qty: '1', base: 90 };
  });
}

export default function GrocerySearch() {
  const { category } = useParams<{ category?: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const nav = (to: string) => router.push(to);
  const activeCat = GROCERY_CATEGORIES.find(c => c.id === category) ?? GROCERY_CATEGORIES.find(c => c.id === 'oils')!;
  const [sub, setSub] = useState('All');
  const [sort, setSort] = useState<Sort>('value');
  const [modal, setModal] = useState<'type' | 'image' | null>(params.get('list') ? 'type' : null);
  const [text, setText] = useState('');
  const [list, setList] = useState<ListItem[] | null>(null);
  const subsRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const q = (params.get('q') ?? '').toLowerCase();

  useEffect(() => { setSub('All'); subsRef.current?.scrollTo({ left: 0 }); }, [activeCat.id]);

  const products = useMemo(() => {
    let l = GROCERY_PRODUCTS.filter(p => (q ? (p.brand + ' ' + p.name + ' ' + p.sub).toLowerCase().includes(q) : p.cat === activeCat.id && (sub === 'All' || p.sub === sub)));
    const unit = (x: typeof l[number]) => unitPrice(x.price, x.size, x.unit).value;
    l = [...l].sort((a, b) => {
      switch (sort) {
        case 'price': return a.price - b.price;
        case 'rating': return b.rating - a.rating;
        case 'discount': return (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp;
        case 'unit': return unit(a) - unit(b);
        default: return Number(!!b.bestValue) - Number(!!a.bestValue) || unit(a) - unit(b);
      }
    });
    return l;
  }, [activeCat.id, sub, sort, q]);

  const basket = useMemo(() => {
    if (!list?.length) return null;
    const totals = GROCERY_STORES.map(s => ({ ...s, total: Math.round(list.reduce((a, x, i) => a + x.base * (s.basket + ((i % 3) - 1) * 0.004), 0)) })).sort((a, b) => a.total - b.total);
    return { totals, est: list.reduce((a, x) => a + x.base, 0), saving: totals[totals.length - 1].total - totals[0].total };
  }, [list]);

  const submitList = (t: string) => { setList(parseList(t || SAMPLE_LIST)); setModal(null); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50); };
  const setCategory = (id: string) => nav('/grocery/' + id);

  return (
    <div className="container container--wide">
      <section className="gs-hero">
        <div>
          <span className="deliver"><PinIcon size={15} color="var(--violet)" /><span className="muted">Deliver to</span><b>HSR Layout, Bengaluru 560102</b><a href="#">Change</a></span>
          <div className="eyebrow" style={{ marginTop: 32 }}>Grocery price comparison</div>
          <h1 className="h1" style={{ fontSize: 'clamp(30px, 4vw, 40px)', marginTop: 10 }}>Find the best grocery prices without checking every store.</h1>
          <p className="lead" style={{ marginTop: 14, fontSize: 17 }}>Search an item, or drop your entire list — we compare it across Blinkit, Zepto, Instamart and more.</p>
          <div style={{ marginTop: 28, maxWidth: 760 }}><SearchBar placeholder="Search groceries, brands or products…" scope="grocery" submitLabel="Search" /></div>
          <div className="row" style={{ marginTop: 16, fontSize: 13.5 }}>
            <span className="muted" style={{ fontWeight: 500 }}>Have a grocery list?</span>
            <button type="button" className="chip" onClick={() => setModal('type')}><ListIcon size={15} color="var(--violet)" />Type list</button>
            <button type="button" className="chip" onClick={() => setModal('image')}><ImageIcon size={15} color="var(--violet)" />Upload image</button>
            <button type="button" className="chip" onClick={() => setModal('type')}><ClipIcon size={15} color="var(--violet)" />Paste list</button>
            <button type="button" className="chip chip--dashed" onClick={() => { setText(SAMPLE_LIST); setModal('type'); }}><MicIcon size={15} color="var(--violet)" />Speak</button>
          </div>
        </div>
        <div className="gs-hero__banner"><img src="/assets/grocery/hero-banner.png" alt="Happy shopper next to Bazariyaa review badges" /></div>
      </section>

      <div className="gs-layout">
        <aside className="gs-side" aria-label="Grocery categories">
          <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', padding: '0 12px 10px' }}>Grocery</div>
          {GROCERY_CATEGORIES.map(c => (
            <button key={c.id} type="button" className="gs-cat" aria-current={c.id === activeCat.id} onClick={() => setCategory(c.id)}>
              <span className="gs-cat__ic">{c.icon}</span>{c.name}<span className="gs-cat__n">{c.count}</span>
            </button>
          ))}
        </aside>

        <div style={{ minWidth: 0 }} ref={resultsRef}>
          {list && basket && (
            <section className="card basket" aria-live="polite">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><span className="badge"><CheckIcon size={13} />List detected</span><h2 className="h3" style={{ fontSize: 24, marginTop: 12 }}>Your grocery list</h2><div className="muted" style={{ fontSize: 13.5 }}>{list.length} items · estimated total {inr(basket.est)}</div></div>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setList(null)}>Clear</button>
              </div>
              <div className="basket__items">{list.map((it, i) => <div key={i} className="basket__item"><CheckIcon size={16} color="var(--green)" /><span style={{ flex: 1 }}>{it.name}</span><span className="muted">{it.qty}</span></div>)}</div>
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--divider)' }}>
                <div className="faint" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', marginBottom: 14 }}>Best store to buy the whole list</div>
                <div className="basket__stores">
                  {basket.totals.map((s, i) => (
                    <div key={s.name} className={'basket__store' + (i === 0 ? ' basket__store--best' : '')}>
                      <div className="row"><span className="store__logo" style={{ background: s.bg, width: 24, height: 24, fontSize: 11 }}>{s.logo}</span><b style={{ fontSize: 13 }}>{s.name}</b></div>
                      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>{inr(s.total)}</div>
                      <div style={{ fontSize: 11.5, marginTop: 6 }} className={i === 0 ? '' : 'faint'}>{i === 0 ? '★ Cheapest' : '+' + inr(s.total - basket.totals[0].total)}</div>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
                  <span className="muted">Buying everything at <b style={{ color: '#000' }}>{basket.totals[0].name}</b> saves you <b style={{ color: 'var(--green)' }}>{inr(basket.saving)}</b>.</span>
                  <button type="button" className="btn btn--primary">Shop at {basket.totals[0].name} →</button>
                </div>
              </div>
            </section>
          )}

          <div className="scroll-x gs-mobile-cats" role="group" aria-label="Category">
            {GROCERY_CATEGORIES.map(c => <button key={c.id} type="button" className="chip chip--soft" aria-pressed={c.id === activeCat.id} onClick={() => setCategory(c.id)}>{c.icon} {c.name}</button>)}
          </div>

          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div className="scroll-x" ref={subsRef} style={{ paddingRight: 44 }} role="group" aria-label="Subcategory">
              {['All', ...activeCat.subs].map(s => <button key={s} type="button" className="chip" aria-pressed={s === sub} onClick={() => setSub(s)}>{s}</button>)}
            </div>
            <button type="button" className="icon-btn" aria-label="Scroll subcategories" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34 }} onClick={() => subsRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><ChevronRight size={16} /></button>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
            <div><h2 className="h3" style={{ fontSize: 22 }}>{q ? 'Results for “' + q + '”' : activeCat.name}<span className="faint"> · {sub}</span></h2><div className="muted" style={{ fontSize: 13 }}>Showing {products.length} products · prices compared across retailers</div></div>
            <label className="row" style={{ fontSize: 13 }}><span className="muted">Sort</span>
              <select className="chip" value={sort} onChange={e => setSort(e.target.value as Sort)}>
                <option value="value">Best value</option><option value="price">Lowest price</option><option value="unit">Lowest unit price</option><option value="rating">Best rated</option><option value="discount">Biggest discount</option>
              </select>
            </label>
          </div>

          {products.length ? (
            <div style={{ display: 'grid', gap: 12 }}>{products.map(p => <GroceryCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🧺</div><b style={{ display: 'block', marginTop: 12 }}>No products here yet</b><span className="muted" style={{ fontSize: 13.5 }}>Try another subcategory or search for a specific item.</span></div>
          )}
        </div>
      </div>

      {modal === 'type' && (
        <Modal title="Type or paste your grocery list" subtitle="One item per line — quantities optional." onClose={() => setModal(null)}>
          <label className="visually-hidden" htmlFor="glist">Grocery list</label>
          <textarea id="glist" value={text} onChange={e => setText(e.target.value)} placeholder={SAMPLE_LIST} />
          <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
            <button type="button" className="chip chip--soft" aria-pressed="true" onClick={() => setText(SAMPLE_LIST)}>Use a sample list</button>
            <button type="button" className="btn btn--primary" onClick={() => submitList(text)}>Find best prices →</button>
          </div>
        </Modal>
      )}
      {modal === 'image' && (
        <Modal title="Upload a grocery list" subtitle="A photo, screenshot or handwritten list — we'll read the items." onClose={() => setModal(null)}>
          <label className="dropzone">
            <input type="file" accept="image/*" className="visually-hidden" onChange={() => submitList(SAMPLE_LIST)} />
            <span className="icon-btn icon-btn--on" style={{ width: 52, height: 52 }}><UploadIcon /></span>
            <b>Drag & drop, or click to upload</b><span className="faint" style={{ fontSize: 12.5 }}>PNG, JPG or a WhatsApp screenshot</span>
          </label>
        </Modal>
      )}
    </div>
  );
}

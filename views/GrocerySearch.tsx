'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { GroceryCard } from '@/components/GroceryCard';
import { Modal } from '@/components/Modal';
import { CheckIcon, ChevronRight, ClipIcon, ImageIcon, ListIcon, PinIcon, UploadIcon } from '@/components/Icons';
import type { GroceryCategory } from '@/types';
import { inr } from '@/utils/format';

import { useCart } from '@/components/Cart';

type Sort = 'price' | 'unit' | 'discount';
interface ListItem { name: string; qty: string; base: number; }

const SAMPLE_LIST = '2L milk\n5kg basmati rice\nFortune sunflower oil 5L\nAmul butter\n1 dozen eggs\nAashirvaad atta 5kg\nParle-G biscuits';

const STORES = [
  { name: 'Blinkit', logo: 'b', bg: '#E4A800', basket: 0.945 },
  { name: 'Zepto', logo: 'Z', bg: '#5433EB', basket: 0.97 },
  { name: 'Amazon', logo: 'a', bg: '#232F3E', basket: 1.008 },
  { name: 'BigBasket', logo: 'bb', bg: '#84C225', basket: 0.99 },
];

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

function CartButton() {
  const { setCartOpen, totalItems } = useCart();
  
  return (
    <button 
      onClick={() => setCartOpen(true)}
      style={{ 
        position: 'relative', background: '#fff', border: '1px solid var(--divider)', 
        borderRadius: 24, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, 
        cursor: 'pointer', fontWeight: 600, fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
      }}
    >
      🛒 Cart
      {totalItems > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: 'white',
          fontSize: 11, fontWeight: 800, width: 20, height: 20, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
        }}>
          {totalItems}
        </span>
      )}
    </button>
  );
}

export default function GrocerySearch({
  categories,
  searchResults
}: {
  categories: GroceryCategory[];
  searchResults?: { interpreted: any; sections: any[]; facets: any };
}) {
  const pathParams = useParams<{ category?: string }>();
  const params = useSearchParams();
  const router = useRouter();
  
  const activeCatId = params.get('category') || pathParams.category;
  const activeCat = categories.find(c => c.id === activeCatId) ?? categories[0];
  const q = (params.get('q') ?? '').toLowerCase();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeForm, setActiveForm] = useState('All');
  const [sort, setSort] = useState<Sort>('price');
  const [modal, setModal] = useState<'type' | 'image' | null>(null);
  const [text, setText] = useState('');
  const [list, setList] = useState<ListItem[] | null>(null);

  const subsRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(params.get('q') || '');
    setActiveBrand(params.get('brand') || 'All');
    setActiveForm(params.get('form') || 'All');
    setSort((params.get('sort') as Sort) || 'price');
    setModal(params.get('list') ? 'type' : null);
  }, [params]);

  const sections = searchResults?.sections || [];
  const facets = searchResults?.facets || {};
  const brands = facets.brand || [];
  const forms = facets.form || [];

  useEffect(() => { 
    if (q) {
      setActiveBrand('All'); 
      subsRef.current?.scrollTo({ left: 0 }); 
    }
  }, [activeCat?.id, q]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'All') p.set(k, v);
      else p.delete(k);
    });
    router.push(`/grocery?${p.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchQuery.trim(), brand: null, form: null });
  };

  const products = useMemo(() => {
    let l = [...sections];

    if (activeBrand !== 'All') {
      l = l.filter(s => s.title.toLowerCase().includes(activeBrand.toLowerCase()));
    }
    
    if (activeForm !== 'All') {
      l = l.filter(s => s.variants?.some((v: any) => v.form.toLowerCase() === activeForm.toLowerCase()));
    }

    return l.sort((a, b) => {
      const aBest = a.variants?.[0]?.sizes?.[0]?.stores?.[0]?.price || 0;
      const bBest = b.variants?.[0]?.sizes?.[0]?.stores?.[0]?.price || 0;
      
      switch (sort) {
        case 'price': return aBest - bBest;
        case 'unit': return (a.variants?.[0]?.sizes?.[0]?.from_unit_price || 0) - (b.variants?.[0]?.sizes?.[0]?.from_unit_price || 0);
        default: return aBest - bBest;
      }
    });
  }, [sections, activeBrand, activeForm, sort]);

  const basket = useMemo(() => {
    if (!list?.length) return null;
    const totals = STORES.map(s => ({ 
      ...s, 
      total: Math.round(list.reduce((a, x, i) => a + x.base * (s.basket + ((i % 3) - 1) * 0.004), 0)) 
    })).sort((a, b) => a.total - b.total);
    return { totals, est: list.reduce((a, x) => a + x.base, 0), saving: totals[totals.length - 1].total - totals[0].total };
  }, [list]);

  const submitList = (t: string) => { 
    setList(parseList(t || SAMPLE_LIST)); 
    setModal(null); 
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50); 
  };

  return (
    <div className="container container--wide">
      <section className="gs-hero">
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="deliver"><PinIcon size={15} color="var(--violet)" /><span className="muted">Deliver to</span><b>HSR Layout, Bengaluru 560102</b><a href="#">Change</a></span>
            
            <CartButton />
          </div>

          <div className="eyebrow" style={{ marginTop: 32 }}>Grocery price comparison</div>
          <h1 className="h1" style={{ fontSize: 'clamp(30px, 4vw, 40px)', marginTop: 10 }}>Find the best grocery prices without checking every store.</h1>
          <p className="lead" style={{ marginTop: 14, fontSize: 17 }}>Search an item, or drop your entire list — we compare it across multiple UAE retailers.</p>
          
          <div style={{ marginTop: 28, maxWidth: 760 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                type="search"
                placeholder="Search groceries, brands or products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1px solid var(--divider)', fontSize: 16 }}
              />
              <button type="submit" className="btn btn--primary" style={{ borderRadius: 12, padding: '0 24px' }}>
                Search
              </button>
            </form>
          </div>
          
          <div className="row" style={{ marginTop: 16, fontSize: 13.5 }}>
            <span className="muted" style={{ fontWeight: 500 }}>Have a grocery list?</span>
            <button type="button" className="chip" onClick={() => setModal('type')}><ListIcon size={15} color="var(--violet)" />Type list</button>
            <button type="button" className="chip" onClick={() => setModal('image')}><ImageIcon size={15} color="var(--violet)" />Upload image</button>
            <button type="button" className="chip" onClick={() => setModal('type')}><ClipIcon size={15} color="var(--violet)" />Paste list</button>
          </div>
        </div>
        <div className="gs-hero__banner"><img src="/assets/grocery/hero-banner.png" alt="Happy shopper next to Bazariyaa review badges" /></div>
      </section>

      <div className="gs-layout">
        <aside className="gs-side" aria-label="Grocery categories">
          <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', padding: '0 12px 10px' }}>Grocery</div>
          {categories.map(c => (
            <button key={c.id} type="button" className="gs-cat" aria-current={c.id === activeCat?.id} onClick={() => updateUrl({ category: c.id, q: null })}>
              <span className="gs-cat__ic">{c.icon}</span>{c.name}<span className="gs-cat__n">{c.count}</span>
            </button>
          ))}
          
          {forms.length > 0 && (
            <>
              <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', padding: '24px 12px 10px' }}>Form</div>
              <button type="button" className="gs-cat" aria-current={activeForm === 'All'} onClick={() => { setActiveForm('All'); updateUrl({ form: 'All' }); }}>
                <span className="gs-cat__ic">🍽️</span>All Forms
              </button>
              {forms.map((f: any) => (
                <button key={f.value} type="button" className="gs-cat" aria-current={activeForm === f.value} onClick={() => { setActiveForm(f.value); updateUrl({ form: f.value }); }}>
                  <span className="gs-cat__ic">📦</span>{f.value} <span className="gs-cat__n">{f.count}</span>
                </button>
              ))}
            </>
          )}
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
              </div>
            </section>
          )}

          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div className="scroll-x" ref={subsRef} style={{ paddingRight: 44 }} role="group" aria-label="Brands">
              <button type="button" className="chip" aria-pressed={activeBrand === 'All'} onClick={() => { setActiveBrand('All'); updateUrl({ brand: 'All' }); }}>All Brands</button>
              {brands.map((b: any) => (
                <button key={b.value} type="button" className="chip" aria-pressed={b.value === activeBrand} onClick={() => { setActiveBrand(b.value); updateUrl({ brand: b.value }); }}>
                  {b.value} ({b.count})
                </button>
              ))}
            </div>
            <button type="button" className="icon-btn" aria-label="Scroll brands" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34 }} onClick={() => subsRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><ChevronRight size={16} /></button>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 className="h3" style={{ fontSize: 22 }}>
                {searchResults?.interpreted?.query ? `Results for “${searchResults.interpreted.query}”` : activeCat?.name}
                <span className="faint"> · {activeBrand}</span>
              </h2>
              <div className="muted" style={{ fontSize: 13 }}>Showing {products.length} products · prices compared across retailers</div>
            </div>
            <label className="row" style={{ fontSize: 13 }}><span className="muted">Sort</span>
              <select className="chip" value={sort} onChange={e => { setSort(e.target.value as Sort); updateUrl({ sort: e.target.value }); }}>
                <option value="price">Lowest price</option>
                <option value="unit">Lowest unit price</option>
              </select>
            </label>
          </div>

          {products.length ? (
            <div style={{ display: 'grid', gap: 12 }}>{products.map((p: any) => <GroceryCard key={p.key} p={p} />)}</div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}><div style={{ fontSize: 40 }}>🧺</div><b style={{ display: 'block', marginTop: 12 }}>No products here yet</b><span className="muted" style={{ fontSize: 13.5 }}>Try another brand or search for a specific item.</span></div>
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
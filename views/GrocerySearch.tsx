'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { GroceryCard } from '@/components/GroceryCard';
import { Modal } from '@/components/Modal';
import { ChevronRight, ClipIcon, ImageIcon, ListIcon, PinIcon, UploadIcon, CheckIcon } from '@/components/Icons';
import type { GroceryCategory } from '@/types';
import { useCart } from '@/components/Cart';
import { processSmartList } from '../actions';

type Sort = 'price' | 'unit' | 'discount';

const SAMPLE_LIST = 'coconut 100g\napple 300g\nwatermelon 2kg\ncoriander 100g\n1 dozen eggs\nAmul butter 500g';

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
  
  const { addToCart, setCartOpen } = useCart();

  const activeCatId = params.get('category') || pathParams.category;
  const activeCat = categories.find(c => c.id === activeCatId) ?? categories[0];
  const q = (params.get('q') ?? '').toLowerCase();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeForm, setActiveForm] = useState('All');
  const [sort, setSort] = useState<Sort>('price');
  
  const [modal, setModal] = useState<'type' | 'image' | 'location' | 'summary' | null>(null);
  
  const [text, setText] = useState('');
  const [isProcessingList, setIsProcessingList] = useState(false);
  const [listSummary, setListSummary] = useState<any[]>([]);
  const [address, setAddress] = useState('HSR Layout, Bengaluru 560102');

  const subsRef = useRef<HTMLDivElement>(null);

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
    if (activeBrand !== 'All') l = l.filter(s => s.title.toLowerCase().includes(activeBrand.toLowerCase()));
    if (activeForm !== 'All') l = l.filter(s => s.variants?.some((v: any) => v.form.toLowerCase() === activeForm.toLowerCase()));

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

  const submitList = async (t: string) => { 
    setIsProcessingList(true);
    const res = await processSmartList(t || SAMPLE_LIST);
    
    if (res?.items) {
      res.items.forEach((item: any) => addToCart(item));
      setListSummary(res.summary || []);
      setModal('summary'); 
    }
    setIsProcessingList(false);
  };

  const handleFetchLocation = () => {
    setAddress('Locating...');
    setTimeout(() => {
      setAddress('South Asian University, New Delhi');
      setModal(null);
    }, 1200);
  };

  return (
    <div className="container container--wide">
      <section className="gs-hero">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="deliver">
              <PinIcon size={15} color="var(--violet)" />
              <span className="muted">Deliver to</span>
              <b>{address}</b>
              <a href="#" onClick={(e) => { e.preventDefault(); setModal('location'); }}>Change</a>
            </span>
          </div>

          <div className="eyebrow" style={{ marginTop: 32 }}>Grocery price comparison</div>
          <h1 className="h1" style={{ fontSize: 'clamp(30px, 4vw, 40px)', marginTop: 10 }}>Find the best grocery prices without checking every store.</h1>
          <p className="lead" style={{ marginTop: 14, fontSize: 17 }}>Search an item, or drop your entire list — we compare it across multiple UAE retailers.</p>
          
          <div style={{ marginTop: 28, maxWidth: 760 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input type="search" placeholder="Search groceries, brands or products…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1px solid var(--divider)', fontSize: 16 }} />
              <button type="submit" className="btn btn--primary" style={{ borderRadius: 12, padding: '0 24px' }}>Search</button>
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

        <div style={{ minWidth: 0 }}>
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

      {modal === 'location' && (
        <Modal title="Choose delivery location" subtitle="Prices and availability vary by area." onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gap: 12 }}>
            <button onClick={handleFetchLocation} className="btn btn--primary" style={{ padding: '14px', borderRadius: 12, justifyContent: 'center' }}>
              <PinIcon size={18} /> Use Current Location
            </button>
            <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 12, color: 'var(--faint)' }}>OR</div>
            <input type="text" placeholder="Enter ZIP code or area" className="input" style={{ padding: '14px', borderRadius: 12, border: '1px solid var(--divider)', width: '100%' }} />
          </div>
        </Modal>
      )}

      {modal === 'type' && (
        <Modal title="Type or paste your grocery list" subtitle="One item per line — quantities optional." onClose={() => setModal(null)}>
          <label className="visually-hidden" htmlFor="glist">Grocery list</label>
          <textarea id="glist" value={text} onChange={e => setText(e.target.value)} placeholder={SAMPLE_LIST} />
          <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
            <button type="button" className="chip chip--soft" aria-pressed="true" onClick={() => setText(SAMPLE_LIST)}>Use a sample list</button>
            <button type="button" className="btn btn--primary" onClick={() => submitList(text)} disabled={isProcessingList}>
              {isProcessingList ? 'Calculating math...' : 'Find best prices →'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'summary' && (
        <Modal title="List Processed" subtitle="Here is what we added to your basket." onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gap: 10, maxHeight: 350, overflowY: 'auto', paddingRight: 8 }}>
            {listSummary.map((item, idx) => {
              let bg = '#fff';
              let borderColor = 'var(--divider)';
              let icon = <CheckIcon size={18} color="var(--green)" />;
              
              if (item.status === 'miss') {
                bg = '#FFF5F5';
                borderColor = '#FEB2B2';
                icon = <span style={{ fontSize: 16 }}>❌</span>;
              } else if (item.status === 'auto-adjusted') {
                bg = '#FFFAF0';
                borderColor = '#FBD38D';
                icon = <span style={{ fontSize: 16 }}>⚠️</span>;
              }

              return (
                <div key={idx} style={{ padding: 12, border: `1px solid ${borderColor}`, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bg }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.line}</div>
                    <div style={{ 
                      fontSize: 12, 
                      color: item.status === 'miss' ? 'var(--red)' : item.status === 'auto-adjusted' ? '#DD6B20' : 'var(--faint)', 
                      marginTop: 4 
                    }}>
                      {item.msg}
                    </div>
                  </div>
                  <div style={{ paddingLeft: 12 }}>{icon}</div>
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => { setModal(null); setCartOpen(true); }} 
            className="btn btn--primary btn--block" 
            style={{ marginTop: 16, padding: '12px', borderRadius: 12 }}
          >
            View Cart
          </button>
        </Modal>
      )}

      {modal === 'image' && (
        <Modal title="Upload a grocery list" subtitle="A photo, screenshot or handwritten list — we'll read the items." onClose={() => setModal(null)}>
          <label className="dropzone">
            <input type="file" accept="image/*" className="visually-hidden" onChange={() => submitList(SAMPLE_LIST)} disabled={isProcessingList} />
            <span className="icon-btn icon-btn--on" style={{ width: 52, height: 52 }}><UploadIcon /></span>
            <b>{isProcessingList ? 'Processing image...' : 'Drag & drop, or click to upload'}</b><span className="faint" style={{ fontSize: 12.5 }}>PNG, JPG or a WhatsApp screenshot</span>
          </label>
        </Modal>
      )}

      <CartButton />
    </div>
  );
}

function CartButton() {
  const { setCartOpen, totalItems } = useCart();
  return (
    <button 
      onClick={() => setCartOpen(true)}
      aria-label="Open Cart"
      style={{ 
        position: 'fixed', bottom: 32, right: 32, width: 64, height: 64, borderRadius: '50%', 
        background: 'var(--violet, #5E35B1)', color: 'white', border: 'none', cursor: 'pointer', 
        zIndex: 9900, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', transition: 'transform 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      {totalItems > 0 && (
        <span style={{
          position: 'absolute', top: -2, right: -2, background: 'var(--red, #E22028)', color: 'white',
          fontSize: 13, fontWeight: 800, width: 24, height: 24, display: 'flex', alignItems: 'center', 
          justifyContent: 'center', borderRadius: '50%', border: '2px solid #fff'
        }}>
          {totalItems}
        </span>
      )}
    </button>
  );
}
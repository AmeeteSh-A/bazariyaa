'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { GroceryCard, GroceryGridCard, type PostgresGroceryProduct } from '@/components/GroceryCard';
import { Modal } from '@/components/Modal';
import { ChevronRight, ListIcon, PinIcon, UploadIcon, CheckIcon } from '@/components/Icons';
import type { GroceryCategory } from '@/types';
import { useCart } from '@/components/Cart';
import { processSmartList, extractTextFromImage, optimizeBasket, CartOptimizationRequest } from '../actions';
import SearchBar from '@/components/SearchBar';

type Sort = 'relevance' | 'price' | 'unit' | 'discount';

const SAMPLE_LIST = 'coconut 100g\napple 300g\nwatermelon 2kg\ncoriander 100g\n1 dozen eggs\nAmul butter 500g';
const CHUNK_SIZE = 50;

function getDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
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

  const { addToCart, setCartOpen } = useCart();

  const activeCatId = params.get('category') || pathParams.category;
  const activeCat = categories.find(c => c.id === activeCatId) ?? categories[0];
  const q = (params.get('q') ?? '').toLowerCase();
  const isExactSearch = params.get('exact') === '1';
  const expandKey = (params.get('expand') ?? '').toLowerCase();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeForm, setActiveForm] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [sort, setSort] = useState<Sort>(q ? 'relevance' : 'price');
  const [modal, setModal] = useState<'list' | 'location' | 'summary' | null>(null);

  const [text, setText] = useState('');
  const [isProcessingList, setIsProcessingList] = useState(false);
  const [singleVendor, setSingleVendor] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [listSummary, setListSummary] = useState<any[]>([]);

  const [address, setAddress] = useState('South Asian University, New Delhi');
  const locInputRef = useRef<HTMLInputElement>(null);

  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const observerTarget = useRef<HTMLDivElement>(null);
  const subsRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(params.get('q') || '');
    setActiveBrand(params.get('brand') || 'All');
    setActiveForm(params.get('form') || 'All');
    setActiveType(params.get('type') || 'All');
    setSort((params.get('sort') as Sort) || (params.get('q') ? 'relevance' : 'price'));
    setModal(params.get('list') ? 'list' : null);
    setVisibleCount(CHUNK_SIZE);
  }, [params]);

  useEffect(() => {
    if (q) {
      setActiveBrand('All');
      subsRef.current?.scrollTo({ left: 0 });
    }
  }, [activeCat?.id, q]);

  const updateUrl = (updates: Record<string, string | null>, options?: { scroll?: boolean }) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'All') p.set(k, v);
      else p.delete(k);
    });
    router.push(`/grocery?${p.toString()}`, { scroll: options?.scroll ?? true });
  };

  const handleExpandProduct = (p: PostgresGroceryProduct) => {
    const pTitle = String(p.title || p.key || '').trim();
    const pKey = String(p.key || pTitle).toLowerCase();
    setSearchQuery(pTitle);
    updateUrl({
      q: pTitle,
      expand: pKey,
      category: null,
      brand: null,
      form: null,
      type: null,
      exact: null,
      sort: 'relevance'
    });
  };

  const sections = searchResults?.sections || [];
  const facets = searchResults?.facets || {};
  const brands = facets.brand || [];
  const forms = facets.form || [];
  const types = facets.type || [];

  const brandMatch = useMemo(() => {
    if (activeBrand !== 'All') {
      return { brand: activeBrand, fuzzyFrom: null as string | null, correctedQuery: null as string | null };
    }
    if (!q) {
      return { brand: null as string | null, fuzzyFrom: null as string | null, correctedQuery: null as string | null };
    }

    const sectionKeys = new Set(
      sections.flatMap((s: any) => [String(s.key || '').toLowerCase(), String(s.title || '').toLowerCase()]).filter(Boolean)
    );

    const allBrands = Array.from(
      new Set([
        ...brands.map((b: any) => String(b.value)),
        ...sections.flatMap((s: any) => (s.variants || []).map((v: any) => String(v.brand)))
      ])
    ).filter((b) => {
      const lower = b.toLowerCase();
      return lower && lower !== 'generic' && lower !== 'unknown';
    });

    const distinctBrands = allBrands.filter((b) => !sectionKeys.has(b.toLowerCase()));
    const qLower = q.toLowerCase();
    const qTokens = qLower.split(/\s+/).filter(Boolean);

    for (const b of distinctBrands) {
      const bLower = b.toLowerCase();
      const exactRegex = new RegExp(`\\b${bLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (exactRegex.test(qLower)) {
        return { brand: b, fuzzyFrom: null, correctedQuery: null };
      }
    }

    const allTokensMatchSection = sections.some((s: any) => {
      const titleLower = String(s.title || '').toLowerCase();
      return qTokens.length > 0 && qTokens.every((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'i').test(titleLower));
    });

    if (isExactSearch || allTokensMatchSection) {
      return { brand: null, fuzzyFrom: null, correctedQuery: null };
    }

    let bestBrand: string | null = null;
    let bestToken: string | null = null;
    let bestDist = Infinity;

    for (const token of qTokens) {
      if (token.length < 3) continue;
      if (sectionKeys.has(token)) continue;

      for (const b of distinctBrands) {
        const bLower = b.toLowerCase();
        const maxAllowed = bLower.length <= 4 ? 1 : 2;
        const dist = getDistance(token, bLower);
        if (dist > 0 && dist <= maxAllowed && dist < bestDist) {
          bestDist = dist;
          bestBrand = b;
          bestToken = token;
        }
      }
    }

    if (bestBrand && bestToken) {
      const correctedQuery = q.replace(
        new RegExp(`\\b${bestToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
        bestBrand.toLowerCase()
      );
      return { brand: bestBrand, fuzzyFrom: q, correctedQuery };
    }

    return { brand: null, fuzzyFrom: null, correctedQuery: null };
  }, [activeBrand, q, brands, sections, isExactSearch]);

  const activeCorrectedQuery = !isExactSearch
    ? (searchResults?.interpreted?.corrected_query || brandMatch.correctedQuery)
    : null;
  const activeFuzzyFrom = activeCorrectedQuery ? q : null;

  const products = useMemo(() => {
    let l = [...sections];
    if (activeBrand !== 'All') l = l.filter(s => s.variants?.some((v: any) => v.brand.toLowerCase() === activeBrand.toLowerCase()));
    if (activeForm !== 'All') l = l.filter(s => s.variants?.some((v: any) => v.form.toLowerCase() === activeForm.toLowerCase()));

    return l.sort((a, b) => {
      if (activeType !== 'All') {
        const aMatch = a.title.toLowerCase() === activeType.toLowerCase();
        const bMatch = b.title.toLowerCase() === activeType.toLowerCase();
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
      }

      const aBest = a.variants?.[0]?.sizes?.[0]?.stores?.[0]?.price || 0;
      const bBest = b.variants?.[0]?.sizes?.[0]?.stores?.[0]?.price || 0;
      switch (sort) {
        case 'relevance': return (b.relevance || 0) - (a.relevance || 0);
        case 'price': return aBest - bBest;
        case 'unit': return (a.variants?.[0]?.sizes?.[0]?.from_unit_price || 0) - (b.variants?.[0]?.sizes?.[0]?.from_unit_price || 0);
        default: return aBest - bBest;
      }
    });
  }, [searchResults?.sections, activeBrand, activeForm, activeType, sort]);

  const expandedSection = useMemo(() => {
    if (!expandKey) return null;
    return (
      sections.find((s: any) => String(s.key || '').toLowerCase() === expandKey) ||
      sections.find((s: any) => String(s.title || '').toLowerCase() === expandKey) ||
      sections[0] ||
      null
    );
  }, [expandKey, sections]);

  const expandedCards = useMemo(() => {
    if (!expandedSection) return [];
    const items: Array<{
      id: string;
      variant: any;
      size: any;
      minPrice: number;
      minUnitPrice: number;
    }> = [];

    const variants = (expandedSection.variants || []).filter((v: any) => {
      if (activeBrand !== 'All' && v.brand.toLowerCase() !== activeBrand.toLowerCase()) return false;
      if (activeForm !== 'All' && v.form.toLowerCase() !== activeForm.toLowerCase()) return false;
      return true;
    });

    for (const v of variants) {
      const sortedSizes = [...(v.sizes || [])].sort((a: any, b: any) => {
        const getNorm = (s: any) => {
          const u = String(s.size_unit || '').toLowerCase();
          if (['kg', 'kilo', 'l', 'liter', 'litre'].includes(u)) return s.size_value * 1000;
          if (u === 'dozen') return s.size_value * 12;
          return s.size_value;
        };
        return getNorm(a) - getNorm(b);
      });

      for (const s of sortedSizes) {
        const sortedStores = [...(s.stores || [])].sort((a: any, b: any) => a.price - b.price);
        if (sortedStores.length === 0) continue;
        const minPrice = sortedStores[0].price;
        const minUnitPrice = s.size_value > 0 ? minPrice / s.size_value : s.from_unit_price || 0;
        items.push({
          id: `${expandedSection.key}-${v.brand}-${v.form}-${s.sizeKey}`,
          variant: v,
          size: { ...s, stores: sortedStores },
          minPrice,
          minUnitPrice
        });
      }
    }

    if (sort === 'price') {
      return items.sort((a, b) => a.minPrice - b.minPrice);
    }
    if (sort === 'unit') {
      return items.sort((a, b) => a.minUnitPrice - b.minUnitPrice);
    }
    return items;
  }, [expandedSection, activeBrand, activeForm, sort]);

  const relatedProducts = useMemo(() => {
    if (!expandedSection) return products;
    return products.filter((p: any) => p.key !== expandedSection.key);
  }, [products, expandedSection]);

  const activeListLength = expandedSection ? relatedProducts.length : products.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, activeListLength));
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [activeListLength]);

  const visibleProducts = (expandedSection ? relatedProducts : products).slice(0, visibleCount);

  const submitList = async (t: string) => {
    if (!t.trim()) return;
    setIsProcessingList(true);
    const res = await processSmartList(t);

    if (res?.items) {
      let finalItems = res.items;

      if (singleVendor && res.items.length > 0) {
        const groupedReq: Record<string, CartOptimizationRequest> = {};
        res.items.forEach((i: any) => {
          const hash = `${i.productKey}-${i.variantLabel}-${i.sizeKey}`;
          if (!groupedReq[hash]) {
            groupedReq[hash] = {
              key: i.productKey || i.title.toLowerCase(),
              brand: i.variantLabel.split(' ')[0],
              sizeKey: i.sizeKey || i.sizeLabel.replace(/\s+/g, ''),
              qty: 0
            };
          }
          groupedReq[hash].qty += (i.qty || 1);
        });

        const optRes = await optimizeBasket(Object.values(groupedReq), 'single_vendor');
        if (optRes?.optimizedCart && optRes.optimizedCart.length > 0) {
          finalItems = optRes.optimizedCart;
        }
      }

      finalItems.forEach((item: any) => addToCart(item));
      setListSummary(res.summary || []);
      setModal('summary');
    }
    setIsProcessingList(false);
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setModal(null);
    setAddress('Locating...');

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();

        if (data && data.address) {
          const area = data.address.suburb || data.address.neighbourhood || data.address.city_district || "";
          const city = data.address.city || data.address.town || data.address.state || "";
          const shortAddr = [area, city].filter(Boolean).join(', ');

          setAddress(shortAddr || data.display_name.split(',').slice(0, 2).join(','));
        } else {
          setAddress('Location Found');
        }
      } catch (err) {
        console.error("Failed to reverse geocode:", err);
        alert("Network error: Failed to pinpoint location!");
        setAddress('South Asian University, New Delhi');
      }
    }, (err) => {
      console.error("Geolocation error:", err);
      alert("Access Denied: Please allow location access in your browser!");
      setAddress('South Asian University, New Delhi');
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Please upload an image or text file smaller than 5MB.");
      e.target.value = '';
      return;
    }

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setText(prev => prev ? prev + '\n' + content : content);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith("image/")) {
      setIsExtractingText(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        const res = await extractTextFromImage(base64);
        if (res.text) {
          setText(prev => prev ? prev + '\n' + res.text : res.text);
        } else {
          alert(res.error || "Failed to read the image.");
        }
        setIsExtractingText(false);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Invalid file type. Please upload a .txt or an image.");
    }

    e.target.value = '';
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
          <p className="lead" style={{ marginTop: 14, fontSize: 17 }}>Search an item, or drop your entire list — we compare it across multiple Indian retailers.</p>

          <div style={{ marginTop: 28, maxWidth: 760 }}>
            <SearchBar
              variant="grocery"
              size="md"
              initialValue={searchQuery}
              placeholder="Search groceries, brands or products…"
            />
          </div>

          <div className="row" style={{ marginTop: 16, fontSize: 20 }}>
            <span className="muted" style={{ fontWeight: 500 }}>Have a grocery list?</span>
            <button type="button" className="chip" onClick={() => setModal('list')}><ListIcon size={18} color="var(--violet)" />Add List</button>
          </div>
        </div>
        <div className="gs-hero__banner"><img src="/assets/grocery/hero-banner.png" alt="Happy shopper next to Bazariyaa review badges" /></div>
      </section>

      <div className="gs-layout">
        <aside className="gs-side" aria-label="Grocery categories">
          <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', padding: '0 12px 10px' }}>Grocery</div>
          {categories.map(c => (
            <button key={c.id} type="button" className="gs-cat" aria-current={c.id === activeCat?.id} onClick={() => updateUrl({ category: c.id, q: null, expand: null })}>
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

          {types.length > 0 && (
            <>
              <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', padding: '24px 12px 10px' }}>Types</div>
              <button type="button" className="gs-cat" aria-current={activeType === 'All'} onClick={() => { setActiveType('All'); updateUrl({ type: 'All' }, { scroll: false }); gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                <span className="gs-cat__ic">🔍</span>All Types
              </button>
              {types.map((t: any, idx: number) => (
                <button
                  key={`${t.value}-${idx}`}
                  type="button"
                  className="gs-cat"
                  aria-current={activeType === t.value}
                  onClick={() => {
                    setActiveType(t.value);
                    updateUrl({ type: t.value }, { scroll: false });
                    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <span className="gs-cat__ic" style={{ background: t.image_url ? 'none' : 'var(--canvas)' }}>
                    {t.image_url ? <img src={t.image_url} alt={t.value} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} /> : '✨'}
                  </span>
                  {t.value} <span className="gs-cat__n">{t.count}</span>
                </button>
              ))}
            </>
          )}
        </aside>

        <div style={{ minWidth: 0 }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div className="scroll-x" ref={subsRef} style={{ paddingRight: 44 }} role="group" aria-label="Brands">
              <button type="button" className="chip" aria-pressed={activeBrand === 'All'} onClick={() => { setActiveBrand('All'); updateUrl({ brand: 'All' }, { scroll: false }); }}>All Brands</button>
              {brands.map((b: any) => (
                <button key={b.value} type="button" className="chip" aria-pressed={b.value === activeBrand} onClick={() => { setActiveBrand(b.value); updateUrl({ brand: b.value }, { scroll: false }); }}>
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
                {activeType !== 'All' && <span style={{ color: 'var(--violet)' }}> · {activeType}</span>}
                {activeBrand !== 'All' && <span className="faint"> · {activeBrand}</span>}
              </h2>
              <div className="muted" style={{ fontSize: 13 }}>Showing {products.length} products · prices compared across retailers</div>
            </div>
            <label className="row" style={{ fontSize: 13 }}><span className="muted">Sort</span>
              <select className="chip" value={sort} onChange={e => { setSort(e.target.value as Sort); updateUrl({ sort: e.target.value }); }}>
                <option value="relevance">Relevance</option>
                <option value="price">Lowest price</option>
                <option value="unit">Lowest unit price</option>
              </select>
            </label>
          </div>

          {activeCorrectedQuery && activeFuzzyFrom && (
            <div style={{ marginBottom: 16, fontSize: 13.5, lineHeight: 1.6 }}>
              <div>
                <span className="muted">Showing results for </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(activeCorrectedQuery);
                    updateUrl({ q: activeCorrectedQuery, expand: null, brand: null, form: null, type: null, exact: null, sort: 'relevance' });
                  }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--violet)', fontWeight: 700, fontSize: 'inherit' }}
                >
                  {activeCorrectedQuery}
                </button>
              </div>
              <div style={{ fontSize: 12.5 }}>
                <span className="muted">Search instead for </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(activeFuzzyFrom);
                    updateUrl({ q: activeFuzzyFrom, expand: null, brand: null, form: null, type: null, exact: '1', sort: 'relevance' });
                  }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--violet)', textDecoration: 'underline', fontSize: 'inherit' }}
                >
                  {activeFuzzyFrom}
                </button>
              </div>
            </div>
          )}

          {expandedSection ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div ref={gridTopRef} style={{ scrollMarginTop: '20px' }} />

              <div>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                  <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => updateUrl({ expand: null }, { scroll: false })}
                      style={{ padding: '6px 12px', fontSize: 12.5, cursor: 'pointer' }}
                    >
                      ← Grouped view
                    </button>
                    <h3 className="h3" style={{ fontSize: 18, margin: 0 }}>
                      All {expandedSection.title} options
                      <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}> ({expandedCards.length})</span>
                    </h3>
                  </div>
                </div>

                {expandedCards.length > 0 ? (
                  <div className="ggrid">
                    {expandedCards.map((item) => (
                      <GroceryGridCard
                        key={item.id}
                        productKey={expandedSection.key}
                        title={expandedSection.title}
                        fallbackImage={expandedSection.image_url}
                        variant={item.variant}
                        size={item.size}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                    <b style={{ display: 'block' }}>No matching options for this filter</b>
                    <span className="muted" style={{ fontSize: 13 }}>Try clearing the brand or form filter above.</span>
                  </div>
                )}
              </div>

              {relatedProducts.length > 0 && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <h3 className="h3" style={{ fontSize: 18, margin: 0 }}>
                      Related items
                      <span className="muted" style={{ fontWeight: 500, fontSize: 14 }}> ({relatedProducts.length})</span>
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {visibleProducts.map((p: any, idx: number) => (
                      <GroceryCard
                        key={`${p.key}-${idx}`}
                        p={p}
                        preferredBrand={brandMatch.brand}
                        onExpand={handleExpandProduct}
                      />
                    ))}
                    {visibleCount < relatedProducts.length && <div ref={observerTarget} style={{ height: 20 }} />}
                  </div>
                </div>
              )}
            </div>
          ) : products.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div ref={gridTopRef} style={{ scrollMarginTop: '20px' }} />

              {visibleProducts.map((p: any, idx: number) => (
                <GroceryCard
                  key={`${p.key}-${idx}`}
                  p={p}
                  preferredBrand={brandMatch.brand}
                  onExpand={handleExpandProduct}
                />
              ))}

              {visibleCount < products.length && <div ref={observerTarget} style={{ height: 20 }} />}
            </div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>🧺</div>
              <b style={{ display: 'block', marginTop: 12 }}>No products here yet</b>
              <span className="muted" style={{ fontSize: 13.5 }}>Try another brand or search for a specific item.</span>
            </div>
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

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={locInputRef}
                type="text"
                placeholder="Enter ZIP code or area"
                className="input"
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--divider)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                    const val = e.currentTarget.value.trim();
                    setModal(null);
                    setAddress('Setting...');
                    setTimeout(() => setAddress(val), 400);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn--secondary"
                style={{ padding: '0 24px', borderRadius: 12, fontWeight: 600, background: 'var(--canvas)', border: '1px solid var(--divider)' }}
                onClick={() => {
                  if (locInputRef.current && locInputRef.current.value.trim() !== '') {
                    const val = locInputRef.current.value.trim();
                    setModal(null);
                    setAddress('Setting...');
                    setTimeout(() => setAddress(val), 400);
                  }
                }}
              >
                Set
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'list' && (
        <Modal title="Smart Grocery List" subtitle="Type, paste, upload a .txt, or upload a photo of your list." onClose={() => setModal(null)}>
          <label className="visually-hidden" htmlFor="glist">Grocery list</label>
          <textarea
            id="glist"
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={isProcessingList || isExtractingText}
            placeholder={isExtractingText ? 'Scanning image...' : SAMPLE_LIST}
            style={{
              width: '100%', height: '40vh', minHeight: 150, padding: 16,
              borderRadius: 12, border: '1px solid var(--divider)',
              resize: 'none', fontSize: 14, fontFamily: 'inherit',
              background: isExtractingText ? '#F9F9F9' : '#fff',
              color: isExtractingText ? 'var(--faint)' : 'inherit'
            }}
          />

          <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
            <label className="chip chip--dashed" style={{ cursor: 'pointer', margin: 0 }}>
              <UploadIcon size={14} />
              {isExtractingText ? 'Reading...' : 'Upload Image / .txt'}
              <input type="file" accept="image/*,.txt" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isExtractingText || isProcessingList} />
            </label>
            <button type="button" className="chip chip--soft" onClick={() => setText(SAMPLE_LIST)} disabled={isExtractingText || isProcessingList}>
              Load Sample
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--divider)', background: singleVendor ? 'var(--violet-light, #F3F0FE)' : '#fff', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: singleVendor ? 'var(--violet)' : 'inherit' }}>Single vendor</div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>Optimize list into one store to save on delivery</div>
            </div>
            <input
              type="checkbox"
              checked={singleVendor}
              onChange={(e) => setSingleVendor(e.target.checked)}
              disabled={isProcessingList || isExtractingText}
              style={{ width: 18, height: 18, accentColor: 'var(--violet, #5E35B1)', cursor: 'pointer' }}
            />
          </label>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => submitList(text)}
              disabled={isProcessingList || isExtractingText || !text.trim()}
              style={{ borderRadius: 12, padding: '14px' }}
            >
              {isProcessingList ? 'Calculating math & best prices...' : 'Find best prices →'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'summary' && (
        <Modal title="List Processed" subtitle="Here is what we added to your basket." onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gap: 10, maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
            {listSummary.map((item, idx) => {
              let bg = '#fff';
              let borderColor = 'var(--divider)';
              let icon = <CheckIcon size={18} color="var(--green)" />;
              let msgColor = 'var(--faint)';

              const hasChoices = item.choices && item.choices.length > 0;

              if (hasChoices) {
                bg = '#FFF8EB'; borderColor = '#F6AD55'; icon = <span style={{ fontSize: 16 }}>🤔</span>; msgColor = '#DD6B20';
              } else if (item.status === 'miss') {
                bg = '#FFF5F5'; borderColor = '#FEB2B2'; icon = <span style={{ fontSize: 16 }}>❌</span>; msgColor = 'var(--red)';
              } else if (item.status === 'auto-adjusted') {
                bg = '#FFFAF0'; borderColor = '#FBD38D'; icon = <span style={{ fontSize: 16 }}>⚠️</span>; msgColor = '#DD6B20';
              }

              return (
                <div key={idx} style={{ padding: 12, border: `1px solid ${borderColor}`, borderRadius: 8, background: bg, transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.line}</div>
                      <div style={{ fontSize: 12, color: msgColor, marginTop: 4 }}>{item.msg}</div>
                    </div>
                    <div style={{ paddingLeft: 12 }}>{icon}</div>
                  </div>

                  {hasChoices && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${borderColor}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {item.choices.map((choice: any, cIdx: number) => (
                        <button
                          key={cIdx}
                          onClick={() => {
                            choice.items.forEach((i: any) => addToCart(i));
                            const newSummary = [...listSummary];
                            newSummary[idx] = { ...item, status: 'success', msg: `${choice.label} applied perfectly.`, choices: null };
                            setListSummary(newSummary);
                          }}
                          style={{ flex: 1, padding: '8px 4px', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          {choice.label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const newSummary = [...listSummary];
                          newSummary[idx] = { ...item, status: 'miss', msg: 'Item discarded.', choices: null };
                          setListSummary(newSummary);
                        }}
                        style={{ padding: '8px 12px', background: 'transparent', color: 'var(--red, #E22028)', border: '1px solid var(--red, #E22028)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Discard
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => { setModal(null); setCartOpen(true); }} className="btn btn--primary btn--block" style={{ marginTop: 16, padding: '12px', borderRadius: 12 }}>
            View Cart
          </button>
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
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import { ClipIcon, ImageIcon, ListIcon, MicIcon, PinIcon } from '@/components/Icons';

export interface GroceryCategory {
  name: string;
  cat: string;
  icon: string;
  tint: string;
  count: number;
}

export default function Grocery({ initialCategories }: { initialCategories: GroceryCategory[] }) {
  const router = useRouter();
  const toList = () => router.push('/grocery/search?list=1');
  
  return (
    <div className="container container--wide">
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
        <span className="deliver"><PinIcon size={15} color="var(--violet)" /><span className="muted">Deliver to</span><b>HSR Layout, Bengaluru 560102</b><a href="#">Change</a></span>
      </div>

      <section className="g-hero">
        <div className="eyebrow">Grocery price comparison</div>
        <h1 className="h1" style={{ fontSize: 'clamp(30px, 4.4vw, 44px)', marginTop: 14 }}>Find the best grocery prices without checking every store.</h1>
        <p className="lead">Search an item, or drop your entire list — we compare it across Blinkit, Zepto, Instamart and more, and tell you exactly where it costs the least.</p>
        <SearchBar placeholder="Search groceries, brands or products…" variant="grocery" />
        <div className="list-actions">
          <span className="muted" style={{ fontWeight: 500 }}>Have a grocery list?</span>
          <button type="button" className="chip" onClick={toList}><ListIcon size={15} color="var(--violet)" />Type list</button>
          <button type="button" className="chip" onClick={toList}><ImageIcon size={15} color="var(--violet)" />Upload image</button>
          <button type="button" className="chip" onClick={toList}><ClipIcon size={15} color="var(--violet)" />Paste list</button>
          <button type="button" className="chip chip--dashed" onClick={toList}><MicIcon size={15} color="var(--violet)" />Speak</button>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">Browse</div>
        <h2 className="h2" style={{ fontSize: 28, marginBottom: 24 }}>Shop by category</h2>
        <div className="grid g6">
          {initialCategories.map(t => (
            <Link key={t.name} href={'/grocery/' + t.cat} className="tile card--hover">
              <div className="tile__img" style={{ background: t.tint }}><span aria-hidden="true">{t.icon}</span></div>
              <div className="tile__name">{t.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{t.count} items</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
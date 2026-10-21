'use client';

import Link from 'next/link';
import type { Product } from '@/types';
import { money, sparkPoints } from '@/utils/format';

export function ProductCard({ p }: { p: Product }) {
  const inr = (n: number) => money(n, p.currency);
  const trend = p.trend === 'down' ? '↓ dropping' : p.trend === 'up' ? '↑ rising' : '→ stable';
  return (
    <article className="card card--hover pcard">
      <Link 
        href={'/product/' + p.slug} 
        className={`pcard__img ${!p.image ? 'placeholder' : ''}`} 
        aria-label={p.name}
        style={p.image ? { background: 'var(--canvas)' } : {}}
      >
        {p.image ? (
          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }} />
        ) : (
          <span>{p.icon}</span>
        )}
        <span className="badge badge--white pcard__badge">👍 {p.recommended}% Recommended</span>
      </Link>
      <div className="pcard__body">
        <div className="muted" style={{ fontSize: 12, fontWeight: 500 }}>{p.category}</div>
        <Link href={'/product/' + p.slug} className="pcard__name">{p.brand} {p.name}</Link>
        <div className="row" style={{ fontSize: 13 }}>
          <strong>★ {p.rating}</strong>
          <span className="muted" style={{ fontSize: 12 }}>{p.reviews} reviews</span>
          <span className="badge" style={{ marginLeft: 'auto' }}>{p.trust}% real</span>
        </div>
        <div className="pcard__foot">
          <div>
            <div className="pcard__price">{inr(p.price)}</div>
            <div style={{ fontSize: 12 }}><s className="faint">{inr(p.mrp)}</s> <span className="muted">{trend}</span></div>
          </div>
          <svg width="76" height="30" viewBox="0 0 76 30" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={sparkPoints(p.history, 76, 30)} fill="none" stroke="#787574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <Link href={'/product/' + p.slug} className="btn btn--primary btn--block">Buy now</Link>
      </div>
    </article>
  );
}
'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
      <div style={{ fontSize: 48 }}>🧭</div>
      <h1 className="h2">We couldn't find that page</h1>
      <p className="lead" style={{ margin: '12px auto 24px', maxWidth: 420 }}>It may have moved. Start from the homepage or jump into grocery.</p>
      <div className="row" style={{ justifyContent: 'center' }}><Link href="/" className="btn btn--primary">Go home</Link><Link href="/grocery" className="btn btn--secondary">Grocery</Link></div>
    </div>
  );
}

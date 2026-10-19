'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare } from '@/context/CompareContext';
import { CloseIcon, CompareIcon, MenuIcon } from './Icons';
import { SearchBar } from './SearchBar';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/#categories', label: 'Categories' },
  { to: '/#top', label: 'Search' },
  { to: '/grocery', label: 'Grocery' },
];

function announcementFor(path: string): string {
  if (path.startsWith('/grocery/')) return 'Paste your whole grocery list — Bazariyaa finds the cheapest store combination for you.';
  if (path.startsWith('/grocery')) return 'Compare grocery prices across retailers — always see the best value per gram.';
  if (path.startsWith('/product')) return 'Prices tracked hourly across 6 retailers — you always see the real lowest.';
  return 'Get the Bazariyaa app — honest verdicts & price drops in your pocket.';
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isGrocery = pathname.startsWith('/grocery');
  const isActive = (n: { to: string; end?: boolean }) => !n.to.includes('#') && (n.end ? pathname === n.to : pathname.startsWith(n.to));
  return (
    <>
      <div className="announce" role="note">
        <span className="announce__b">B</span>
        <span>{announcementFor(pathname)}</span>
      </div>
      <header className="header">
        <div className="container container--wide header__bar">
          <Link href="/" className="header__logo" aria-label="Bazariyaa home">
            <img src="/assets/logo.png" alt="Bazariyaa" width={111} height={30} />
          </Link>
          <nav className="nav" aria-label="Primary">
            {NAV.map(n => (
              <Link key={n.label} href={n.to} className={isActive(n) ? 'active' : ''}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header__spacer" />
          {isGrocery && (
            <div className="header__search">
              <SearchBar size="sm" placeholder="Search groceries…" scope="grocery" />
            </div>
          )}
          <div className="row header__actions">
            <button className="btn btn--ghost" type="button">Sign in</button>
            <button className="btn btn--primary" type="button">Get the app</button>
            <button className="icon-btn header__menu" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(o => !o)}>
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="mobile-nav" aria-label="Mobile">
            {NAV.map(n => (
              <Link key={n.label} href={n.to} onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <img className="footer__logo" src="/assets/logo-white.png" alt="Bazariyaa" />
            <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 260, marginTop: 16 }}>India's honest product-discovery platform. We help you decide with confidence — no paid rankings, ever.</p>
          </div>
          <div><div className="footer__h">Discover</div><div className="footer__links"><Link href="/#categories">Categories</Link><Link href="/#trending">Trending</Link><Link href="/#deals">Deals</Link><Link href="/grocery">Grocery</Link></div></div>
          <div><div className="footer__h">Company</div><div className="footer__links"><Link href="/#trust">How it works</Link><a href="#">About</a><a href="#">Careers</a><a href="#">Press</a></div></div>
          <div><div className="footer__h">Legal</div><div className="footer__links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Review policy</a></div></div>
        </div>
        <div className="footer__bottom"><span>© 2026 Bazariyaa. Made in India, for India.</span><span>Prices updated hourly · Reviews independently verified</span></div>
      </div>
    </footer>
  );
}

export function CompareFab() {
  const { ids } = useCompare();
  if (!ids.length) return null;
  return (
    <Link href="/product/apple-iphone-17-pro#compare" className="btn btn--primary fab">
      <CompareIcon /> Compare <span className="fab__n">{ids.length}</span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CompareFab />
    </>
  );
}

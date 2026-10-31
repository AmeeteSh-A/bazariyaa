"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { SearchIcon } from "./Icons";

type SearchResultItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  image?: string;
  bucket: 'exact' | 'similar' | 'associated';
  rank: number;
};

type SearchApiResponse = {
  query: string;
  normalized_query: string;
  exact: SearchResultItem[];
  similar: SearchResultItem[];
  associated: SearchResultItem[];
};

export default function SearchBar({
  placeholder,
  initialValue = "",
  variant
}: {
  placeholder?: string;
  initialValue?: string;
  variant?: "global" | "grocery";
}) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isGrocery = pathname?.startsWith('/grocery') || variant === 'grocery';
  const activePlaceholder = placeholder || (isGrocery ? "Search daily essentials..." : "Search laptops, phones...");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults(null);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    
    const fetchResults = async () => {
      setLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${isGrocery ? 'grocery' : 'general'}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data: SearchApiResponse = await res.json();
          setResults(data);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setResults(null);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isGrocery]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    const basePath = isGrocery ? "/grocery" : "/search";
    router.push(`${basePath}?q=${encodeURIComponent(query.trim())}`);
  }

  const totalCount = (results?.exact?.length || 0) + (results?.similar?.length || 0);

  return (
    <div ref={containerRef} className={`search ${isGrocery ? 'search--sm' : ''}`} style={{ width: '100%', position: 'relative', zIndex: 9999 }}>
      <form onSubmit={handleSubmit} className="search__bar">
        <SearchIcon size={20} className="faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim().length > 0) setOpen(true); }}
          placeholder={activePlaceholder}
        />
        <button type="submit" className="btn btn--primary">Search</button>
      </form>

      {open && query.trim().length > 0 && (
        <div className="search__drop" style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.15)', border: '1px solid var(--border)' }}>
          {loading && !results && <div className="search__label">Searching catalog...</div>}
          
          {!loading && results && results.normalized_query !== query.trim().toLowerCase() && (
            <div className="search__label" style={{ color: 'var(--violet)' }}>
              Showing results for "{results.normalized_query}"
            </div>
          )}
          
          {!loading && totalCount === 0 && <div className="search__label">No matches found.</div>}

          {results && results.exact.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="search__label">Exact Matches</div>
              {results.exact.slice(0, 5).map((item) => (
                <Link key={item.id} href={`/product/${encodeURIComponent(item.id)}`} onClick={() => setOpen(false)} className="search__item">
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--canvas)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <SearchIcon size={18} className="faint" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="search__title" style={{ color: '#000', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                    <span className="search__meta" style={{ display: 'block' }}>{item.category} • {item.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results && results.similar.length > 0 && (
            <div>
              <div className="search__label" style={{ color: 'var(--green)' }}>Similar & Alternatives</div>
              {results.similar.slice(0, 3).map((item) => (
                <Link key={item.id} href={`/product/${encodeURIComponent(item.id)}`} onClick={() => setOpen(false)} className="search__item" style={{ padding: '8px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="search__title" style={{ color: '#000' }}>{item.name}</span>
                    <span className="search__meta">{item.category} • {item.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
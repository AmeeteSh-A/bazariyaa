"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./Icons";

type SearchResultItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  buy: number;
  image?: string;
};

type SearchApiResponse = {
  query: string;
  normalized_query: string;
  exact: SearchResultItem[];
  similar: SearchResultItem[];
  associated: SearchResultItem[];
};

export default function SearchBar({
  placeholder = "Search laptops, phones, milk, namkeen...",
  initialValue = "",
  variant = "global"
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
    const timer = setTimeout(async () => {
      setLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") setResults(null);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    
    const basePath = variant === "grocery" ? "/grocery/search" : "/search";
    router.push(`${basePath}?q=${encodeURIComponent(query.trim())}`);
  }

  const totalCount =
    (results?.exact?.length || 0) +
    (results?.similar?.length || 0) +
    (results?.associated?.length || 0);

  return (
    // Added zIndex: 9999 to guarantee it sits above absolutely everything
    <div ref={containerRef} className={`search ${variant === 'grocery' ? 'search--sm' : ''}`} style={{ width: '100%', position: 'relative', zIndex: 9999 }}>
      <form onSubmit={handleSubmit} className="search__bar">
        <SearchIcon size={20} className="faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true);
          }}
          placeholder={placeholder}
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
              {/* Slicing to show exactly top 5 */}
              {results.exact.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${encodeURIComponent(item.id)}`}
                  onClick={() => setOpen(false)}
                  className="search__item"
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 12px' }}
                >
                  {/* Picture of the result */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--canvas)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <SearchIcon size={18} className="faint" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Black text forced for the title */}
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
                <Link
                  key={item.id}
                  href={`/product/${encodeURIComponent(item.id)}`}
                  onClick={() => setOpen(false)}
                  className="search__item"
                  style={{ padding: '8px 12px' }}
                >
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
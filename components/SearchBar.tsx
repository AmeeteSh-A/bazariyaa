"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type SearchResultItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  buy: number;
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced API call for keystroke search
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
    }, 180); // 180ms delay prevents spamming the database

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    
    // Route to global or grocery search page based on where the bar is mounted
    const basePath = variant === "grocery" ? "/grocery/search" : "/search";
    router.push(`${basePath}?q=${encodeURIComponent(query.trim())}`);
  }

  const totalCount =
    (results?.exact?.length || 0) +
    (results?.similar?.length || 0) +
    (results?.associated?.length || 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl z-50">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center rounded-full border border-slate-200 bg-white py-2.5 pl-4 pr-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
      >
        <Search className="h-5 w-5 text-slate-400 mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none"
        />
        <button
          type="submit"
          className="ml-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[400px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          {loading && !results && (
            <div className="p-3 text-sm text-slate-500">Searching catalog...</div>
          )}

          {!loading && results && results.normalized_query !== query.trim().toLowerCase() && (
            <div className="px-3 pb-2 text-xs font-medium text-indigo-600">
              Showing results for "{results.normalized_query}"
            </div>
          )}

          {!loading && totalCount === 0 && (
            <div className="p-3 text-sm text-slate-500">No matches found.</div>
          )}

          {results && results.exact.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Exact Matches
              </div>
              {results.exact.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${encodeURIComponent(item.id)}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.category} · {item.price}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">
                    Buy {item.buy}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {results && results.similar.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Similar & Alternatives
              </div>
              {results.similar.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${encodeURIComponent(item.id)}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="truncate text-sm font-medium text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.category} · {item.price}</div>
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
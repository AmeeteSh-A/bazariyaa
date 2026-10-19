import React from "react";
import Link from "next/link";
import SearchBar from "../components/SearchBar";
import { parseQuery } from "../lib/search/queryParser";
import { classifyResults } from "../lib/search/classifier";
import { supabaseServer } from "../lib/supabaseServer";

export default async function GlobalSearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolved = await searchParams;
  const q = resolved.q || "";
  const parsed = parseQuery(q);

  // Initialize Supabase from your new lib helper
  const supabase = typeof supabaseServer === "function" ? supabaseServer() : supabaseServer;
  
  let dbRows: any[] = [];

  // Run the hybrid search natively on the server
  if (q.trim().length > 0 && supabase) {
    const { data } = await supabase.rpc("search_catalog", {
      search_query: parsed.normalizedQuery
    });
    if (Array.isArray(data)) {
      dbRows = data;
    }
  }

  // Classify results into buckets
  const buckets = classifyResults(dbRows, parsed);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Search Results for "{q}"
        </h1>
        <div className="mt-6">
          <SearchBar initialValue={q} variant="global" />
        </div>
        {parsed.normalizedQuery && parsed.normalizedQuery !== q.toLowerCase().trim() && (
          <p className="mt-3 text-xs text-indigo-600">
            Showing results for <b>{parsed.normalizedQuery}</b>
          </p>
        )}
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Exact Matches ({buckets.exact.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buckets.exact.map((item) => (
            <Link
              key={item.id}
              href={`/product/${encodeURIComponent(item.id)}`}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="mb-1 text-[11px] font-bold uppercase text-indigo-600">{item.category}</div>
              <div className="mb-2 text-sm font-semibold text-slate-900 line-clamp-2">{item.name}</div>
              <div className="mt-auto pt-2 text-base font-bold text-slate-900">{item.price}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Similar & Alternatives ({buckets.similar.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buckets.similar.map((item) => (
            <Link
              key={item.id}
              href={`/product/${encodeURIComponent(item.id)}`}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-md"
            >
              <div className="mb-1 text-[11px] font-bold uppercase text-teal-700">{item.category}</div>
              <div className="mb-2 text-sm font-semibold text-slate-900 line-clamp-2">{item.name}</div>
              <div className="mt-auto pt-2 text-base font-bold text-slate-900">{item.price}</div>
            </Link>
          ))}
        </div>
      </section>

      {buckets.associated.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Frequently Bought Together ({buckets.associated.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {buckets.associated.map((item) => (
              <Link
                key={item.id}
                href={`/product/${encodeURIComponent(item.id)}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-1 text-[11px] font-bold uppercase text-slate-500">{item.category}</div>
                <div className="mb-2 text-sm font-semibold text-slate-900 line-clamp-2">{item.name}</div>
                <div className="mt-auto pt-2 text-base font-bold text-slate-900">{item.price}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
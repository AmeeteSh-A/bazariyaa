import React from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { parseQuery } from "@/lib/search/queryParser";
import { classifyResults } from "@/lib/search/classifier";
import { serverSupabase } from "@/lib/supabaseServer";

export default async function GlobalSearchPage({
  searchParams 
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolved = await searchParams;
  const q = resolved.q || "";
  const parsed = parseQuery(q);
  const supabase = serverSupabase();
  
  let dbRows: any[] = [];

  if (q.trim().length > 0 && supabase) {
    const { data } = await supabase.rpc("search_catalog", {
      search_query: parsed.normalizedQuery
    });
    if (Array.isArray(data)) {
      dbRows = data;
    }
  }

  const buckets = classifyResults(dbRows, parsed);

  return (
    <main className="container section">
      <div style={{ marginBottom: 32 }}>
        <Link href="/" className="eyebrow" style={{ display: 'inline-block', marginBottom: 16 }}>
          ← Back to Home
        </Link>
        <h1 className="h1">Search Results for "{q}"</h1>
        <div style={{ marginTop: 24, maxWidth: 600 }}>
          <SearchBar initialValue={q} variant="global" />
        </div>
        {parsed.normalizedQuery && parsed.normalizedQuery !== q.toLowerCase().trim() && (
          <p className="sub" style={{ marginTop: 12, color: 'var(--violet)' }}>
            Showing results for <b>{parsed.normalizedQuery}</b>
          </p>
        )}
      </div>

      <section className="section section--tight">
        <h2 className="h2" style={{ marginBottom: 16 }}>
          Exact Matches ({buckets.exact.length})
        </h2>
        <div className="grid g4">
          {buckets.exact.map((item) => (
            <Link
              key={item.id}
              href={`/product/${encodeURIComponent(item.id)}`}
              className="card card--hover pcard"
            >
              <div className="pcard__body">
                <div className="eyebrow">{item.category}</div>
                <div className="pcard__name">{item.name}</div>
                <div className="pcard__foot">
                  <div className="pcard__price" style={{ color: 'var(--violet)' }}>{item.price}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {buckets.similar.length > 0 && (
        <section className="section section--tight">
          <h2 className="h2" style={{ marginBottom: 16 }}>
            Similar & Alternatives ({buckets.similar.length})
          </h2>
          <div className="grid g4">
            {buckets.similar.map((item) => (
              <Link
                key={item.id}
                href={`/product/${encodeURIComponent(item.id)}`}
                className="card card--hover pcard"
              >
                <div className="pcard__body">
                  <div className="eyebrow" style={{ color: 'var(--green)' }}>{item.category}</div>
                  <div className="pcard__name">{item.name}</div>
                  <div className="pcard__foot">
                    <div className="pcard__price">{item.price}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
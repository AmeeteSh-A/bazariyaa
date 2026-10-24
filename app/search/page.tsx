import React from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { parseQuery } from "@/lib/search/queryParser";
import { serverSupabase } from "@/lib/supabaseServer";
import { money } from "@/utils/format";

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

  const buckets = {
    exact: dbRows.filter((r: any) => r.bucket === 'exact'),
    similar: dbRows.filter((r: any) => r.bucket === 'similar'),
    associated: dbRows.filter((r: any) => r.bucket === 'associated'),
  };

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
          {buckets.exact.map((item: any) => (
            <Link
              key={item.id}
              href={`/product/${encodeURIComponent(item.id)}`}
              className="card card--hover pcard"
            >
              {item.image && (
                <div className="pcard__img" style={{ background: 'var(--canvas)', padding: 16, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={item.image} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div className="pcard__body">
                <div className="eyebrow">{item.category}</div>
                <div className="pcard__name">{item.name}</div>
                <div className="pcard__foot">
                  <div className="pcard__price" style={{ color: 'var(--violet)' }}>{money(item.price)}</div>
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
            {buckets.similar.map((item: any) => (
              <Link
                key={item.id}
                href={`/product/${encodeURIComponent(item.id)}`}
                className="card card--hover pcard"
              >
                {item.image && (
                  <div className="pcard__img" style={{ background: 'var(--canvas)', padding: 16, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={item.image} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <div className="pcard__body">
                  <div className="eyebrow" style={{ color: 'var(--green)' }}>{item.category}</div>
                  <div className="pcard__name">{item.name}</div>
                  <div className="pcard__foot">
                    <div className="pcard__price">{money(item.price)}</div>
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
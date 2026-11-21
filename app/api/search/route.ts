import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseQuery } from "../../../lib/search/queryParser";
import { inr } from "../../../utils/format";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export type SearchDbRow = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  image: string | null;
  bucket: 'exact' | 'similar' | 'associated';
  rank: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "general";
    const trimmed = q.trim();

    if (trimmed.length === 0) {
      return NextResponse.json({
        query: q,
        normalized_query: "",
        exact: [],
        similar: [],
        associated: [],
        meta: { total: 0 }
      });
    }

    if (type === "grocery") {
      const { data, error } = await supabase.rpc("search_grocery", {
        search_q: trimmed,
        exact_mode: false
      });

      if (error) throw error;

      const sections: any[] = data?.sections || [];
      const correctedQuery: string | null = data?.interpreted?.corrected_query || null;
      const effectiveQuery = (correctedQuery || trimmed).toLowerCase();
      const qTokens = effectiveQuery.split(/\s+/).filter(Boolean);

      const maxRel = sections[0]?.relevance || 0;
      const hasStrongMatches = maxRel >= 50900 || (maxRel >= 45000 && maxRel < 50000);

      const mapped = sections.slice(0, 12).map((sec: any, idx: number) => {
        const variants: any[] = sec.variants || [];
        let minPrice = Infinity;
        const storeNames = new Set<string>();
        let matchedBrand: string | null = null;

        for (const v of variants) {
          const b = String(v.brand || "");
          const bLower = b.toLowerCase();
          if (
            !matchedBrand &&
            bLower &&
            bLower !== "generic" &&
            bLower !== "unknown" &&
            qTokens.some((t) => t === bLower)
          ) {
            matchedBrand = b;
          }

          for (const s of v.sizes || []) {
            for (const st of s.stores || []) {
              if (st.name) storeNames.add(st.name);
              if (typeof st.price === "number" && st.price < minPrice) {
                minPrice = st.price;
              }
            }
          }
        }

        const rel = Number(sec.relevance || 0);
        const isExactBucket = hasStrongMatches
          ? rel >= 50900 || (rel >= 45000 && rel < 50000)
          : idx < 5;

        const title = String(sec.title || sec.key || "");
        const targetQuery =
          matchedBrand && !title.toLowerCase().includes(matchedBrand.toLowerCase())
            ? `${matchedBrand} ${title}`
            : title;

        const storeCount = storeNames.size;
        const storeLabel = `${storeCount} ${storeCount === 1 ? "store" : "stores"}`;
        const metaLabel = matchedBrand
          ? `${matchedBrand} · ${storeLabel}`
          : variants.length > 1
            ? `${variants.length} brands · ${storeLabel}`
            : storeLabel;

        return {
          id: String(sec.key || idx),
          name: title,
          brand: matchedBrand || variants[0]?.brand || "Generic",
          category: metaLabel,
          price: minPrice < Infinity ? `From ${inr(minPrice)}` : "",
          image: sec.image_url || undefined,
          href: `/grocery?q=${encodeURIComponent(targetQuery)}`,
          bucket: (isExactBucket ? "exact" : "similar") as "exact" | "similar",
          rank: idx + 1
        };
      });

      return NextResponse.json({
        query: trimmed,
        normalized_query: effectiveQuery,
        exact: mapped.filter((r) => r.bucket === "exact"),
        similar: mapped.filter((r) => r.bucket === "similar"),
        associated: [],
        meta: { total: mapped.length }
      });
    }

    const parsedQuery = parseQuery(q);
    const { data, error } = await supabase.rpc("search_catalog", {
      search_query: parsedQuery.normalizedQuery
    });

    if (error) throw error;

    const rows = ((data || []) as SearchDbRow[]).map((r) => ({
      ...r,
      href: `/product/${encodeURIComponent(r.id)}`
    }));

    return NextResponse.json({
      query: parsedQuery.original,
      normalized_query: parsedQuery.normalizedQuery,
      exact: rows.filter((r) => r.bucket === "exact"),
      similar: rows.filter((r) => r.bucket === "similar"),
      associated: rows.filter((r) => r.bucket === "associated"),
      meta: { total: rows.length }
    });
  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json({ error: "Internal search error" }, { status: 500 });
  }
}
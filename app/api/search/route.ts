import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseQuery } from "../../../lib/search/queryParser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mpnywlderrwnpajinbpq.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (q.trim().length === 0) {
      return NextResponse.json({
        query: q,
        normalized_query: "",
        exact: [],
        similar: [],
        associated: [],
        meta: { total: 0 }
      });
    }

    const parsedQuery = parseQuery(q);

    const { data, error } = await supabase.rpc("search_catalog", { 
      search_query: parsedQuery.normalizedQuery 
    });

    if (error) throw error;

    const rows = data || [];
    const exact = rows.filter((r: any) => r.bucket === 'exact');
    const similar = rows.filter((r: any) => r.bucket === 'similar');
    const associated = rows.filter((r: any) => r.bucket === 'associated');

    return NextResponse.json({
      query: parsedQuery.original,
      normalized_query: parsedQuery.normalizedQuery,
      exact,
      similar,
      associated,
      meta: { total: rows.length }
    });

  } catch (err: any) {
    console.error("Search API Error:", err);
    return NextResponse.json({ error: err?.message || "Internal search error" }, { status: 500 });
  }
}
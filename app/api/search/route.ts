import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseQuery } from "../../../lib/search/queryParser";

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

    const rows = (data || []) as SearchDbRow[];

    return NextResponse.json({
      query: parsedQuery.original,
      normalized_query: parsedQuery.normalizedQuery,
      exact: rows.filter((r) => r.bucket === 'exact'),
      similar: rows.filter((r) => r.bucket === 'similar'),
      associated: rows.filter((r) => r.bucket === 'associated'),
      meta: { total: rows.length }
    });

  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json({ error: "Internal search error" }, { status: 500 });
  }
}
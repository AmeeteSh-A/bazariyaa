import { serverSupabase } from '@/lib/supabaseServer';
import { toUiProduct } from '@/lib/toUiProduct';
import type { Product as UiProduct } from '@/types';

interface SearchParams {
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function getSearchResults(params: SearchParams): Promise<UiProduct[]> {
  // 🚀 FUTURE STATE: 
  // const res = await fetch(`https://api.bazariyaa.com/search?q=${params.q}&cat=${params.category}`);
  // return res.json();

  // 🛠️ CURRENT STATE (Temporary Supabase Wrapper):
  const supabase = serverSupabase();
  if (!supabase) return [];

  const { data } = await supabase.rpc('search_products_full', {
    search_query: params.q || '',
    filter_category: params.category === 'All' ? null : params.category,
    min_price: params.minPrice || 0,
    max_price: params.maxPrice || 999999
  });

  return (data || []).map((row: any) => toUiProduct(row));
}

export async function getProductDetails(id: string) {
  // 🚀 FUTURE STATE:
  // const res = await fetch(`https://api.bazariyaa.com/product/${id}`);
  // return res.json();
  
  // 🛠️ CURRENT STATE:
  // Move your complex Supabase fetching logic from `app/product/[id]/page.tsx` here.
  // Return a clean object containing { product, offers, alternatives, ... }
}
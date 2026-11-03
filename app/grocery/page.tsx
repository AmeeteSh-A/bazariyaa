import { Suspense } from 'react';
import GrocerySearch from '@/views/GrocerySearch';
import { serverSupabase } from '@/lib/supabaseServer';

export const revalidate = 60;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';
  const category = params.category || '';
  
  const supabase = serverSupabase();
  
  let categories: any[] = [];
  let searchResults = { interpreted: {}, sections: [], facets: {} };

  if (supabase) {
    const catsPromise = supabase
      .from('grocery_categories')
      .select('*')
      .order('count', { ascending: false });

    
    const searchTerm = q || category || '';
    
    const rpcPromise = supabase.rpc('search_grocery', {
      search_q: searchTerm
    });

    const [catsRes, rpcRes] = await Promise.all([catsPromise, rpcPromise]);

    categories = catsRes.data || [];
    if (rpcRes.data) {
      searchResults = rpcRes.data;
    }
  }

  const safeCategories = categories.map(c => ({
    ...c,
    id: c.cat || c.id 
  }));

  return (
    <Suspense fallback={<div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>Loading shelves...</div>}>
      <GrocerySearch categories={safeCategories} searchResults={searchResults} />
    </Suspense>
  );
}
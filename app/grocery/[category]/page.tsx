import { Suspense } from 'react';
import GrocerySearch from '@/views/GrocerySearch';
import { serverSupabase } from '@/lib/supabaseServer';

export const revalidate = 60; 

export default async function Page() {
  const supabase = serverSupabase();
  let categories = [];
  let products = [];

  if (supabase) {
    const [catsRes, prodsRes] = await Promise.all([
      supabase.from('grocery_categories').select('*').order('count', { ascending: false }),
      supabase.from('grocery_products').select('*')
    ]);
    
    categories = catsRes.data || [];
    products = prodsRes.data || [];
  }

  const safeCategories = JSON.parse(JSON.stringify(categories));
  const safeProducts = JSON.parse(JSON.stringify(products));

  return (
    <Suspense fallback={<div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>Loading shelves...</div>}>
      {}
      <GrocerySearch categories={safeCategories} initialProducts={safeProducts} />
    </Suspense>
  );
}
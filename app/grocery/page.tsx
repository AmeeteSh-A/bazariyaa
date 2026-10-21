import Grocery from '@/views/Grocery';
import { serverSupabase } from '@/lib/supabaseServer';

export const revalidate = 300; // Cache for 5 minutes

export default async function Page() {
  const supabase = serverSupabase();
  let categories = [];

  if (supabase) {
    const { data } = await supabase
      .from('grocery_categories')
      .select('*')
      .order('count', { ascending: false });
      
    categories = data || [];
  }

  return <Grocery initialCategories={categories} />;
}
import Landing from '@/views/Landing';
import { normalizeProduct } from '@/lib/adapter';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';

export const revalidate = 300;

export default async function Page() {
  const supabase = serverSupabase();
  let live: ReturnType<typeof toUiProduct>[] = [];
  if (supabase) {
    const { data } = await supabase.from('raw_products').select('*').limit(24);
    live = (data ?? []).map(row => toUiProduct(normalizeProduct(row.data, null)));
  }
  return <Landing liveProducts={live} />;
}

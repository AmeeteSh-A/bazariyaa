import Landing from '@/views/Landing';
import { normalizeProduct } from '@/lib/adapter';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';

export const revalidate = 300;

export default async function Page() {
  const supabase = serverSupabase();
  let live: ReturnType<typeof toUiProduct>[] = [];
  
  if (supabase) {
    const { data: rawProducts } = await supabase
      .from('raw_products')
      .select('id, data')
      .limit(100);

    if (rawProducts && rawProducts.length > 0) {
      const ids = rawProducts.map(p => p.id);

      const { data: historyData } = await supabase
        .from('raw_price_history')
        .select('id, data')
        .in('id', ids);

      const historyMap = new Map((historyData || []).map(h => [h.id, h.data]));

      const allNormalized = rawProducts.map(row => {
        const hist = historyMap.get(row.id) || null;
        return normalizeProduct(row.data, hist);
      });

      allNormalized.sort((a, b) => b.buy - a.buy);

      live = allNormalized.slice(0, 24).map(dbProd => toUiProduct(dbProd));
    }
  }
  
  return <Landing liveProducts={live} />;
}
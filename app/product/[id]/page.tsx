import { notFound } from 'next/navigation';
import ProductView from '@/views/Product';
import { PRODUCTS } from '@/data/products';
import { normalizeProduct } from '@/lib/adapter';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1) static showcase products are addressed by slug
  const staticProduct = PRODUCTS.find(p => p.slug === id);
  if (staticProduct) return <ProductView product={staticProduct} />;

  // 2) everything else is a Supabase row id
  const supabase = serverSupabase();
  if (!supabase) notFound();

  const { data: raw } = await supabase.from('raw_products').select('data').eq('id', id).single();
  if (!raw) notFound();

  const { data: hist } = await supabase.from('raw_price_history').select('data').ilike('id', `%${id}%`).limit(1).single();
  return <ProductView product={toUiProduct(normalizeProduct(raw.data, hist?.data ?? null))} />;
}

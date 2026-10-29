import { Suspense } from 'react';
import GrocerySearch from '@/views/GrocerySearch';
import { serverSupabase } from '@/lib/supabaseServer';

export const revalidate = 60;

function cleanGroceryName(name: string) {
  if (!name) return 'Unknown';
  let cleaned = name.toLowerCase();
  
  cleaned = cleaned.replace(/\b(\d+(?:\.\d+)?)\s*(g|kg|ml|l|pc|pcs|pack|bunch)\b/gi, '');
  cleaned = cleaned.replace(/\b(uae|india|china|usa|uk|imported|local|fresh|premium|organic|export|quality|box|razi|barakat|trade|smart|black|boy)\b/gi, '');
  cleaned = cleaned.replace(/[^a-z\s]/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  if (!cleaned) return 'Product';
  return cleaned.replace(/\b\w/g, c => c.toUpperCase());
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = serverSupabase();
  let categories: any[] = [];
  let products: any[] = [];

  if (supabase) {
    let query = supabase.from('grocery_products').select('*');

    if (q) {
      query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const [catsRes, prodsRes] = await Promise.all([
      supabase.from('grocery_categories').select('*').order('count', { ascending: false }),
      query.limit(200),
    ]);
    
    categories = catsRes.data || [];
    const rawProducts = prodsRes.data || [];

    const groupedMap = rawProducts.reduce((acc: any, p: any) => {
      const baseName = cleanGroceryName(p.name);
      const groupKey = `${p.category || 'misc'}_${baseName}`;

      if (!acc[groupKey]) {
        acc[groupKey] = { baseName, category: p.category, brand: p.brand, image_url: null, sizesMap: {} };
      }

      if (p.image_url && !acc[groupKey].image_url) {
        acc[groupKey].image_url = p.image_url;
      }

      const sizeKey = `${p.size_value || 1} ${p.size_unit || 'pc'}`.trim();
      if (!acc[groupKey].sizesMap[sizeKey]) {
        acc[groupKey].sizesMap[sizeKey] = [];
      }

      acc[groupKey].sizesMap[sizeKey].push(p);
      return acc;
    }, {});

    products = Object.values(groupedMap).map((group: any) => {
      const sizes = Object.keys(group.sizesMap).map(sizeKey => {
        const rawStores = group.sizesMap[sizeKey];
        
        const stores = rawStores.map((p: any) => ({
          id: p.id,
          name: p.retailer || 'Store',
          price: p.price,
          mrp: p.regular_price || p.price,
          url: p.product_url,
          inStock: p.in_stock !== false
        })).sort((a: any, b: any) => a.price - b.price); 

        return {
          sizeKey,
          size_value: rawStores[0].size_value || 1,
          size_unit: rawStores[0].size_unit || 'pc',
          stores
        };
      }).sort((a: any, b: any) => a.size_value - b.size_value); 

      return {
        id: sizes[0].stores[0].id,
        name: group.baseName,
        brand: group.brand,
        category: group.category,
        image_url: group.image_url,
        sizes
      };
    });
  }

  const safeCategories = JSON.parse(JSON.stringify(categories));
  const safeProducts = JSON.parse(JSON.stringify(products));

  return (
    <Suspense fallback={<div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>Loading shelves...</div>}>
      <GrocerySearch categories={safeCategories} initialProducts={safeProducts} />
    </Suspense>
  );
}
import { notFound } from 'next/navigation';
import ProductView from '@/views/Product';
import { normalizeProduct } from '@/lib/adapter';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';
import type { ProductSpec } from '@/types';

const parseMongoNum = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val.$numberDouble) return parseFloat(val.$numberDouble);
  if (val.$numberInt) return parseInt(val.$numberInt, 10);
  return parseFloat(val) || 0;
};

function buildRealSpec(rawJson: any, basePrice: number, buyScore: number, trustScore: number): ProductSpec {
  const rawFeatures = rawJson.attributes || rawJson.product_specification || rawJson.specifications || {};
  const features: Record<string, string> = {};
  
  let count = 0;
  for (const [key, value] of Object.entries(rawFeatures)) {
    if (count >= 10) break;
    if (typeof value === 'string' && value.trim().length > 0 && value.length < 60 && key !== 'Customer Reviews' && key !== 'Best Sellers Rank') {
      features[key] = value.trim();
      count++;
    }
  }

  return {
    id: rawJson._id || rawJson.product_id || 'unknown',
    name: rawJson.product_name || rawJson.title || 'Unknown Product',
    brand: rawJson.brand || 'Brand',
    image: rawJson.images?.[0] || rawJson.product_image || rawJson.main_image,
    price: basePrice,
    buy: buyScore,
    value: parseFloat((buyScore / 10).toFixed(1)),
    trust: trustScore,
    features
  };
}

function extractVariants(data: any) {
  const attrs = data.attributes || data.product_specification || data.specifications || {};
  const findKey = (keywords: string[]) => Object.keys(attrs).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
  
  const cKey = findKey(['color', 'colour']);
  const sKey = findKey(['storage', 'capacity', 'ram', 'hard disk', 'net content', 'volume', 'size']);
  
  const title = (data.product_name || data.title || '').toLowerCase();
  const tColor = title.match(/\b(silver|blue|black|white|gray|grey|gold|starlight|midnight|pink|red|green|purple|yellow|graphite|titanium)\b/i);
  const tStorage = title.match(/\b(\d+(?:gb|tb|ml|l|kg|g|oz))\b/i);
  
  let color = String((cKey ? attrs[cKey] : null) || (tColor ? tColor[0] : '')).trim();
  let storage = String((sKey ? attrs[sKey] : null) || (tStorage ? tStorage[0] : '')).trim();
  
  if (color.length > 20) color = '';
  if (storage.length > 20) storage = '';

  return { color, storage };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cleanId = decodeURIComponent(id);

  const supabase = serverSupabase();
  if (!supabase) notFound();

  const { data: raw } = await supabase.from('raw_products').select('data').eq('id', cleanId).single();
  if (!raw) notFound();

  const { data: hist } = await supabase.from('raw_price_history').select('data').ilike('id', `%${cleanId}%`).limit(1).single();

  const dbProduct = normalizeProduct(raw.data, hist?.data ?? null, cleanId);
  const uiProduct = toUiProduct(dbProduct);
  
  const actualPrice = parseMongoNum(raw.data.price || raw.data.sale_price || raw.data.selling_price || raw.data.current_price);
  const primaryRetailer = raw.data.site_name === 'amazon.ae' ? 'Amazon AE' : raw.data.site_name === 'sharafdg' ? 'Sharaf DG' : raw.data.site_name || 'Store';
                         
  let offers = [{ 
    retailer: primaryRetailer, 
    price: actualPrice, 
    delivery: 'View on store', 
    inStock: raw.data.in_stock !== false,
    url: raw.data.url || raw.data.product_url || raw.data.link || '#'
  }];

  const currVar = extractVariants(raw.data);
  const colorVariantsMap = new Map<string, {label: string, id: string}>();
  const storageVariantsMap = new Map<string, {label: string, id: string}>();

  const nameBase = (raw.data.product_name || raw.data.title || '').replace(/[^a-zA-Z0-9\s]/g, '');
  const searchMatch = nameBase.split(' ').slice(0, 3).join('%');

  if (searchMatch.length > 3) {
    const { data: compRaw } = await supabase
      .from('raw_products')
      .select('id, data')
      .neq('id', cleanId)
      .ilike('data->>brand', `%${raw.data.brand || ''}%`)
      .ilike('data->>product_name', `%${searchMatch}%`)
      .limit(50);

    if (compRaw) {
      compRaw.forEach(c => {
        const v = extractVariants(c.data);
        const cPrice = parseMongoNum(c.data.price || c.data.sale_price || c.data.selling_price || c.data.current_price);
        const cRet = c.data.site_name === 'amazon.ae' ? 'Amazon AE' : c.data.site_name === 'sharafdg' ? 'Sharaf DG' : c.data.site_name || 'Store';
        
        const isSameColor = currVar.color.toLowerCase() === v.color.toLowerCase();
        const isSameStorage = currVar.storage.toLowerCase() === v.storage.toLowerCase();
        
        if ((isSameColor || (!currVar.color && !v.color)) && (isSameStorage || (!currVar.storage && !v.storage))) {
          if (cPrice > 0) {
            offers.push({
              retailer: cRet,
              price: cPrice,
              delivery: 'View on store',
              inStock: c.data.in_stock !== false,
              url: c.data.url || c.data.product_url || c.data.link || '#'
            });
          }
        } else {
          if (v.color && v.color.toLowerCase() !== currVar.color.toLowerCase() && !colorVariantsMap.has(v.color.toLowerCase())) {
            colorVariantsMap.set(v.color.toLowerCase(), { label: v.color, id: c.id });
          }
          if (v.storage && v.storage.toLowerCase() !== currVar.storage.toLowerCase() && !storageVariantsMap.has(v.storage.toLowerCase())) {
            storageVariantsMap.set(v.storage.toLowerCase(), { label: v.storage, id: c.id });
          }
        }
      });
    }
  }

  const uniqueOffersMap = new Map();
  offers.forEach(o => {
    if (!uniqueOffersMap.has(o.retailer) || uniqueOffersMap.get(o.retailer).price > o.price) {
      uniqueOffersMap.set(o.retailer, o);
    }
  });
  const uniqueOffers = Array.from(uniqueOffersMap.values()).sort((a, b) => a.price - b.price);

  const colorVariants = Array.from(colorVariantsMap.values());
  const storageVariants = Array.from(storageVariantsMap.values());

  const { data: altRaw } = await supabase.from('raw_products').select('id, data').neq('id', cleanId).ilike('data->>brand', `%${raw.data.brand || ''}%`).limit(4);
  const alternatives = (altRaw || []).map(r => toUiProduct(normalizeProduct(r.data, null, r.id)));
  
  const baseSpec = buildRealSpec(raw.data, actualPrice, dbProduct.buy, parseInt(dbProduct.real) || 90);
  const availableSpecs = (altRaw || []).map(r => {
    const norm = normalizeProduct(r.data, null, r.id);
    return buildRealSpec(r.data, norm.numericPrice, norm.buy, parseInt(norm.real) || 90);
  });

  return (
    <ProductView
      product={uiProduct}
      currentColor={currVar.color}
      currentStorage={currVar.storage}
      colorVariants={colorVariants}
      storageVariants={storageVariants}
      specs={dbProduct.specs || []}
      offers={uniqueOffers}
      alternatives={alternatives}
      baseSpec={baseSpec}
      availableSpecs={availableSpecs}
    />
  );
}
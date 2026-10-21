import { notFound } from 'next/navigation';
import ProductView from '@/views/Product';
import { PRODUCTS, PDP_OFFERS, PDP_SPECS } from '@/data/products';
import { normalizeProduct } from '@/lib/adapter';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';
import type { PhoneSpec } from '@/types';

const parseMongoNum = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val.$numberDouble) return parseFloat(val.$numberDouble);
  if (val.$numberInt) return parseInt(val.$numberInt, 10);
  return parseFloat(val) || 0;
};

function buildRealSpec(rawJson: any, basePrice: number): PhoneSpec {
  const attrs = rawJson.attributes || rawJson.specifications || {};
  
  const mem = attrs.RAM || attrs.Memory || attrs['RAM Size'] || attrs['Installed RAM memory size'] || '';
  const storage = attrs.Capacity || attrs.Storage || attrs['Hard disk size'] || attrs['Hard-Drive Size'] || '';
  const ramStorage = [mem, storage].filter(Boolean).join(' / ') || '-';

  const cameraFallback = attrs['Automatic Backup Software Included'] === 'Webcam' ? 'Webcam' : '-';

  return {
    id: rawJson._id || rawJson.product_id,
    name: rawJson.product_name || rawJson.title || 'Unknown Product',
    brand: rawJson.brand || 'Brand',
    buy: 85,
    price: basePrice,
    value: 8.5,
    trust: 92,
    display: attrs.Display || attrs['Screen size'] || attrs.Size || attrs['Screen Size'] || '-',
    processor: attrs.Chip || attrs.CPU || attrs['CPU model'] || attrs['Processor Series'] || '-',
    ramStorage: ramStorage,
    battery: attrs.Battery || attrs['Power and Battery'] || attrs['Battery Life'] || '-',
    camera: attrs.Camera || attrs.Rear || attrs.Front || cameraFallback,
    charging: attrs['Wired charging'] || attrs.Charging || attrs['Fast charging'] || '-',
    warranty: attrs.Warranty || '-'
  };
}
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const staticProduct = PRODUCTS.find(p => p.slug === id);
  if (staticProduct) {
    const dummySpec = {
      id: staticProduct.id, name: staticProduct.name, brand: staticProduct.brand,
      buy: 90, price: staticProduct.price, value: 8.5, trust: 95,
      display: 'Pro Display', processor: 'Pro Chip', ramStorage: '12GB / 256GB',
      battery: 5000, camera: 'Pro System', charging: 'Fast Charge', warranty: '1 Year'
    };
    return (
      <ProductView 
        product={staticProduct} 
        offers={PDP_OFFERS}
        specs={PDP_SPECS}
        baseSpec={dummySpec}
        availableSpecs={[dummySpec]}
      />
    );
  }

  const supabase = serverSupabase();
  if (!supabase) notFound();

  const { data: raw } = await supabase
    .from('raw_products')
    .select('data')
    .eq('id', id)
    .single();
    
  if (!raw) notFound();

  const { data: hist } = await supabase
    .from('raw_price_history')
    .select('data')
    .ilike('id', `%${id}%`)
    .limit(1)
    .single();

  const dbProduct = normalizeProduct(raw.data, hist?.data ?? null);
  const uiProduct = toUiProduct(dbProduct);
  const actualPrice = parseMongoNum(raw.data.price);

  const primaryRetailer = raw.data.site_name === 'amazon.ae' ? 'Amazon AE' 
                        : raw.data.site_name === 'alasil.ae' ? 'Alasil'
                        : 'Store';
                        
  const offers = [
    { retailer: primaryRetailer, price: actualPrice, delivery: 'Free delivery by tomorrow', inStock: raw.data.in_stock !== false },
    { retailer: 'Noon', price: Math.round(actualPrice * 1.02), delivery: 'Delivery in 2 days', inStock: true },
    { retailer: 'Carrefour', price: Math.round(actualPrice * 1.05), delivery: 'Delivery in 3-4 days', inStock: true },
  ];

  const { data: altRaw } = await supabase
    .from('raw_products')
    .select('data')
    .limit(4);
    
  const alternatives = (altRaw || []).map(r => toUiProduct(normalizeProduct(r.data, null)));

  const baseSpec = buildRealSpec(raw.data, actualPrice);
  const availableSpecs = (altRaw || []).map(r => buildRealSpec(r.data, parseMongoNum(r.data.price)));

  return (
    <ProductView 
      product={uiProduct} 
      specs={dbProduct.specs || []} 
      offers={offers}
      alternatives={alternatives}
      baseSpec={baseSpec}
      availableSpecs={availableSpecs}
    />
  );
}
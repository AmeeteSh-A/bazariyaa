import { notFound } from 'next/navigation';
import ProductView from '@/views/Product';
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
    id: rawJson._id || rawJson.product_id || 'unknown',
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
  
  const cleanId = decodeURIComponent(id);

  const supabase = serverSupabase();
  if (!supabase) notFound();

  const { data: raw } = await supabase
    .from('raw_products')
    .select('data')
    .eq('id', cleanId)
    .single();
        
  if (!raw) notFound();

  const { data: hist } = await supabase
    .from('raw_price_history')
    .select('data')
    .ilike('id', `%${cleanId}%`)
    .limit(1)
    .single();

  // FIXED: Pass cleanId to force the adapter to use the clean Postgres ID
  const dbProduct = normalizeProduct(raw.data, hist?.data ?? null, cleanId);
  const uiProduct = toUiProduct(dbProduct);
  
  const actualPrice = parseMongoNum(raw.data.price || raw.data.sale_price || raw.data.selling_price || raw.data.current_price);
  const primaryRetailer = raw.data.site_name === 'amazon.ae' ? 'Amazon AE' : raw.data.site_name === 'sharafdg' ? 'Sharaf DG' : raw.data.site_name || 'Store';
                         
  let offers = [
    { 
      retailer: primaryRetailer, 
      price: actualPrice, 
      delivery: 'View on store', 
      inStock: raw.data.in_stock !== false,
      url: raw.data.url || raw.data.product_url || raw.data.link || '#'
    }
  ];

  const nameBase = (raw.data.product_name || raw.data.title || '').replace(/[^a-zA-Z0-9\s]/g, '');
  const searchMatch = nameBase.split(' ').slice(0, 3).join('%');

  if (searchMatch.length > 3) {
    const { data: compRaw } = await supabase
      .from('raw_products')
      .select('data')
      .neq('id', id)
      .ilike('data->>brand', `%${raw.data.brand || ''}%`)
      .ilike('data->>product_name', `%${searchMatch}%`)
      .limit(5);

    if (compRaw) {
      compRaw.forEach(c => {
        const cPrice = parseMongoNum(c.data.price || c.data.sale_price || c.data.selling_price || c.data.current_price);
        const cRet = c.data.site_name === 'amazon.ae' ? 'Amazon AE' : c.data.site_name === 'sharafdg' ? 'Sharaf DG' : c.data.site_name || 'Store';
        if (cPrice > 0) {
          offers.push({
            retailer: cRet,
            price: cPrice,
            delivery: 'View on store',
            inStock: c.data.in_stock !== false,
            url: c.data.url || c.data.product_url || c.data.link || '#'
          });
        }
      });
    }
  }

  const uniqueOffers = Array.from(new Map(offers.map(o => [o.retailer, o])).values());
  uniqueOffers.sort((a, b) => a.price - b.price);

  const { data: altRaw } = await supabase
    .from('raw_products')
    .select('id, data')
    .neq('id', id)
    .ilike('data->>brand', `%${raw.data.brand || ''}%`)
    .limit(4);
        
  const alternatives = (altRaw || []).map(r => toUiProduct(normalizeProduct(r.data, null, r.id)));
  const baseSpec = buildRealSpec(raw.data, actualPrice);
  const availableSpecs = (altRaw || []).map(r => buildRealSpec(r.data, parseMongoNum(r.data.price || r.data.sale_price || r.data.selling_price)));

  return (
    <ProductView
      product={uiProduct}
      specs={dbProduct.specs || []}
      offers={uniqueOffers}
      alternatives={alternatives}
      baseSpec={baseSpec}
      availableSpecs={availableSpecs}
    />
  );
}
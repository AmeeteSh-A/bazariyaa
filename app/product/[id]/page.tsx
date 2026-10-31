import { notFound } from 'next/navigation';
import ProductView from '@/views/Product';
import { normalizeProduct } from '@/lib/adapter';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';
import type { ProductSpec, RetailerOffer } from '@/types';

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

function extractLegacyVariants(data: any) {
  const attrs = data.attributes || data.product_specification || data.specifications || {};
  const findKey = (keywords: string[]) => Object.keys(attrs).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
  const title = (data.product_name || data.title || '').toLowerCase();
  const cleanTitle = title.replace(/\s+/g, '');
  const capacityGB = (val: string) => {
    const num = parseFloat(val);
    return val.toLowerCase().includes('tb') ? num * 1024 : num;
  };

  const cKey = findKey(['color', 'colour']);
  const tColor = title.match(/\b(silver|blue|black|white|gray|grey|gold|starlight|midnight|pink|red|green|purple|yellow|graphite|titanium)\b/i);
  let color = String((cKey ? attrs[cKey] : null) || (tColor ? tColor[0] : '')).trim().toLowerCase().replace(/[^a-z]/g, '');
  if (color === 'grey') color = 'gray';
  if (color.length > 20) color = '';

  let ram = '';
  let storage = '';
  const rKey = findKey(['ram', 'memory']);
  const sKey = findKey(['storage', 'capacity', 'rom', 'hard disk', 'internal memory']);
  let rawRam = String(rKey ? attrs[rKey] : '').trim().toLowerCase();
  let rawStorage = String(sKey ? attrs[sKey] : '').trim().toLowerCase();

  if (rawStorage.split(/,|\||\//).length > 2) rawStorage = '';
  if (rawRam.split(/,|\||\//).length > 2) rawRam = '';

  if (rawRam) {
    const rm = rawRam.match(/\b(\d+)\s*(gb|tb)\b/i);
    if (rm) ram = rm[0].replace(/\s+/g, '').toUpperCase();
  }
  if (rawStorage) {
    const sm = rawStorage.match(/\b(\d+)\s*(gb|tb)\b/i);
    if (sm) storage = sm[0].replace(/\s+/g, '').toUpperCase();
  }

  if (!ram || !storage) {
     const mems = title.match(/\b(\d+)\s*(gb|tb)\b/gi);
     if (mems) {
         const uniqueMems: string[] = Array.from(new Set(mems.map((m: string) => m.replace(/\s+/g, '').toUpperCase())));
         if (uniqueMems.length >= 2) {
             const sorted = uniqueMems.sort((a: string, b: string) => capacityGB(a) - capacityGB(b));
             if (!ram) ram = sorted[0];
             if (!storage) storage = sorted[sorted.length - 1];
         } else if (uniqueMems.length === 1) {
             const val = uniqueMems[0];
             if (!storage && !cleanTitle.includes(val.toLowerCase() + 'ram')) storage = val;
             else if (!ram) ram = val;
         }
     }
  }

  let size = '';
  const vKey = findKey(['volume', 'net content', 'size', 'weight']);
  let rawSize = String(vKey ? attrs[vKey] : '').trim().toLowerCase();
  if (!rawSize || rawSize === 'null') {
     const tSize = title.match(/\b(\d+)\s*(ml|l|kg|g|oz)\b/i);
     if (tSize) rawSize = tSize[0];
  }
  if (rawSize && rawSize !== 'null') {
     const zm = rawSize.match(/\b(\d+)\s*(ml|l|kg|g|oz)\b/i);
     if (zm) size = zm[0].replace(/\s+/g, '').toLowerCase();
  }

  return { color, ram, storage, size };
}

function extractCoupons(data: any) {
  if (Array.isArray(data.coupons)) {
    return data.coupons.map((c: any) => ({
      code: c.code || '',
      discount: c.discount || 'Offer',
      terms: c.terms || ''
    }));
  }
  if (Array.isArray(data.coupon_codes)) {
    return data.coupon_codes.map((c: any) => ({
      code: String(c),
      discount: 'Offer',
      terms: 'Apply at checkout'
    }));
  }
  return [];
}

function extractHighlights(data: any) {
  if (Array.isArray(data.highlights)) {
    return data.highlights.map(String);
  }
  if (data.highlights && typeof data.highlights === 'object') {
    const pills = Array.isArray(data.highlights.pills) ? data.highlights.pills : [];
    const features = Array.isArray(data.highlights.features) 
      ? data.highlights.features.map((x: any) => `${x.title}: ${x.detail}`) 
      : [];
    return [...pills, ...features];
  }
  return [];
}

function extractGroupedSpecs(data: any) {
  if (data.specification_categories && typeof data.specification_categories === 'object') {
    return Object.entries(data.specification_categories).map(([category, items]) => ({
      category,
      items: Object.entries(items as object).map(([k, v]) => [k, String(v)] as [string, string])
    }));
  }
  const flat = data.specifications || data.attributes;
  if (flat && typeof flat === 'object') {
    return [{
      category: 'General Specifications',
      items: Object.entries(flat).map(([k, v]) => [k, String(v)] as [string, string]).slice(0, 15)
    }];
  }
  return [];
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
  const primaryRetailer = raw.data.seller_name || raw.data.seller || (raw.data.site_name === 'amazon.ae' ? 'Amazon AE' : raw.data.site_name === 'sharafdg' ? 'Sharaf DG' : raw.data.site_name || 'Store');
                          
  let offers: RetailerOffer[] = [{ 
    retailer: primaryRetailer, 
    price: actualPrice, 
    delivery: raw.data.fulfillment_type || 'View on store', 
    inStock: raw.data.in_stock !== false,
    url: raw.data.url || raw.data.product_url || raw.data.link || '#'
  } as RetailerOffer & { url: string }];

  if (Array.isArray(raw.data.sellers)) {
    raw.data.sellers.forEach((s: any) => {
      if (s.seller_name && s.seller_name !== primaryRetailer) {
        offers.push({
          retailer: s.seller_name,
          price: parseMongoNum(s.price),
          delivery: s.fulfillment_type || 'Check store',
          inStock: true,
          url: raw.data.url || '#'
        } as RetailerOffer & { url: string });
      }
    });
  }

  const currVar = extractLegacyVariants(raw.data);
  const colorMap = new Map<string, {label: string, id: string}>();
  const ramMap = new Map<string, {label: string, id: string}>();
  const storageMap = new Map<string, {label: string, id: string}>();
  const sizeMap = new Map<string, {label: string, id: string}>();

  const nameBase = (raw.data.product_title || raw.data.product_name || raw.data.title || '').replace(/[^a-zA-Z0-9\s]/g, '');
  const searchMatch = nameBase.split(' ').slice(0, 3).join('%');
  const sku = raw.data.sku || '';

  if (searchMatch.length > 3 || sku.length > 3) {
    const query = supabase.from('raw_products').select('id, data').neq('id', cleanId).limit(50);
    
    if (sku) {
      query.or(`data->>sku.eq.${sku},data->>product_name.ilike.%${searchMatch}%,data->>title.ilike.%${searchMatch}%`);
    } else {
      query.or(`data->>product_name.ilike.%${searchMatch}%,data->>title.ilike.%${searchMatch}%`);
    }

    const { data: compRaw } = await query;

    if (compRaw) {
      compRaw.forEach(c => {
        const cPrice = parseMongoNum(c.data.price || c.data.sale_price || c.data.selling_price || c.data.current_price);
        const cRet = c.data.seller_name || c.data.seller || (c.data.site_name === 'amazon.ae' ? 'Amazon AE' : c.data.site_name === 'sharafdg' ? 'Sharaf DG' : c.data.site_name || 'Store');
        
        const isSkuMatch = sku && c.data.sku === sku;
        const isNameMatch = c.data.product_name === raw.data.product_name || c.data.title === raw.data.title;
        
        const v = extractLegacyVariants(c.data);
        const matchC = currVar.color === v.color || (!currVar.color && !v.color);
        const matchR = currVar.ram === v.ram || (!currVar.ram && !v.ram);
        const matchS = currVar.storage === v.storage || (!currVar.storage && !v.storage);
        const matchZ = currVar.size === v.size || (!currVar.size && !v.size);
        
        if (cPrice > 0 && (isSkuMatch || isNameMatch || (matchC && matchR && matchS && matchZ))) {
          offers.push({
            retailer: cRet, price: cPrice, delivery: c.data.fulfillment_type || 'View on store',
            inStock: c.data.in_stock !== false, url: c.data.url || c.data.product_url || c.data.link || '#'
          } as RetailerOffer & { url: string });
        } else {
          if (v.color && v.color !== currVar.color && !colorMap.has(v.color)) colorMap.set(v.color, { label: v.color, id: c.id });
          if (v.ram && v.ram !== currVar.ram && !ramMap.has(v.ram)) ramMap.set(v.ram, { label: v.ram, id: c.id });
          if (v.storage && v.storage !== currVar.storage && !storageMap.has(v.storage)) storageMap.set(v.storage, { label: v.storage, id: c.id });
          if (v.size && v.size !== currVar.size && !sizeMap.has(v.size)) sizeMap.set(v.size, { label: v.size, id: c.id });
        }
      });
    }
  }

  const uniqueOffersMap = new Map();
  offers.forEach((o: any) => {
    if (!uniqueOffersMap.has(o.retailer) || uniqueOffersMap.get(o.retailer).price > o.price) {
      uniqueOffersMap.set(o.retailer, o);
    }
  });
  const uniqueOffers = Array.from(uniqueOffersMap.values()).sort((a, b) => a.price - b.price);

  const { data: altRaw } = await supabase.from('raw_products').select('id, data').neq('id', cleanId).ilike('data->>brand', `%${raw.data.brand || ''}%`).limit(4);
  const alternatives = (altRaw || []).map(r => toUiProduct(normalizeProduct(r.data, null, r.id)));
  
  const baseSpec = buildRealSpec(raw.data, actualPrice, dbProduct.buy, parseInt(dbProduct.real) || 90);
  const availableSpecs = (altRaw || []).map(r => {
    const norm = normalizeProduct(r.data, null, r.id);
    return buildRealSpec(r.data, norm.numericPrice, norm.buy, parseInt(norm.real) || 90);
  });

  let finalVariantGroups: any[] = [];
  
  if (raw.data.variants && Array.isArray(raw.data.variants) && raw.data.variants.some((v: any) => v.group && v.value)) {
    const groups = new Map<string, any[]>();
    raw.data.variants.forEach((v: any) => {
      if (!v.group || !v.value) return;
      if (!groups.has(v.group)) groups.set(v.group, []);
      groups.get(v.group)!.push({
        id: v.variant_id || v.url || v.value,
        label: String(v.value),
        isActive: v.is_active === true,
        image: v.image || null
      });
    });
    finalVariantGroups = Array.from(groups.entries()).map(([group, options]) => ({ group, options }));
  } else {
    if (currVar.color || colorMap.size > 0) {
      finalVariantGroups.push({
        group: 'Colour',
        options: [
          ...(currVar.color ? [{ id: cleanId, label: currVar.color, isActive: true }] : []),
          ...Array.from(colorMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))
        ]
      });
    }
    if (currVar.ram || ramMap.size > 0) {
      finalVariantGroups.push({
        group: 'RAM',
        options: [
          ...(currVar.ram ? [{ id: cleanId, label: currVar.ram, isActive: true }] : []),
          ...Array.from(ramMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))
        ]
      });
    }
    if (currVar.storage || storageMap.size > 0) {
      finalVariantGroups.push({
        group: 'Storage',
        options: [
          ...(currVar.storage ? [{ id: cleanId, label: currVar.storage, isActive: true }] : []),
          ...Array.from(storageMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))
        ]
      });
    }
    if (currVar.size || sizeMap.size > 0) {
      finalVariantGroups.push({
        group: 'Size / Volume',
        options: [
          ...(currVar.size ? [{ id: cleanId, label: currVar.size, isActive: true }] : []),
          ...Array.from(sizeMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))
        ]
      });
    }
  }

  const coupons = extractCoupons(raw.data);
  const highlights = extractHighlights(raw.data);
  const groupedSpecs = extractGroupedSpecs(raw.data);

  return (
    <ProductView
      product={uiProduct}
      inStock={raw.data.in_stock !== false}
      offers={uniqueOffers}
      alternatives={alternatives}
      baseSpec={baseSpec}
      availableSpecs={availableSpecs}
      variantGroups={finalVariantGroups}
      coupons={coupons}
      highlights={highlights}
      groupedSpecs={groupedSpecs}
    />
  );
}
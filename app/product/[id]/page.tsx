import { notFound } from 'next/navigation';
import ProductView from '@/views/Product';
import { toUiProduct } from '@/lib/toUiProduct';
import { serverSupabase } from '@/lib/supabaseServer';
import type { ProductSpec, RetailerOffer } from '@/types';

function buildRealSpec(dbProd: any, uiProd: any): ProductSpec {
  const features: Record<string, string> = {};
  if (dbProd.attributes && typeof dbProd.attributes === 'object') {
    let count = 0;
    for (const [key, value] of Object.entries(dbProd.attributes)) {
      if (count >= 10) break;
      if (typeof value === 'string' && value.trim().length > 0 && value.length < 60) {
        features[key] = value.trim();
        count++;
      }
    }
  }
  return {
    id: dbProd.id,
    name: dbProd.name,
    brand: dbProd.brand,
    image: dbProd.image,
    price: uiProd.price,
    buy: uiProd.recommended,
    value: uiProd.value,
    trust: uiProd.trust,
    features
  };
}

// Ported legacy extraction logic exactly as requested
function extractLegacyVariants(attrs: any, title: string) {
  attrs = attrs || {};
  const findKey = (keywords: string[]) => Object.keys(attrs).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
  const cleanTitle = (title || '').replace(/\s+/g, '').toLowerCase();
  const capacityGB = (val: string) => {
    const num = parseFloat(val);
    return val.toLowerCase().includes('tb') ? num * 1024 : num;
  };

  const cKey = findKey(['color', 'colour']);
  const tColor = (title || '').match(/\b(silver|blue|black|white|gray|grey|gold|starlight|midnight|pink|red|green|purple|yellow|graphite|titanium)\b/i);
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
    const mems = (title || '').match(/\b(\d+)\s*(gb|tb)\b/gi);
    if (mems) {
      const uniqueMems = Array.from(new Set(mems.map(m => m.replace(/\s+/g, '').toUpperCase())));
      if (uniqueMems.length >= 2) {
        const sorted = uniqueMems.sort((a, b) => capacityGB(a) - capacityGB(b));
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
    const tSize = (title || '').match(/\b(\d+)\s*(ml|l|kg|g|oz)\b/i);
    if (tSize) rawSize = tSize[0];
  }
  if (rawSize && rawSize !== 'null') {
    const zm = rawSize.match(/\b(\d+)\s*(ml|l|kg|g|oz)\b/i);
    if (zm) size = zm[0].replace(/\s+/g, '').toLowerCase();
  }

  return { color, ram, storage, size };
}

function extractGroupedSpecs(attributes: any) {
  if (!attributes || typeof attributes !== 'object') return [];
  return [{
    category: 'General Specifications',
    items: Object.entries(attributes)
      .filter(([_, v]) => typeof v === 'string' && v.trim().length > 0)
      .map(([k, v]) => [k, String(v)] as [string, string])
      .slice(0, 15)
  }];
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cleanId = decodeURIComponent(id);
  const supabase = serverSupabase();
  if (!supabase) notFound();

  // 1. Fetch Core Product
  const { data: dbProduct } = await supabase.from('products').select('*').eq('id', cleanId).single();
  if (!dbProduct) notFound();

  const uiProduct = toUiProduct(dbProduct);
  const currVar = extractLegacyVariants(dbProduct.attributes, dbProduct.name);

  // 2. Fetch Aggregated Siblings & Offers (Your custom logic)
  const nameBase = (dbProduct.name || '').replace(/[^a-zA-Z0-9\s]/g, '');
  const searchMatch = nameBase.split(' ').filter(Boolean).slice(0, 3).join('%');
  
  let compRaw: any[] = [];
  if (searchMatch.length > 3) {
    const { data } = await supabase
      .from('products')
      .select('id, name, attributes, variants, price')
      .neq('id', cleanId)
      .ilike('name', `%${searchMatch}%`)
      .limit(50);
    if (data) compRaw = data;
  }

  const allIds = [cleanId, ...compRaw.map(c => c.id)];
  const { data: rawOffers } = await supabase.from('product_offers').select('*').in('product_id', allIds);

  const offers: RetailerOffer[] = [];
  const colorMap = new Map<string, {label: string, id: string}>();
  const ramMap = new Map<string, {label: string, id: string}>();
  const storageMap = new Map<string, {label: string, id: string}>();
  const sizeMap = new Map<string, {label: string, id: string}>();

  // Add current product's offers
  (rawOffers || []).filter(o => o.product_id === cleanId).forEach(o => {
    offers.push({
      retailer: o.retailer || 'Store', price: Number(o.price),
      delivery: o.delivery || 'View on store', inStock: o.in_stock !== false,
      url: o.url || '#'
    } as RetailerOffer & { url: string });
  });

  compRaw.forEach(c => {
    const isNameMatch = c.name === dbProduct.name;
    const v = extractLegacyVariants(c.attributes, c.name);
    const matchC = currVar.color === v.color || (!currVar.color && !v.color);
    const matchR = currVar.ram === v.ram || (!currVar.ram && !v.ram);
    const matchS = currVar.storage === v.storage || (!currVar.storage && !v.storage);
    const matchZ = currVar.size === v.size || (!currVar.size && !v.size);
    
    if (isNameMatch || (matchC && matchR && matchS && matchZ)) {
      (rawOffers || []).filter(o => o.product_id === c.id).forEach(o => {
        offers.push({
          retailer: o.retailer || 'Store', price: Number(o.price),
          delivery: o.delivery || 'View on store', inStock: o.in_stock !== false,
          url: o.url || '#'
        } as RetailerOffer & { url: string });
      });
    } else {
      if (v.color && v.color !== currVar.color && !colorMap.has(v.color)) colorMap.set(v.color, { label: v.color, id: c.id });
      if (v.ram && v.ram !== currVar.ram && !ramMap.has(v.ram)) ramMap.set(v.ram, { label: v.ram, id: c.id });
      if (v.storage && v.storage !== currVar.storage && !storageMap.has(v.storage)) storageMap.set(v.storage, { label: v.storage, id: c.id });
      if (v.size && v.size !== currVar.size && !sizeMap.has(v.size)) sizeMap.set(v.size, { label: v.size, id: c.id });
    }
  });

  const uniqueOffersMap = new Map();
  offers.forEach((o: any) => {
    if (!uniqueOffersMap.has(o.retailer) || uniqueOffersMap.get(o.retailer).price > o.price) {
      uniqueOffersMap.set(o.retailer, o);
    }
  });
  const uniqueOffers = Array.from(uniqueOffersMap.values()).sort((a, b) => a.price - b.price);

  let finalVariantGroups: any[] = [];
  if (Array.isArray(dbProduct.variants) && dbProduct.variants.some((v: any) => v.group && v.value)) {
    const groups = new Map<string, any[]>();
    dbProduct.variants.forEach((v: any) => {
      if (!v.group || !v.value) return;
      if (!groups.has(v.group)) groups.set(v.group, []);
      groups.get(v.group)!.push({
        id: v.variant_id || v.url || v.value, label: String(v.value),
        isActive: v.is_active === true, image: v.image || null
      });
    });
    finalVariantGroups = Array.from(groups.entries()).map(([group, options]) => ({ group, options }));
  } else {
    if (currVar.color || colorMap.size > 0) {
      finalVariantGroups.push({
        group: 'Colour',
        options: [...(currVar.color ? [{ id: cleanId, label: currVar.color, isActive: true }] : []), ...Array.from(colorMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))]
      });
    }
    if (currVar.ram || ramMap.size > 0) {
      finalVariantGroups.push({
        group: 'RAM',
        options: [...(currVar.ram ? [{ id: cleanId, label: currVar.ram, isActive: true }] : []), ...Array.from(ramMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))]
      });
    }
    if (currVar.storage || storageMap.size > 0) {
      finalVariantGroups.push({
        group: 'Storage',
        options: [...(currVar.storage ? [{ id: cleanId, label: currVar.storage, isActive: true }] : []), ...Array.from(storageMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))]
      });
    }
    if (currVar.size || sizeMap.size > 0) {
      finalVariantGroups.push({
        group: 'Size / Volume',
        options: [...(currVar.size ? [{ id: cleanId, label: currVar.size, isActive: true }] : []), ...Array.from(sizeMap.values()).map(v => ({ id: v.id, label: v.label, isActive: false }))]
      });
    }
  }

  const { data: altRaw } = await supabase.from('products').select('*').neq('id', cleanId).ilike('brand', `%${dbProduct.brand || ''}%`).eq('category', dbProduct.category).limit(4);
  const alternatives = (altRaw || []).map(r => toUiProduct(r));
  const baseSpec = buildRealSpec(dbProduct, uiProduct);
  const availableSpecs = (altRaw || []).map(r => buildRealSpec(r, toUiProduct(r)));
  
  const highlights = Array.isArray(dbProduct.highlights) ? dbProduct.highlights.map(String) : [];
  const groupedSpecs = extractGroupedSpecs(dbProduct.attributes);

  return (
    <ProductView
      product={uiProduct}
      inStock={uniqueOffers.some(o => o.inStock)}
      offers={uniqueOffers}
      alternatives={alternatives}
      baseSpec={baseSpec}
      availableSpecs={availableSpecs}
      variantGroups={finalVariantGroups}
      coupons={[]}
      highlights={highlights}
      groupedSpecs={groupedSpecs}
    />
  );
}
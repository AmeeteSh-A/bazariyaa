'use server';

import { serverSupabase } from '@/lib/supabaseServer';

export async function processSmartList(listText: string) {
  const supabase = serverSupabase();
  if (!supabase) return { error: 'No database connection' };

  const lines = listText.split('\n').map(l => l.trim()).filter(Boolean);
  const itemsToAdd: any[] = [];
  const summary: any[] = []; 

  for (const line of lines) {
    let searchQ = line;
    let targetQty = 1;
    let targetUnit = 'pc';

    const match = line.match(/(.*?)\s*((?:\d+(?:\.\d+)?)\s*(?:kg|g|l|ml|pc|pcs))$/i);
    
    if (match) {
      searchQ = match[1].trim();
      const qtyStr = match[2].toLowerCase();
      if (qtyStr.includes('kg')) { targetQty = parseFloat(qtyStr) * 1000; targetUnit = 'g'; }
      else if (qtyStr.includes('g')) { targetQty = parseFloat(qtyStr); targetUnit = 'g'; }
      else if (qtyStr.includes('l')) { targetQty = parseFloat(qtyStr) * 1000; targetUnit = 'ml'; }
      else if (qtyStr.includes('ml')) { targetQty = parseFloat(qtyStr); targetUnit = 'ml'; }
      else { targetQty = parseFloat(qtyStr); targetUnit = 'pc'; }
    }

    const { data } = await supabase.rpc('search_grocery', { search_q: searchQ });
    
    if (!data || !data.sections || data.sections.length === 0) {
      summary.push({ line, status: 'miss', msg: 'Item not found in any store' });
      continue;
    }

    const topProduct = data.sections[0];
    const topVariant = topProduct.variants[0];
    
    if (!topVariant || !topVariant.sizes || topVariant.sizes.length === 0) {
      summary.push({ line, status: 'miss', msg: 'Out of stock everywhere' });
      continue;
    }

    const validSizes = topVariant.sizes
      .filter((s: any) => {
        let u = s.size_unit.toLowerCase();
        if (u === 'kg') u = 'g';
        if (u === 'l') u = 'ml';
        return u === targetUnit || targetUnit === 'pc'; 
      })
      .map((s: any) => {
        let val = s.size_value;
        if (s.size_unit.toLowerCase() === 'kg') val *= 1000;
        if (s.size_unit.toLowerCase() === 'l') val *= 1000;
        return { ...s, normalizedVal: val };
      })
      .sort((a: any, b: any) => b.normalizedVal - a.normalizedVal);

    if (validSizes.length === 0) {
      summary.push({ line, status: 'miss', msg: `No ${targetUnit} sizes available` });
      continue;
    }

    const smallestAvailable = validSizes[validSizes.length - 1];
    const selectedSizes = [];

    if (targetQty <= smallestAvailable.normalizedVal) {
      selectedSizes.push(smallestAvailable);
      summary.push({ line, status: 'auto-adjusted', msg: `Substituted with ${smallestAvailable.sizeKey}` });
    } else {
      let remaining = targetQty;
      for (const size of validSizes) {
        while (remaining >= size.normalizedVal) {
          selectedSizes.push(size);
          remaining -= size.normalizedVal;
        }
      }
      if (remaining > 0) {
        selectedSizes.push(smallestAvailable);
      }
      summary.push({ line, status: 'success', msg: 'Added perfectly' });
    }

    selectedSizes.forEach(size => {
      const bestStore = size.stores[0];
      if (!bestStore) return;
      
      itemsToAdd.push({
        id: `${topProduct.key}-${topVariant.variant_label}-${size.sizeKey}-${bestStore.name}-${bestStore.price}`,
        title: topProduct.title,
        variantLabel: topVariant.variant_label,
        sizeLabel: size.sizeKey,
        price: bestStore.price,
        storeName: bestStore.name,
        storeUrl: bestStore.url,
        listingTitle: bestStore.listing_title,
        imageUrl: bestStore.image_url || topProduct.image_url,
        qty: 1
      });
    });
  }

  return { items: itemsToAdd, summary };
}
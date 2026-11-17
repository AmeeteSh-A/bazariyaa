'use server';

import { serverSupabase } from '@/lib/supabaseServer';
import { formatNormalizedUnit } from '@/utils/format';

const UNIT_MAP: Record<string, 'g' | 'ml' | 'pc'> = {
  kg: 'g', kilo: 'g', kilogram: 'g', kilograms: 'g', kgs: 'g',
  g: 'g', gm: 'g', grm: 'g', gram: 'g', grams: 'g',
  l: 'ml', lt: 'ml', ltr: 'ml', liter: 'ml', liters: 'ml', litre: 'ml',
  ml: 'ml', mili: 'ml', milliliter: 'ml',
  pc: 'pc', pcs: 'pc', piece: 'pc', pieces: 'pc', bunch: 'pc', box: 'pc', dozen: 'pc',
  packet: 'pc', pkt: 'pc', pouch: 'pc', bottle: 'pc', btl: 'pc', tin: 'pc', can: 'pc'
};

function getDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

export type CartOptimizationRequest = {
  key: string; 
  brand: string;
  sizeKey: string; 
  qty: number;
};

export async function optimizeBasket(
  items: CartOptimizationRequest[], 
  mode: 'cheapest_split' | 'single_vendor' = 'cheapest_split'
) {
  const supabase = serverSupabase();
  if (!supabase) return { error: 'No database connection' };

  const getDeliveryFee = (storeName: string) => {
    const fees: Record<string, number> = {
      'zepto': 15, 'blinkit': 12, 'instamart': 20, 'noon': 10
    };
    return fees[storeName.toLowerCase()] || 15;
  };

  const availableItems: Record<string, any[]> = {};
  
  for (const item of items) {
    const reqMatch = String(item.sizeKey).match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    let reqSizeValue = 1;
    let reqSizeUnit = 'pc';
    if (reqMatch) {
      reqSizeValue = parseFloat(reqMatch[1]);
      reqSizeUnit = reqMatch[2].toLowerCase();
    }
    const totalReqQty = reqSizeValue * item.qty;

    const { data } = await supabase.rpc('search_grocery', { search_q: item.key });
    if (!data || !data.sections) continue;

    const product = data.sections.find((s: any) => s.key === item.key);
    if (!product) continue;

    const variant = product.variants.find((v: any) => v.brand === item.brand) || product.variants[0];
    if (!variant) continue;

    const storeBestCost: Record<string, any> = {};

    variant.sizes.forEach((size: any) => {
      if (size.size_unit.toLowerCase() !== reqSizeUnit) return;

      size.stores.forEach((store: any) => {
        const packsNeeded = Math.ceil(totalReqQty / size.size_value);
        const totalFulfillmentCost = packsNeeded * store.price;

        if (!storeBestCost[store.name] || totalFulfillmentCost < storeBestCost[store.name].totalFulfillmentCost) {
          storeBestCost[store.name] = {
            totalFulfillmentCost,
            packsNeeded,
            size,
            store
          };
        }
      });
    });

    const itemHash = `${item.key}-${item.brand}-${item.sizeKey}`;
    availableItems[itemHash] = [];

    Object.values(storeBestCost).forEach((best: any) => {
      availableItems[itemHash].push({
        id: `${product.key}-${variant.variant_label}-${best.size.sizeKey}-${best.store.name}-${best.store.price}`,
        productKey: product.key,
        title: product.title,
        brand: variant.brand,
        variantLabel: variant.variant_label,
        sizeKey: best.size.sizeKey,
        sizeLabel: formatNormalizedUnit(best.size.size_value, best.size.size_unit),
        price: best.store.price,
        storeName: best.store.name,
        storeUrl: best.store.url,
        listingTitle: best.store.listing_title,
        imageUrl: best.store.image_url || product.image_url,
        qty: best.packsNeeded 
      });
    });
  }

  const storeTotals: Record<string, any> = {};
  
  Object.keys(availableItems).forEach(itemHash => {
    const options = availableItems[itemHash];
    
    options.forEach(opt => {
      if (!storeTotals[opt.storeName]) {
        storeTotals[opt.storeName] = { totalItems: 0, itemTotal: 0, totalPrice: getDeliveryFee(opt.storeName), items: [] };
      }
      storeTotals[opt.storeName].totalItems += 1;
      storeTotals[opt.storeName].itemTotal += (opt.price * opt.qty);
      storeTotals[opt.storeName].totalPrice += (opt.price * opt.qty);
      storeTotals[opt.storeName].items.push(opt);
    });
  });

  let fulfillingStore: any = null;
  let maxItems = -1;
  let minPrice = Infinity;

  Object.values(storeTotals).forEach(store => {
    if (store.totalItems > maxItems || (store.totalItems === maxItems && store.totalPrice < minPrice)) {
      maxItems = store.totalItems;
      minPrice = store.totalPrice;
      fulfillingStore = store;
    }
  });

  const cheapestCart: any[] = [];
  const usedStores = new Set<string>();
  let itemTotal = 0;
  let cheapestTotalItems = 0;

  Object.keys(availableItems).forEach(itemHash => {
    const options = availableItems[itemHash];
    if (options.length === 0) return;
    
    options.sort((a, b) => (a.price * a.qty) - (b.price * b.qty));
    const bestOpt = options[0];
    
    cheapestCart.push(bestOpt);
    usedStores.add(bestOpt.storeName);
    itemTotal += (bestOpt.price * bestOpt.qty);
    cheapestTotalItems += 1;
  });

  let totalDeliveryFee = 0;
  usedStores.forEach(store => {
    totalDeliveryFee += getDeliveryFee(store);
  });
  const cheapestTotal = itemTotal + totalDeliveryFee;

  if (mode === 'single_vendor') {
    return {
      optimizedCart: fulfillingStore ? fulfillingStore.items : [],
      summary: fulfillingStore ? `Found ${fulfillingStore.totalItems}/${items.length} items from a single store.` : 'Could not optimize.',
      totalPrice: fulfillingStore ? fulfillingStore.totalPrice : 0,
      deliveryFees: fulfillingStore ? getDeliveryFee(fulfillingStore.items[0].storeName) : 0
    };
  }

  const results: any[] = [];
  
  if (fulfillingStore) {
    results.push({
      id: 'fulfilling',
      items: fulfillingStore.items,
      found: fulfillingStore.totalItems,
      totalRequested: items.length,
      price: fulfillingStore.totalPrice,
      itemTotal: fulfillingStore.itemTotal,
      deliveryFees: getDeliveryFee(fulfillingStore.items[0].storeName),
      stores: [fulfillingStore.items[0].storeName]
    });
  }

  if (cheapestTotalItems > 0 && (cheapestTotalItems / items.length) >= 0.8) {
    const isActuallyBetter = !fulfillingStore || (cheapestTotal < fulfillingStore.totalPrice) || (cheapestTotalItems > fulfillingStore.totalItems);
    
    if (isActuallyBetter) {
      results.push({
        id: 'cheapest',
        items: cheapestCart,
        found: cheapestTotalItems,
        totalRequested: items.length,
        price: cheapestTotal,
        itemTotal: itemTotal,
        deliveryFees: totalDeliveryFee,
        stores: Array.from(usedStores)
      });
    }
  }

  return { options: results };
}

export async function processSmartList(listText: string) {
  const supabase = serverSupabase();
  if (!supabase) return { error: 'No database connection' };

  const lines = listText.split('\n').map(l => l.trim()).filter(Boolean);
  const itemsToAdd: any[] = [];
  const summary: any[] = [];
  const unitRegexStr = Object.keys(UNIT_MAP).join('|');

  const processLine = async (line: string) => {
    let searchQ = line;
    let targetQty = 1;
    let targetUnit: 'g' | 'ml' | 'pc' = 'pc';

    let match = line.match(new RegExp(`^(.*?)\\s+(?:-|of\\s)?\\s*((\\d+(?:\\.\\d+)?)\\s*(${unitRegexStr}))\\s*$`, 'i'));
    
    if (match) {
      searchQ = match[1].trim();
      let rawQty = parseFloat(match[3]);
      let rawUnit = match[4].toLowerCase();
      
      targetUnit = UNIT_MAP[rawUnit];
      if (['kg', 'kilo', 'kilogram', 'kilograms', 'kgs', 'l', 'lt', 'ltr', 'liter', 'liters', 'litre'].includes(rawUnit)) {
        rawQty *= 1000;
      }
      if (rawUnit === 'dozen') rawQty *= 12;
      targetQty = rawQty;
    } else {
      match = line.match(new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(${unitRegexStr})\\s+(?:of\\s)?(.*)$`, 'i'));
      if (match) {
        let rawQty = parseFloat(match[1]);
        let rawUnit = match[2].toLowerCase();
        searchQ = match[3].trim();
        
        targetUnit = UNIT_MAP[rawUnit];
        if (['kg', 'kilo', 'kilogram', 'kilograms', 'kgs', 'l', 'lt', 'ltr', 'liter', 'liters', 'litre'].includes(rawUnit)) {
          rawQty *= 1000;
        }
        if (rawUnit === 'dozen') rawQty *= 12;
        targetQty = rawQty;
      }
    }

    const { data } = await supabase.rpc('search_grocery', { search_q: searchQ });
    
    if (!data || !data.sections || data.sections.length === 0) {
      return { items: [], summaryItem: { line, status: 'miss', msg: 'Item not found in any store' } };
    }

    // Trust the database's fuzzy match for the base product (e.g. Apple)
    const topProduct = data.sections[0];
    const searchClean = searchQ.toLowerCase();
    const titleClean = topProduct.title.toLowerCase();

    // 1. Check if the base product is an EXACT word match (so "applee" fails and gets flagged as a typo)
    const baseExactRegex = new RegExp(`\\b${titleClean}s?\\b`, 'i');
    const isBaseExact = baseExactRegex.test(searchClean);

    // 2. Identify Brand
    let exactBrandVariant = null;
    let fuzzyBrandVariant = null;
    let genericVariant = topProduct.variants.find((v: any) => v.brand.toLowerCase() === 'generic' || v.brand.toLowerCase() === 'unknown') || topProduct.variants[0];

    // Isolate extra words to check for brands (strip noise and base title)
    const searchTokens = searchClean.split(/\s+/).filter(t => {
      if (['fresh', 'frozen', 'organic', 'raw', '-', 'of'].includes(t)) return false;
      // If the word is just a typo of the base product (e.g. "applee"), don't treat it as a brand
      const titleTokens = titleClean.split(/\s+/);
      for (const tt of titleTokens) {
        if (getDistance(t, tt) <= 2) return false;
      }
      return true;
    });

    const possibleBrandWords = searchTokens.join(' ').trim();

    for (const v of topProduct.variants) {
      const brand = v.brand.toLowerCase();
      if (brand === 'generic' || brand === 'unknown') continue;
      // Exact string match
      if (possibleBrandWords.includes(brand) || brand.includes(possibleBrandWords)) {
        exactBrandVariant = v;
        break;
      }
    }

    // If no exact match, mathematically check for typos (e.g. "rocket" -> "rockit")
    if (!exactBrandVariant && possibleBrandWords.length > 2) {
      for (const v of topProduct.variants) {
        const brand = v.brand.toLowerCase();
        if (brand === 'generic' || brand === 'unknown') continue;
        for (const token of searchTokens) {
          if (token.length > 2 && getDistance(token, brand) <= 2) {
            fuzzyBrandVariant = v;
            break;
          }
        }
        if (fuzzyBrandVariant) break;
      }
    }

    // Helper to generate line items
    const getVariantLineItems = (variant: any) => {
      if (!variant || !variant.sizes || variant.sizes.length === 0) return [];

      const normalizedDbSizes = variant.sizes.map((s: any) => {
        let u = s.size_unit.toLowerCase();
        let val = s.size_value;
        let mappedUnit = UNIT_MAP[u] || 'pc';
        if (['kg', 'l'].includes(u)) val *= 1000;
        return { ...s, normalizedVal: val, mappedUnit };
      });

      let validSizes = normalizedDbSizes.filter((s: any) => s.mappedUnit === targetUnit);
      if (validSizes.length === 0) validSizes = normalizedDbSizes;

      validSizes.sort((a: any, b: any) => b.normalizedVal - a.normalizedVal);
      const smallestAvailable = validSizes[validSizes.length - 1];
      const selectedSizes = [];

      let remaining = targetQty;
      if (targetQty <= smallestAvailable.normalizedVal) {
        selectedSizes.push(smallestAvailable);
      } else {
        for (const size of validSizes) {
          while (remaining >= size.normalizedVal) {
            selectedSizes.push(size);
            remaining -= size.normalizedVal;
          }
        }
        if (remaining > 0) selectedSizes.push(smallestAvailable);
      }

      const lineItemsToAdd: any[] = [];
      selectedSizes.forEach(size => {
        const bestStore = size.stores[0];
        if (!bestStore) return;
        lineItemsToAdd.push({
          id: `${topProduct.key}-${variant.variant_label}-${size.sizeKey}-${bestStore.name}-${bestStore.price}`,
          productKey: topProduct.key,
          sizeKey: size.sizeKey,
          title: topProduct.title,
          variantLabel: variant.variant_label,
          sizeLabel: formatNormalizedUnit(size.size_value, size.size_unit),
          price: bestStore.price,
          storeName: bestStore.name,
          storeUrl: bestStore.url,
          listingTitle: bestStore.listing_title,
          imageUrl: bestStore.image_url || topProduct.image_url,
          qty: 1
        });
      });
      return lineItemsToAdd;
    };

    // --- OUTCOME ROUTING ---

    // Case 1: Brand is a typo (e.g. "rocket" -> "rockit") -> Give 3 options
    if (!exactBrandVariant && fuzzyBrandVariant) {
        return {
           items: [],
           summaryItem: {
             line,
             status: 'suggestion',
             msg: `Did you mean ${fuzzyBrandVariant.brand} ${topProduct.title}?`,
             choices: [
               { label: `Add ${fuzzyBrandVariant.brand}`, items: getVariantLineItems(fuzzyBrandVariant) },
               { label: `Add Generic`, items: getVariantLineItems(genericVariant) }
             ]
           }
        };
    }

    // Case 2: They typed a brand we completely do not have (e.g. "Dole") -> Offer Generic
    if (!exactBrandVariant && !fuzzyBrandVariant && possibleBrandWords.length > 2) {
        return {
           items: [],
           summaryItem: {
             line,
             status: 'suggestion',
             msg: `Couldn't find brand "${possibleBrandWords}". Add Generic ${topProduct.title}?`,
             choices: [
               { label: `Add Generic`, items: getVariantLineItems(genericVariant) }
             ]
           }
        };
    }

    // Case 3: Base is wrong/fuzzy (e.g. "applee" or "rockit applee") -> Give 2 options (Yes / Discard)
    if (!isBaseExact) {
       const targetVariant = exactBrandVariant || genericVariant;
       const brandLabel = targetVariant.brand !== 'Generic' && targetVariant.brand !== 'Unknown' ? `${targetVariant.brand} ` : '';
       return {
          items: [],
          summaryItem: {
             line,
             status: 'suggestion',
             msg: `Did you mean ${brandLabel}${topProduct.title}?`,
             choices: [
               { label: `Yes, add it`, items: getVariantLineItems(targetVariant) }
             ]
          }
       };
    }

    // Case 4: Everything is exact (e.g. "apple" or "rockit apple") -> Silent Add
    const targetVariant = exactBrandVariant || genericVariant;
    return {
       items: getVariantLineItems(targetVariant),
       summaryItem: { line, status: 'success', msg: 'Added perfectly' }
    };
  };

  const results = await Promise.all(lines.map(line => processLine(line)));

  results.forEach(res => {
    if (res.items.length > 0) itemsToAdd.push(...res.items);
    summary.push(res.summaryItem);
  });

  return { items: itemsToAdd, summary };
}

export async function extractTextFromImage(base64Image: string) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { error: "Missing GROQ_API_KEY in environment." };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Extract the grocery list from this image. Return ONLY the items and their quantities, one per line. Do not include introductory text, markdown formatting, bullet points, or numbers at the start of the lines." 
              },
              { 
                type: "image_url", 
                image_url: { url: base64Image } 
              }
            ]
          }
        ],
        temperature: 0.1, 
        max_tokens: 512
      })
    });

    if (!response.ok) {
      console.error("Vision API Error:", await response.text());
      return { error: "Failed to read the image. The image might be too complex or blurry." };
    }

    const data = await response.json();
    return { text: data.choices[0].message.content.trim() };
    
  } catch (error: any) {
    console.error("OCR Exception:", error);
    return { error: "Network error while reading the image." };
  }
}
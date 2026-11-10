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

    const searchClean = searchQ.toLowerCase();
    const bestMatch = data.sections.find((s: any) => {
      const titleClean = s.title.toLowerCase();
      return titleClean.includes(searchClean) || searchClean.includes(titleClean);
    });

    if (!bestMatch) {
      const suggestedProduct = data.sections[0];
      const suggestedVariant = suggestedProduct.variants[0];
      const suggestedItemsToAdd: any[] = [];

      if (suggestedVariant && suggestedVariant.sizes && suggestedVariant.sizes.length > 0) {
        const s = suggestedVariant.sizes[0];
        const bestStore = s.stores[0];
        if (bestStore) {
          suggestedItemsToAdd.push({
            id: `${suggestedProduct.key}-${suggestedVariant.variant_label}-${s.sizeKey}-${bestStore.name}-${bestStore.price}`,
            title: suggestedProduct.title,
            variantLabel: suggestedVariant.variant_label,
            sizeLabel: formatNormalizedUnit(s.size_value, s.size_unit),
            price: bestStore.price,
            storeName: bestStore.name,
            storeUrl: bestStore.url,
            listingTitle: bestStore.listing_title,
            imageUrl: bestStore.image_url || suggestedProduct.image_url,
            qty: 1
          });
        }
      }

      return {
        items: [],
        summaryItem: {
          line,
          status: 'miss',
          msg: `Not found (Did you mean ${data.sections[0].title}?)`,
          suggestedItems: suggestedItemsToAdd
        }
      };
    }

    const topProduct = bestMatch;
    const topVariant = topProduct.variants[0];
    
    if (!topVariant || !topVariant.sizes || topVariant.sizes.length === 0) {
      return { items: [], summaryItem: { line, status: 'miss', msg: 'Out of stock everywhere' } };
    }

    const normalizedDbSizes = topVariant.sizes.map((s: any) => {
      let u = s.size_unit.toLowerCase();
      let val = s.size_value;
      let mappedUnit = UNIT_MAP[u] || 'pc';
      
      if (['kg', 'l'].includes(u)) val *= 1000;
      return { ...s, normalizedVal: val, mappedUnit };
    });

    let validSizes = normalizedDbSizes.filter((s: any) => s.mappedUnit === targetUnit);
    let status = 'success';
    let msg = 'Added perfectly';

    if (validSizes.length === 0) {
      validSizes = normalizedDbSizes;
      targetQty = 1;
      status = 'auto-adjusted';
      msg = `Unit mismatch. Added 1 ${formatNormalizedUnit(validSizes[0].size_value, validSizes[0].size_unit)} instead.`;
    }

    validSizes.sort((a: any, b: any) => b.normalizedVal - a.normalizedVal);
    const smallestAvailable = validSizes[validSizes.length - 1];
    const selectedSizes = [];

    if (targetQty <= smallestAvailable.normalizedVal) {
      selectedSizes.push(smallestAvailable);
      if (targetQty < smallestAvailable.normalizedVal) {
        status = 'auto-adjusted';
        msg = `Substituted with smallest available (${formatNormalizedUnit(smallestAvailable.size_value, smallestAvailable.size_unit)})`;
      }
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
        status = 'auto-adjusted';
        msg = `Combined sizes to approximate requested quantity.`;
      }
    }

    const lineItemsToAdd: any[] = [];
    selectedSizes.forEach(size => {
      const bestStore = size.stores[0];
      if (!bestStore) return;
      
      lineItemsToAdd.push({
        id: `${topProduct.key}-${topVariant.variant_label}-${size.sizeKey}-${bestStore.name}-${bestStore.price}`,
        title: topProduct.title,
        variantLabel: topVariant.variant_label,
        sizeLabel: formatNormalizedUnit(size.size_value, size.size_unit),
        price: bestStore.price,
        storeName: bestStore.name,
        storeUrl: bestStore.url,
        listingTitle: bestStore.listing_title,
        imageUrl: bestStore.image_url || topProduct.image_url,
        qty: 1
      });
    });

    return {
      items: lineItemsToAdd,
      summaryItem: { line, status, msg }
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
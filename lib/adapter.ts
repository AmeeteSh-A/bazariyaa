export type Product = {
  id: string;
  buy: number;
  tag: string;
  cat: string;
  name: string;
  rating: number;
  reviews: string;
  real: string;
  price: string;
  numericPrice: number;
  was?: string;
  trend?: "down" | "up" | "flat";
  trendPct: number; // Added to handle real percentages
  cta: "compare-on" | "compare-off" | "view";
  images: string[];
  specs: [string, string][];
  history: { date: string; price: number }[];
};

function parseBsonNumber(val: any): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === 'object') {
    if (val.$numberDouble !== undefined) return parseFloat(val.$numberDouble);
    if (val.$numberInt !== undefined) return parseInt(val.$numberInt, 10);
    if (val.$numberDecimal !== undefined) return parseFloat(val.$numberDecimal);
  }
  return 0;
}

export function normalizeAmazonData(raw: any, historyDoc: any): Product {
  // Aggressively hunt for the price across multiple possible scraper keys
  const rawPrice = raw.price ?? raw.selling_price ?? raw.sale_price ?? raw.current_price ?? raw.selected_variant?.price;
  const priceVal = parseBsonNumber(rawPrice);
  
  const rawMrp = raw.msrp ?? raw.original_price ?? raw.regular_price ?? raw.was_price;
  const msrpVal = parseBsonNumber(rawMrp);
  
  const rawHistory = historyDoc?.history || [];
  // Filter out bad history points where price is 0
  const historyPrices = rawHistory.map((h: any) => parseBsonNumber(h.price)).filter((p: number) => p > 0);
  const lastPrice = historyPrices.length > 0 ? historyPrices[historyPrices.length - 1] : priceVal;
  
  let trend: "up" | "down" | "flat" = "flat";
  let trendPct = 0;
  
  // Calculate real trend percentage
  if (lastPrice > 0 && priceVal !== lastPrice) {
    trendPct = Math.round(((priceVal - lastPrice) / lastPrice) * 100);
    if (trendPct > 0) trend = "up";
    if (trendPct < 0) trend = "down";
  }

  let rating = 0;
  const ratingMatch = raw.attributes?.['Customer Reviews']?.match(/([\d.]+)\s+out of/);
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1]);
  } else if (raw.rating) {
    rating = parseFloat(raw.rating);
  }
  if (isNaN(rating)) rating = 0;
  
  let reviews = "0";
  const reviewsMatch = raw.attributes?.['Customer Reviews']?.match(/\(([\d,]+)\)/);
  if (reviewsMatch) {
    reviews = reviewsMatch[1];
  } else if (raw.reviews) {
    reviews = String(raw.reviews);
  }

  const discount = msrpVal > priceVal ? ((msrpVal - priceVal) / msrpVal) * 100 : 0;
  const buyScore = Math.min(99, Math.max(70, Math.round(75 + (rating * 3.5) + (discount * 0.2))));
  
  const parsedReviews = parseInt(reviews.replace(/,/g, '')) || 0;
  const realScore = parsedReviews > 100 ? 95 : (parsedReviews > 10 ? 85 : 75);

  const cat = raw.categories?.[1]?.name || "Uncategorized";
  const id = raw._id?.$oid || raw._id || raw.id || raw.product_id;

  const specs = Object.entries(raw.attributes || {})
    .filter(([key]) => key !== 'Customer Reviews' && key !== 'Best Sellers Rank')
    .slice(0, 12) as [string, string][];

  const history = rawHistory.map((h: any) => ({
    date: h.timestamp?.$date || h.timestamp || new Date().toISOString(),
    price: parseBsonNumber(h.price)
  }));

  let imgList: string[] = [];
  if (Array.isArray(raw.images)) {
    imgList = raw.images.map((img: any) => typeof img === 'string' ? img : img.link).filter(Boolean);
  } else if (raw.main_image) {
    imgList = [raw.main_image];
  }

  return {
    id: String(id),
    buy: buyScore,
    tag: cat.toUpperCase(),
    cat: cat,
    name: raw.product_title || raw.title || "Unknown Product",
    rating: rating,
    reviews: reviews,
    real: `${realScore}%`,
    price: `${raw.currency_code || 'AED'} ${priceVal}`,
    numericPrice: priceVal,
    was: msrpVal > 0 ? `${raw.currency_code || 'AED'} ${msrpVal}` : undefined,
    trend: trend,
    trendPct: Math.abs(trendPct), // Send the absolute percentage to the UI
    cta: "view",
    images: imgList,
    specs: specs,
    history: history
  };
}

export function normalizeSharafDGData(raw: any, historyDoc: any): Product {
  const rawPrice = raw.sale_price ?? raw.price ?? raw.selling_price;
  const priceVal = parseBsonNumber(rawPrice);
  const rawMrp = raw.msrp ?? raw.original_price ?? raw.was_price;
  const msrpVal = parseBsonNumber(rawMrp);
  
  const rawHistory = historyDoc?.history || [];
  const historyPrices = rawHistory.map((h: any) => parseBsonNumber(h.price)).filter((p: number) => p > 0);
  const lastPrice = historyPrices.length > 0 ? historyPrices[historyPrices.length - 1] : priceVal;
  
  let trend: "up" | "down" | "flat" = "flat";
  let trendPct = 0;

  if (lastPrice > 0 && priceVal !== lastPrice) {
    trendPct = Math.round(((priceVal - lastPrice) / lastPrice) * 100);
    if (trendPct > 0) trend = "up";
    if (trendPct < 0) trend = "down";
  }

  let rating = parseFloat(raw.average_rating);
  if (isNaN(rating)) rating = 0;
  
  const reviews = raw.number_of_reviews?.toString() || "0";

  const discount = msrpVal > priceVal ? ((msrpVal - priceVal) / msrpVal) * 100 : 0;
  const buyScore = Math.min(99, Math.max(70, Math.round(75 + (rating * 3.5) + (discount * 0.2))));
  
  const parsedReviews = parseInt(reviews.replace(/,/g, '')) || 0;
  const realScore = parsedReviews > 100 ? 95 : (parsedReviews > 10 ? 85 : 75);

  const cat = raw.category2 || raw.category || "Uncategorized";
  const id = raw._id?.$oid || raw._id || raw.id || raw.product_id;

  const specs = Object.entries(raw.product_specification || {}).slice(0, 12) as [string, string][];

  const history = rawHistory.map((h: any) => ({
    date: h.timestamp?.$date || h.timestamp || new Date().toISOString(),
    price: parseBsonNumber(h.price)
  }));

  return {
    id: String(id),
    buy: buyScore,
    tag: cat.toUpperCase(),
    cat: cat,
    name: raw.product_title || raw.title || "Unknown Product",
    rating: rating,
    reviews: reviews,
    real: `${realScore}%`,
    price: `${raw.currency || 'AED'} ${priceVal}`,
    numericPrice: priceVal,
    was: msrpVal > 0 ? `${raw.currency || 'AED'} ${msrpVal}` : undefined,
    trend: trend,
    trendPct: Math.abs(trendPct),
    cta: "view",
    images: raw.images || (raw.product_image ? [raw.product_image] : []),
    specs: specs,
    history: history
  };
}

export function normalizeProduct(raw: any, historyDoc: any): Product {
  if (raw.site_name === 'amazon.ae' || raw.url?.includes('amazon')) {
    return normalizeAmazonData(raw, historyDoc);
  }
  if (raw.site_name === 'sharafdg' || raw.url?.includes('sharafdg')) {
    return normalizeSharafDGData(raw, historyDoc);
  }
  return normalizeAmazonData(raw, historyDoc);
}
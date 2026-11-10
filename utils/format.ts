import type { Unit } from '@/types';
export const inr = (n: number): string => 'AED ' + Math.round(n).toLocaleString('en-AE');

export const money = (n: number, currency: string = 'AED'): string =>
  currency === 'AED' ? inr(n) : currency + ' ' + Math.round(n).toLocaleString('en-AE');

export const discountPct = (price: number, mrp: number): number =>
  mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

export function formatNormalizedUnit(value: number, baseUnit: string): string {
  const u = baseUnit.toLowerCase();
  
  if (['g', 'gm', 'gram'].includes(u)) {
    if (value >= 1000 && value % 1000 === 0) {
      return `${value / 1000}kg`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2).replace(/\.00$/, '')}kg`;
    }
    return `${value}g`;
  }

  if (['ml', 'mili'].includes(u)) {
    if (value >= 1000 && value % 1000 === 0) {
      return `${value / 1000}L`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2).replace(/\.00$/, '')}L`;
    }
    return `${value}ml`;
  }

  if (['pc', 'pcs', 'piece'].includes(u)) {
    if (value % 12 === 0) {
      const dozens = value / 12;
      return dozens === 1 ? '1 dozen' : `${dozens} dozens`;
    }
    return `${value} pc`;
  }

  return `${value} ${baseUnit}`;
}

export function unitPrice(price: number, size: number, unit: Unit): { value: number; label: string; short: string } {
  switch (unit) {
    case 'L': {
      const v = price / (size * 10);
      return { value: v, label: 'AED ' + v.toFixed(2) + ' / 100ml', short: 'AED ' + (price / (size * 1000)).toFixed(2) + '/ml' };
    }
    case 'ml': {
      const v = price / (size / 100);
      return { value: v, label: 'AED ' + v.toFixed(2) + ' / 100ml', short: 'AED ' + (price / size).toFixed(2) + '/ml' };
    }
    case 'kg': {
      const v = price / (size * 10);
      return { value: v, label: 'AED ' + v.toFixed(2) + ' / 100g', short: 'AED ' + Math.round(price / size) + '/kg' };
    }
    case 'g': {
      const v = price / (size / 100);
      return { value: v, label: 'AED ' + v.toFixed(2) + ' / 100g', short: 'AED ' + (price / size).toFixed(2) + '/g' };
    }
    default: {
      const v = price / size;
      return { value: v, label: 'AED ' + v.toFixed(2) + ' / pc', short: 'AED ' + Math.round(v) + '/pc' };
    }
  }
}

export function sparkPoints(values: number[], w: number, h: number, pad = 3): string {
  if (values.length < 2) values = [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => (pad + i * step).toFixed(1) + ',' + (pad + (1 - (v - min) / span) * (h - pad * 2)).toFixed(1))
    .join(' ');
}

export const cx = (...c: Array<string | false | null | undefined>): string => c.filter(Boolean).join(' ');
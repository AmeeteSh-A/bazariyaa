export type ParsedQuery = {
  original: string;
  normalizedQuery: string;
};

export function parseQuery(rawQuery: string): ParsedQuery {
  const original = rawQuery.trim();
  
  const normalizedQuery = original
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    original,
    normalizedQuery,
  };
}
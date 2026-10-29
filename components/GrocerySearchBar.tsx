'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GrocerySearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 1) {
      router.push(`/grocery/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 500 }}>
      <input
        type="search"
        placeholder="Search daily essentials, snacks, beverages..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input"
        style={{ flex: 1, padding: '10px 16px', borderRadius: 20, border: '1px solid var(--divider)' }}
      />
      <button 
        type="submit" 
        className="btn btn--primary" 
        style={{ borderRadius: 20, padding: '0 20px' }}
      >
        Search
      </button>
    </form>
  );
}
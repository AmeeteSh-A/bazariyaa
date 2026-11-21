'use client';

import SearchBar from './SearchBar';

export function GrocerySearchBar() {
  return (
    <div style={{ width: '100%', maxWidth: 500 }}>
      <SearchBar
        variant="grocery"
        size="sm"
        placeholder="Search daily essentials, snacks, beverages..."
      />
    </div>
  );
}
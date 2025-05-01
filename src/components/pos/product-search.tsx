"use client";

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  onSearch: (term: string) => void;
}

export function ProductSearch({ onSearch }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder="ابحث عن منتج بالاسم العربي أو الإنجليزي..."
        className="pl-10 pr-4 py-2 w-full" // Adjusted padding for RTL icon
        value={searchTerm}
        onChange={handleSearchChange}
        aria-label="Search Products"
      />
    </div>
  );
}

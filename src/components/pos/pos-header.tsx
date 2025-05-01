import * as React from 'react';
import { CartSummary } from './cart-summary';
import { Package } from 'lucide-react'; // Pharmacy icon

export function PosHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background shadow-sm">
      <div className="flex items-center gap-3">
        <Package className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold text-primary">صيدليتي - POS</h1>
      </div>
      <CartSummary />
    </header>
  );
}

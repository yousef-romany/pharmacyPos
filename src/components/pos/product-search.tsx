
"use client";

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Barcode } from 'lucide-react'; // Import Barcode icon

interface ProductSearchProps {
  onSearch: (term: string) => void;
  onBarcodeScan: (barcode: string) => void; // Callback for barcode handling
  inputRef?: React.RefObject<HTMLInputElement>; // Optional ref for external control
}

const ProductSearch = React.forwardRef<HTMLInputElement, ProductSearchProps>(
  ({ onSearch, onBarcodeScan, inputRef }, forwardedRef) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [barcodeTerm, setBarcodeTerm] = React.useState('');
    const barcodeInputRef = React.useRef<HTMLInputElement>(null);
    const internalSearchInputRef = React.useRef<HTMLInputElement>(null);

    // Forward the search input ref
    React.useImperativeHandle(forwardedRef, () => internalSearchInputRef.current as HTMLInputElement);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value;
      setSearchTerm(term);
      onSearch(term); // Trigger name/ID search
    };

    const handleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       setBarcodeTerm(event.target.value);
       // Optional: Trigger scan on enter or specific length?
       // For now, we trigger on blur or explicit button/enter press.
    };

     const handleBarcodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
       if (event.key === 'Enter' && barcodeTerm.trim()) {
           event.preventDefault(); // Prevent default form submission if inside a form
           onBarcodeScan(barcodeTerm.trim());
           setBarcodeTerm(''); // Clear after scan
       }
     };

     const handleBarcodeBlur = () => {
        // Scan on blur if input is not empty
        if (barcodeTerm.trim()) {
            onBarcodeScan(barcodeTerm.trim());
            setBarcodeTerm(''); // Clear after scan
        }
         // Optional: Re-focus after a short delay to allow potential toast messages etc.
         // setTimeout(() => barcodeInputRef.current?.focus(), 100);
     };

    // Effect to focus on barcode input on component mount
     React.useEffect(() => {
       barcodeInputRef.current?.focus();
     }, []);


    return (
      <div className="flex flex-col sm:flex-row gap-4">
          {/* Barcode Input */}
           <div className="relative flex-1 sm:flex-none sm:w-64">
             <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
             <Input
              ref={barcodeInputRef}
              type="text" // Use text, scanner might input various characters
              placeholder="امسح الباركود هنا أو أدخله..."
              className="pl-10 pr-4 py-2 w-full" // Adjust padding for icon
              value={barcodeTerm}
              onChange={handleBarcodeChange}
              onKeyDown={handleBarcodeKeyDown} // Handle Enter key
              onBlur={handleBarcodeBlur} // Handle blur event
              aria-label="Scan Barcode or Enter ID"
             />
          </div>

         {/* Product Name/ID Search Input */}
         <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
             ref={internalSearchInputRef}
             type="search"
             placeholder="أو ابحث بالاسم العربي/الإنجليزي/الكود..."
             className="pl-10 pr-4 py-2 w-full" // Adjust padding for icon
             value={searchTerm}
             onChange={handleSearchChange}
             aria-label="Search Products by Name/ID"
          />
         </div>
      </div>
    );
  }
);

ProductSearch.displayName = 'ProductSearch';

export { ProductSearch };

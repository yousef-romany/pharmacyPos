export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  categoryIcon?: React.ComponentType<{ className?: string }>; // Optional icon component
}

export interface CartItem extends Product {
  cartQuantity: number;
}

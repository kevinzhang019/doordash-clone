export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  description: string;
  image_url: string;
  rating: number;
  delivery_fee: number;
  delivery_min: number;
  delivery_max: number;
  address: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: number;
}

export interface CartItem {
  id: number;
  user_id: number;
  restaurant_id: number;
  menu_item_id: number;
  quantity: number;
  // Joined fields
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  restaurant_name?: string;
}

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  status: string;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  placed_at: string;
  restaurant_name?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

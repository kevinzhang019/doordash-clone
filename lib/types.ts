export type UserRole = 'customer' | 'restaurant' | 'driver';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
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
  lat: number | null;
  lng: number | null;
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
  allow_special_requests: number;
}

export interface MenuItemAddon {
  id: number;
  menu_item_id: number;
  name: string;
  price: number;
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
  tip: number;
  total: number;
  placed_at: string;
  driver_user_id?: number | null;
  restaurant_name?: string;
}

export interface Review {
  id: number;
  user_id: number | null;
  restaurant_id: number;
  order_id: number | null;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface RestaurantOwner {
  id: number;
  user_id: number;
  restaurant_id: number;
}

export interface RestaurantHours {
  id: number;
  restaurant_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: number;
}

export interface DriverJob {
  id: string;
  isSimulated: boolean;
  orderId?: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantCoords: { lat: number; lng: number };
  deliveryAddress: string;
  customerCoords: { lat: number; lng: number };
  items: string[];
  payAmount: number;
  tip: number;
}

export interface DriverSession {
  id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  total_earnings: number;
  deliveries_completed: number;
}

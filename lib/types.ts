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
  is_accepting_orders: number;
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

export interface MenuItemOptionGroup {
  id: number;
  menu_item_id: number;
  name: string;
  required: number;
  max_selections: number | null;
  sort_order: number;
  options?: MenuItemOption[];
}

export interface MenuItemOption {
  id: number;
  group_id: number;
  name: string;
  price_modifier: number;
  sort_order: number;
}

export interface CartItemSelection {
  id: number;
  cart_item_id: number;
  option_id: number | null;
  name: string;
  price_modifier: number;
}

export interface OrderItemSelection {
  id: number;
  order_item_id: number;
  option_id: number | null;
  name: string;
  price_modifier: number;
}

export interface AnalyticsData {
  period: string;
  revenue_chart: { label: string; revenue: number; orders: number }[];
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  top_items_by_qty: { name: string; total_qty: number }[];
  top_items_by_revenue: { name: string; total_revenue: number }[];
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
  selections?: CartItemSelection[];
  effective_price?: number;
  special_requests?: string | null;
}

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'picked_up' | 'delivered';

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  status: OrderStatus | string;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  tip: number;
  total: number;
  placed_at: string;
  driver_user_id?: number | null;
  dispatched_to?: number | null;
  restaurant_name?: string;
  driver_name?: string;
  delivery_min?: number;
  delivery_max?: number;
}

export interface Message {
  id: number;
  order_id: number;
  sender_user_id: number;
  sender_role: 'customer' | 'driver';
  content: string;
  sent_at: string;
  sender_name?: string;
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
  estimatedMinutes: number;
  totalMiles: number;
}

export interface DriverSession {
  id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  total_earnings: number;
  deliveries_completed: number;
}

export interface Deal {
  id: number;
  restaurant_id: number;
  menu_item_id: number;
  deal_type: 'percentage_off' | 'bogo';
  discount_value: number | null;
  is_active: number;
  created_at: string;
  // Joined fields
  restaurant_name?: string;
  restaurant_image_url?: string;
  menu_item_name?: string;
  menu_item_price?: number;
}

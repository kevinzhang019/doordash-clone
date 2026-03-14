import getDb from '@/db/database';

export async function GET() {
  const db = getDb();
  const deals = db.prepare(`
    SELECT d.id, d.restaurant_id, d.menu_item_id, d.deal_type, d.discount_value, d.is_active, d.created_at,
      r.name as restaurant_name, r.image_url as restaurant_image_url,
      m.name as menu_item_name, m.price as menu_item_price
    FROM deals d
    JOIN restaurants r ON r.id = d.restaurant_id
    JOIN menu_items m ON m.id = d.menu_item_id
    WHERE d.is_active = 1
    ORDER BY d.created_at DESC
  `).all();
  return Response.json({ deals });
}

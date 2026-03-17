import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Public endpoint — no auth required
export async function GET(_request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: groups, error: groupsError } = await supabase
    .from('menu_item_option_groups')
    .select('*')
    .eq('menu_item_id', parseInt(itemId))
    .order('sort_order')
    .order('id');

  if (groupsError) {
    console.error('Get option groups error:', groupsError);
    return Response.json({ groups: [] });
  }

  if (!groups || groups.length === 0) {
    return Response.json({ groups: [] });
  }

  const groupIds = groups.map(g => g.id);
  const { data: options, error: optionsError } = await supabase
    .from('menu_item_options')
    .select('*')
    .in('group_id', groupIds)
    .order('sort_order')
    .order('id');

  if (optionsError) {
    console.error('Get options error:', optionsError);
    return Response.json({ groups: groups.map(g => ({ ...g, options: [] })) });
  }

  const grouped = groups.map(g => ({
    ...g,
    options: (options || []).filter(o => o.group_id === g.id),
  }));

  return Response.json({ groups: grouped });
}

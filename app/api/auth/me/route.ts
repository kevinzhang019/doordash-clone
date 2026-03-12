import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ user: null });
    }
    return Response.json({ user: { id: session.userId, email: session.email, name: session.name } });
  } catch (error) {
    console.error('Me error:', error);
    return Response.json({ user: null });
  }
}

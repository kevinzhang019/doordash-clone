export async function POST() {
  // Session tokens are stored in per-tab sessionStorage, not cookies.
  // The client clears its own sessionStorage on logout.
  return Response.json({ success: true });
}

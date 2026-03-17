import type { UserRole } from '@/lib/types';

/**
 * Determines which role owns a given API URL path.
 * Mirrors the proxy's roleForPath logic.
 */
function roleForUrl(url: string): UserRole | null {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    if (pathname.startsWith('/api/driver') && !pathname.startsWith('/api/driver-ratings')) return 'driver';
    if (pathname.startsWith('/api/restaurant-dashboard')) return 'restaurant';
    if (
      pathname.startsWith('/api/cart') ||
      pathname.startsWith('/api/orders') ||
      pathname.startsWith('/api/reviews') ||
      pathname.startsWith('/api/promo') ||
      (pathname.startsWith('/api/stripe') && !pathname.startsWith('/api/stripe/connect'))
    ) return 'customer';
    return null;
  } catch {
    return null;
  }
}

let interceptorInstalled = false;

/**
 * Patches window.fetch to automatically inject Authorization headers
 * using per-tab session tokens stored in sessionStorage.
 *
 * Each tab stores tokens as `session_token_customer`, `session_token_driver`,
 * `session_token_restaurant`. The interceptor picks the right token based on
 * the URL path, explicitly-set x-session-role header, or the active_role.
 */
export function setupFetchInterceptor() {
  if (typeof window === 'undefined' || interceptorInstalled) return;
  interceptorInstalled = true;

  const originalFetch = window.fetch;

  window.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    // Only intercept same-origin requests
    const isSameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
    if (!isSameOrigin) {
      return originalFetch.call(this, input, init);
    }

    const headers = new Headers(init?.headers);

    // --- Authorization header ---
    if (!headers.has('Authorization')) {
      // Priority: explicit x-session-role header > URL-based role > active_role
      const explicitRole = headers.get('x-session-role') as UserRole | null;
      const urlRole = roleForUrl(url);
      const activeRole = sessionStorage.getItem('active_role') as UserRole | null;
      const role = explicitRole || urlRole || activeRole || 'customer';

      const token = sessionStorage.getItem(`session_token_${role}`);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (!urlRole && !explicitRole) {
        // Shared route, no explicit role — try all roles
        for (const r of ['customer', 'driver', 'restaurant'] as UserRole[]) {
          const t = sessionStorage.getItem(`session_token_${r}`);
          if (t) {
            headers.set('Authorization', `Bearer ${t}`);
            break;
          }
        }
      }
    }

    // --- x-session-role header ---
    if (!headers.has('x-session-role')) {
      const activeRole = sessionStorage.getItem('active_role');
      if (activeRole) {
        headers.set('x-session-role', activeRole);
      }
    }

    return originalFetch.call(this, input, { ...init, headers });
  };
}

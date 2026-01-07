import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // SSR/Prerender can't read localStorage tokens, so don't block on the server.
  // The browser guard run will enforce access after hydration.
  if (!isBrowser) return true;

  // Not logged in -> go to account page (will prompt login/register)
  if (!auth.isAuthenticated()) return router.parseUrl('/account');

  // Always refresh customer so role changes take effect without requiring re-login.
  await auth.hydrateCustomer();

  if (auth.customer()?.isAdmin) return true;

  // Logged in but not admin -> send to account page
  return router.parseUrl('/account');
};



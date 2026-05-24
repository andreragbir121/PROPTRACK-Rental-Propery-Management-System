import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const pinGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true; // Let them through!
  }

  // Not logged in? Redirect them to the PIN screen and pass the attempted URL
  return router.createUrlTree(['/pin-entry'], {
    queryParams: { returnUrl: state.url }
  });
};
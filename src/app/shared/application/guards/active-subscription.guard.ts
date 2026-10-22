import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

import { AuthSessionService } from '../services/auth-session.service';
import { ROUTE_PATHS } from '../../infrastructure/constants/route-paths';
import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { ToastService } from '../services/toast.service';

export const activeSubscriptionGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const billingFacade = inject(BillingFacade);
  const router = inject(Router);
  const toast = inject(ToastService);
  const translate = inject(TranslateService);

  if (!authSession.isAuthenticated()) {
    return router.createUrlTree([ROUTE_PATHS.IAM.LOGIN]);
  }

  if (authSession.isSessionExpired()) {
    authSession.clearSession();
    return router.createUrlTree([ROUTE_PATHS.IAM.LOGIN]);
  }

  return billingFacade.loadActiveSubscription().then(() => {
    if (billingFacade.hasActiveSubscription()) {
      return true;
    }

    toast.info(translate.instant('billing.subscriptionRequired'));
    return router.createUrlTree([ROUTE_PATHS.BILLING.PLANS]);
  }).catch((error) => {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      authSession.clearSession();
      toast.error(translate.instant('auth.sessionExpired'));
      return router.createUrlTree([ROUTE_PATHS.IAM.LOGIN]);
    }

    toast.error(translate.instant('billing.subscriptionCheckError'));
    return false;
  });
};

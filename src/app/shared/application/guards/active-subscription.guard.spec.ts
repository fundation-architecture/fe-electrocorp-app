import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { describe, it, expect, vi } from 'vitest';
import { activeSubscriptionGuard } from './active-subscription.guard';
import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { AuthSessionService } from '../services/auth-session.service';
import { ToastService } from '../services/toast.service';

function setup(active: boolean, error?: Error) {
  const billing = {
    loadActiveSubscription: error ? vi.fn().mockRejectedValue(error) : vi.fn().mockResolvedValue(undefined),
    hasActiveSubscription: () => active,
    clearActiveSubscription: vi.fn(),
  };
  const toast = { info: vi.fn(), error: vi.fn() };
  const router = { createUrlTree: vi.fn((commands: string[]) => commands.join('/')) };
  TestBed.configureTestingModule({ providers: [
    { provide: AuthSessionService, useValue: { isAuthenticated: () => true, isSessionExpired: () => false } },
    { provide: BillingFacade, useValue: billing },
    { provide: Router, useValue: router },
    { provide: ToastService, useValue: toast },
    { provide: TranslateService, useValue: { instant: (key: string) => key } },
  ] });
  const run = () => TestBed.runInInjectionContext(() => activeSubscriptionGuard(
    {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
  ));
  return { run, toast, billing, router };
}

describe('Subscription navigation', () => {
  it('allows header navigation with an active subscription', async () => {
    const { run, toast } = setup(true);
    expect(await run()).toBe(true);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('explains the redirect to plans when there is no subscription', async () => {
    const { run, toast, router } = setup(false);
    await run();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/plans']);
    expect(toast.info).toHaveBeenCalledWith('billing.subscriptionRequired');
  });

  it('keeps the current page and explains network failure without erasing the subscription', async () => {
    const { run, toast, billing, router } = setup(true, new Error('Server unavailable'));
    expect(await run()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('billing.subscriptionCheckError');
    expect(router.createUrlTree).not.toHaveBeenCalled();
    expect(billing.clearActiveSubscription).not.toHaveBeenCalled();
  });
});

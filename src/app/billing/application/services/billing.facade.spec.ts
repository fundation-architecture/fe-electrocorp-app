import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { BillingFacade } from './billing.facade';
import { BillingStore } from '../stores/billing.store';
import { PaymentValidationService } from '../../domain/services/payment-validation.service';
import { SubscriptionPolicyService } from '../../domain/services/subscription-policy.service';
import { PlansApiService } from '../../infrastructure/api/plans-api.service';
import { SubscriptionsApiService } from '../../infrastructure/api/subscriptions-api.service';
import { PaymentsApiService } from '../../infrastructure/api/payments-api.service';
import { InvoicesApiService } from '../../infrastructure/api/invoices-api.service';

function setup() {
  const store = new BillingStore();
  const subscription = {
    id: 1, userId: 1, planCode: 'PROFESSIONAL' as const, status: 'ACTIVE' as const, active: true,
  };
  const subscriptions = { checkout: vi.fn(() => of(subscription)), findCurrent: vi.fn(() => of(null)) };
  const payments = { findCurrentUserPayments: vi.fn(() => of([])) };
  const facade = new BillingFacade(
    { findAll: () => of([]) } as unknown as PlansApiService,
    subscriptions as unknown as SubscriptionsApiService,
    payments as unknown as PaymentsApiService,
    { findCurrentUserInvoices: () => of([]) } as unknown as InvoicesApiService,
    new SubscriptionPolicyService(), new PaymentValidationService(), store,
  );
  const command = {
    planCode: 'PROFESSIONAL' as const, holderName: 'Test User',
    cardNumber: '0000 0000 0000 000', expirationDate: '08/31', cvv: '000',
  };
  return { facade, store, subscriptions, payments, command };
}

describe('Billing checkout', () => {
  it('accepts 15-digit cards supported by the backend and activates the returned plan', async () => {
    const { facade, subscriptions, command } = setup();
    expect(await facade.processPaymentAndSubscribe(command)).toBe(true);
    expect(subscriptions.checkout).toHaveBeenCalledOnce();
    expect(facade.hasActiveSubscription()).toBe(true);
    expect(subscriptions.findCurrent).not.toHaveBeenCalled();
  });

  it('preserves the validation error and never requests checkout for an invalid card', async () => {
    const { facade, subscriptions, command } = setup();
    expect(await facade.processPaymentAndSubscribe({ ...command, cardNumber: '123' })).toBe(false);
    expect(facade.error()).toBe('billing.invalidCardNumber');
    expect(subscriptions.checkout).not.toHaveBeenCalled();
    expect(facade.loading()).toBe(false);
  });

  it('does not report a failed payment or discard the plan when history fails after checkout', async () => {
    const { facade, payments, command } = setup();
    payments.findCurrentUserPayments.mockReturnValue(throwError(() => new Error('History unavailable')));
    expect(await facade.processPaymentAndSubscribe(command)).toBe(true);
    expect(facade.hasActiveSubscription()).toBe(true);
    expect(facade.error()).toBe('billing.historyRefreshError');
    expect(facade.loading()).toBe(false);
  });

  it('shows an uncertain-result warning on connection failure without retrying checkout', async () => {
    const { facade, subscriptions, command } = setup();
    subscriptions.checkout.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    expect(await facade.processPaymentAndSubscribe(command)).toBe(false);
    expect(facade.error()).toBe('billing.connectionError');
    expect(subscriptions.checkout).toHaveBeenCalledOnce();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { PaymentFormComponent } from './payment-form.component';
import { PaymentValidationService } from '../../../domain/services/payment-validation.service';
import { Plan } from '../../../domain/model/plan.entity';

function setup() {
  const form = new PaymentFormComponent(new PaymentValidationService());
  form.plan = { code: 'PROFESSIONAL' } as Plan;
  form.holderName = 'Test User';
  form.expirationDate = '08/31';
  form.cvv = '000';
  const emit = vi.spyOn(form.confirmed, 'emit');
  return { form, emit };
}

describe('Payment form', () => {
  it('submits 15-digit cards instead of rejecting them as 16-digit-only', () => {
    const { form, emit } = setup();
    form.onCardNumberChange('000000000000000');
    form.onConfirm();
    expect(emit).toHaveBeenCalledOnce();
    expect(form.validationError).toBeNull();
  });

  it('preserves all 19 supported card digits while formatting them', () => {
    const { form, emit } = setup();
    form.onCardNumberChange('0000000000000000000');
    expect(form.cardNumber.replace(/ /g, '')).toHaveLength(19);
    form.onConfirm();
    expect(emit).toHaveBeenCalledOnce();
  });

  it('shows the specific validation error without submitting invalid details', () => {
    const { form, emit } = setup();
    form.onCardNumberChange('000');
    form.onConfirm();
    expect(form.validationError).toBe('billing.invalidCardNumber');
    expect(emit).not.toHaveBeenCalled();
  });
});

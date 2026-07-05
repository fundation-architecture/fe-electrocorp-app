import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { STORAGE_KEYS } from '../../infrastructure/constants/storage-keys';

/**
 * Tracks whether the authenticated user has already seen the first-login
 * installation wizard (US-09). The state is persisted in localStorage so the
 * wizard is only shown once per browser.
 */
@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = this.document.defaultView?.localStorage;

  readonly completed = signal<boolean>(this.readCompleted());

  complete(): void {
    this.completed.set(true);
    this.writeStorage(STORAGE_KEYS.onboardingCompleted, 'true');
  }

  reset(): void {
    this.completed.set(false);
    this.writeStorage(STORAGE_KEYS.onboardingCompleted, 'false');
  }

  private readCompleted(): boolean {
    return this.readStorage(STORAGE_KEYS.onboardingCompleted) === 'true';
  }

  private readStorage(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      this.storage?.setItem(key, value);
    } catch {
      return;
    }
  }
}

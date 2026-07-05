import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface WizardStep {
  readonly icon: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
}

/**
 * First-login installation wizard (US-09). Presents a short, skippable
 * step-by-step tutorial that guides the user through the initial setup and
 * finishes by sending them to create their first site.
 */
@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './onboarding-wizard.component.html',
  styleUrls: ['./onboarding-wizard.component.scss'],
})
export class OnboardingWizardComponent {
  @Output() readonly finished = new EventEmitter<void>();
  @Output() readonly skipped = new EventEmitter<void>();

  readonly steps: readonly WizardStep[] = [
    {
      icon: '👋',
      titleKey: 'onboarding.wizard.steps.welcome.title',
      descriptionKey: 'onboarding.wizard.steps.welcome.description',
    },
    {
      icon: '🏠',
      titleKey: 'onboarding.wizard.steps.site.title',
      descriptionKey: 'onboarding.wizard.steps.site.description',
    },
    {
      icon: '🔌',
      titleKey: 'onboarding.wizard.steps.devices.title',
      descriptionKey: 'onboarding.wizard.steps.devices.description',
    },
    {
      icon: '📊',
      titleKey: 'onboarding.wizard.steps.monitor.title',
      descriptionKey: 'onboarding.wizard.steps.monitor.description',
    },
  ];

  readonly currentIndex = signal(0);
  readonly currentStep = computed(() => this.steps[this.currentIndex()]);
  readonly isFirstStep = computed(() => this.currentIndex() === 0);
  readonly isLastStep = computed(() => this.currentIndex() === this.steps.length - 1);
  readonly progress = computed(() =>
    Math.round(((this.currentIndex() + 1) / this.steps.length) * 100)
  );

  next(): void {
    if (!this.isLastStep()) {
      this.currentIndex.update((index) => index + 1);
    }
  }

  back(): void {
    if (!this.isFirstStep()) {
      this.currentIndex.update((index) => index - 1);
    }
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }

  finish(): void {
    this.finished.emit();
  }

  skip(): void {
    this.skipped.emit();
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../shared/auth/auth.service';

@Component({
  selector: 'app-account-referral',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account-referral.component.html',
  styleUrl: './account-referral.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountReferralComponent {
  readonly auth = inject(AuthService);

  readonly copied = signal(false);

  readonly customer = computed(() => this.auth.customer());

  readonly referralLink = computed(() => {
    const code = this.customer()?.referralCode;
    if (!code) return '';
    return `${window.location.origin}/account/register?ref=${code}`;
  });

  async copyReferralLink(): Promise<void> {
    const link = this.referralLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }
}

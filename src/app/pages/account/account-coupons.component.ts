import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../shared/auth/auth.service';
import { Coupon, CouponsApiService } from '../../shared/api/coupons-api.service';

@Component({
  selector: 'app-account-coupons',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account-coupons.component.html',
  styleUrl: './account-coupons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountCouponsComponent {
  private readonly api = inject(CouponsApiService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly coupons = signal<Coupon[]>([]);

  readonly hasCoupons = computed(() => this.coupons().length > 0);
  readonly activeCoupons = computed(() => this.coupons().filter((c) => c.active && !c.isUsed));
  readonly usedCoupons = computed(() => this.coupons().filter((c) => c.isUsed));

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set(null);

    if (!this.auth.isAuthenticated()) {
      this.coupons.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const items = await firstValueFrom(this.api.listMine());
      this.coupons.set(items);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load coupons');
    } finally {
      this.loading.set(false);
    }
  }

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'No expiry';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  isExpired(coupon: Coupon): boolean {
    if (!coupon.expiryDate) return false;
    return new Date(coupon.expiryDate) < new Date();
  }

  getStatus(coupon: Coupon): string {
    if (coupon.isUsed) return 'Used';
    if (!coupon.active) return 'Inactive';
    if (this.isExpired(coupon)) return 'Expired';
    return 'Available';
  }

  getStatusClass(coupon: Coupon): string {
    const status = this.getStatus(coupon);
    if (status === 'Available') return 'pill--on';
    return 'pill--off';
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { Coupon, CouponsApiService } from '../../shared/api/coupons-api.service';
import { Customer, CustomersApiService } from '../../shared/api/customers-api.service';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-coupons.component.html',
  styleUrl: './admin-coupons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCouponsComponent {
  private readonly couponsApi = inject(CouponsApiService);
  private readonly customersApi = inject(CustomersApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly coupons = signal<Coupon[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly q = signal('');

  readonly form = this.fb.group({
    customerId: ['', [Validators.required]],
    value: [10, [Validators.required, Validators.min(0.01)]],
    description: [''],
    expiryDate: [''],
  });

  readonly count = computed(() => this.coupons().length);

  readonly filtered = computed(() => {
    const term = this.q().trim().toLowerCase();
    const items = this.coupons();
    if (!term) return items;
    return items.filter((c) => {
      return (
        c.code.toLowerCase().includes(term) ||
        (c.customerEmail ?? '').toLowerCase().includes(term) ||
        (c.customerName ?? '').toLowerCase().includes(term) ||
        (c.description ?? '').toLowerCase().includes(term)
      );
    });
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [coupons, customers] = await Promise.all([
        firstValueFrom(this.couponsApi.listAll()),
        firstValueFrom(this.customersApi.list()),
      ]);
      this.coupons.set(coupons);
      this.customers.set(customers);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load data');
    } finally {
      this.loading.set(false);
    }
  }

  setQuery(value: string): void {
    this.q.set(value);
  }

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async create(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const v = this.form.value;
      await firstValueFrom(
        this.couponsApi.create({
          customerId: v.customerId!,
          value: Number(v.value ?? 0),
          description: v.description || undefined,
          expiryDate: v.expiryDate || undefined,
        }),
      );
      this.form.reset({ customerId: '', value: 10, description: '', expiryDate: '' });
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to create coupon');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActive(c: Coupon): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.couponsApi.update(c._id, { active: !c.active }));
      this.coupons.set(this.coupons().map((x) => (x._id === updated._id ? { ...x, ...updated } : x)));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to update coupon');
    } finally {
      this.loading.set(false);
    }
  }

  async delete(c: Coupon): Promise<void> {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.couponsApi.delete(c._id));
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to delete coupon');
    } finally {
      this.loading.set(false);
    }
  }
}

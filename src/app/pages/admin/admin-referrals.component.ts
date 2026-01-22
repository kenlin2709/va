import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { Referral, ReferralsApiService } from '../../shared/api/referrals-api.service';

@Component({
  selector: 'app-admin-referrals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-referrals.component.html',
  styleUrl: './admin-referrals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReferralsComponent {
  private readonly api = inject(ReferralsApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly referrals = signal<Referral[]>([]);

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    discountType: ['percent' as const, [Validators.required]],
    discountValue: [10, [Validators.required]],
    active: [true],
  });

  readonly count = computed(() => this.referrals().length);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const items = await firstValueFrom(this.api.list());
      this.referrals.set(items);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load referrals');
    } finally {
      this.loading.set(false);
    }
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
        this.api.create({
          name: v.name!,
          discountType: v.discountType!,
          discountValue: Number(v.discountValue ?? 0),
          active: !!v.active,
        }),
      );
      this.form.reset({ name: '', discountType: 'percent', discountValue: 10, active: true });
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to create referral');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleActive(r: Referral): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.update(r._id, { active: !r.active }));
      this.referrals.set(this.referrals().map((x) => (x._id === updated._id ? updated : x)));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to update referral');
    } finally {
      this.loading.set(false);
    }
  }
}





import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';

import { CustomersApiService, Customer } from '../../shared/api/customers-api.service';
import { ReferralsApiService, Referral } from '../../shared/api/referrals-api.service';

@Component({
  selector: 'app-admin-customer-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-customer-form.component.html',
  styleUrl: './admin-customer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCustomerFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CustomersApiService);
  private readonly referralsApi = inject(ReferralsApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly referrals = signal<Referral[]>([]);

  readonly id = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    phone: [''],
    isAdmin: [false],
    referralProgramId: [''],
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [c, referrals] = await firstValueFrom(
        forkJoin([this.api.get(this.id()), this.referralsApi.list()])
      );
      this.customer.set(c);
      this.referrals.set(referrals);
      this.form.reset({
        email: c.email ?? '',
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        phone: c.phone ?? '',
        isAdmin: !!c.isAdmin,
        referralProgramId: c.referralProgramId ?? '',
      });
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load customer');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const v = this.form.value;
      await firstValueFrom(
        this.api.update(this.id(), {
          email: v.email!,
          firstName: v.firstName || undefined,
          lastName: v.lastName || undefined,
          phone: v.phone || undefined,
          isAdmin: !!v.isAdmin,
          referralProgramId: v.referralProgramId || undefined,
        }),
      );
      await this.router.navigateByUrl('/admin/customers');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to save customer');
    } finally {
      this.saving.set(false);
    }
  }

  getReferralProgramName(programId: string): string {
    if (!programId) return 'None';
    const program = this.referrals().find(r => r._id === programId);
    return program ? program.name : 'Unknown';
  }
}



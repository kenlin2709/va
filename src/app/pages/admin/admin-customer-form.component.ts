import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { CustomersApiService, Customer } from '../../shared/api/customers-api.service';

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
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly customer = signal<Customer | null>(null);

  readonly id = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    phone: [''],
    isAdmin: [false],
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const c = await firstValueFrom(this.api.get(this.id()));
      this.customer.set(c);
      this.form.reset({
        email: c.email ?? '',
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        phone: c.phone ?? '',
        isAdmin: !!c.isAdmin,
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
        }),
      );
      await this.router.navigateByUrl('/admin/customers');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to save customer');
    } finally {
      this.saving.set(false);
    }
  }
}



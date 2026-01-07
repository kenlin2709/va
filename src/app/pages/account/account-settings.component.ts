import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../shared/auth/auth.service';
import { AuthApiService } from '../../shared/api/auth-api.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsComponent {
  readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly pwSaving = signal(false);
  readonly pwError = signal<string | null>(null);
  readonly pwSuccess = signal<string | null>(null);

  readonly customer = computed(() => this.auth.customer());

  readonly form = this.fb.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    shipFullName: [''],
    shipPhone: [''],
    shipAddress1: [''],
    shipAddress2: [''],
    shipCity: [''],
    shipState: [''],
    shipPostcode: [''],
    shipCountry: ['Australia', [Validators.required]],
  });

  readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const c = this.customer();
      if (!c) return;
      const s = c.shippingAddress;
      this.form.patchValue(
        {
          firstName: c.firstName ?? '',
          lastName: c.lastName ?? '',
          phone: c.phone ?? '',
          shipFullName: s?.fullName ?? '',
          shipPhone: s?.phone ?? '',
          shipAddress1: s?.address1 ?? '',
          shipAddress2: s?.address2 ?? '',
          shipCity: s?.city ?? '',
          shipState: s?.state ?? '',
          shipPostcode: s?.postcode ?? '',
          shipCountry: s?.country ?? 'Australia',
        },
        { emitEvent: false },
      );
    });
  }

  async save(): Promise<void> {
    this.error.set(null);
    this.success.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.auth.isAuthenticated()) {
      await this.router.navigateByUrl('/account/login');
      return;
    }

    const v = this.form.value;
    this.saving.set(true);
    try {
      await this.auth.updateMe({
        firstName: v.firstName || undefined,
        lastName: v.lastName || undefined,
        phone: v.phone || undefined,
        shippingAddress: {
          fullName: v.shipFullName || undefined,
          phone: v.shipPhone || undefined,
          address1: v.shipAddress1 || undefined,
          address2: v.shipAddress2 || undefined,
          city: v.shipCity || undefined,
          state: v.shipState || undefined,
          postcode: v.shipPostcode || undefined,
          country: v.shipCountry || undefined,
        },
      });
      this.success.set('Saved.');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to save');
    } finally {
      this.saving.set(false);
    }
  }

  async changePassword(): Promise<void> {
    this.pwError.set(null);
    this.pwSuccess.set(null);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    if (!this.auth.isAuthenticated()) {
      await this.router.navigateByUrl('/account/login');
      return;
    }

    const v = this.passwordForm.value;
    if ((v.newPassword ?? '') !== (v.confirmPassword ?? '')) {
      this.pwError.set('Passwords do not match.');
      return;
    }

    this.pwSaving.set(true);
    try {
      await firstValueFrom(this.authApi.changePassword({ currentPassword: v.currentPassword!, newPassword: v.newPassword! }));
      this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      this.pwSuccess.set('Password updated.');
    } catch (e: any) {
      this.pwError.set(e?.error?.message ?? e?.message ?? 'Failed to update password');
    } finally {
      this.pwSaving.set(false);
    }
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/account/login');
  }
}



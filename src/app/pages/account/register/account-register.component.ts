import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../shared/auth/auth.service';

@Component({
  selector: 'app-account-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './account-register.component.html',
  styleUrl: './account-register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly referralCode = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    // Get referral code from URL query params
    this.route.queryParams.subscribe((params) => {
      const ref = params['ref'];
      if (ref) {
        this.referralCode.set(ref);
      }
    });
  }

  async submit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.register({
        email: this.form.value.email!,
        password: this.form.value.password!,
        firstName: this.form.value.firstName || undefined,
        lastName: this.form.value.lastName || undefined,
        phone: this.form.value.phone || undefined,
        referralCode: this.referralCode() || undefined,
      });
      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }
}





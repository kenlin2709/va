import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../shared/auth/auth.service';
import { AuthApiService } from '../../../shared/api/auth-api.service';

type RegistrationStep = 'email' | 'verify' | 'details';

@Component({
  selector: 'app-account-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './account-register.component.html',
  styleUrl: './account-register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountRegisterComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<RegistrationStep>('email');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly referralCode = signal<string | null>(null);
  readonly verificationToken = signal<string | null>(null);
  readonly cooldown = signal(0);
  readonly nextUrl = signal<string | null>(null);

  // Step 1: Email form
  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Step 2: Verification code form
  readonly codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  // Step 3: Details form
  readonly detailsForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.route.queryParams.subscribe((params) => {
      const ref = params['ref'];
      if (ref) this.referralCode.set(ref);
      const next = params['next'];
      if (next) this.nextUrl.set(next);
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  // Step 1: Send verification code
  async submitEmail(): Promise<void> {
    this.error.set(null);
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await firstValueFrom(
        this.authApi.sendVerification({ email: this.emailForm.value.email! }),
      );
      this.startCooldown(60);
      this.step.set('verify');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to send verification code');
    } finally {
      this.loading.set(false);
    }
  }

  // Step 2: Verify code
  async submitCode(): Promise<void> {
    this.error.set(null);
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.authApi.verifyCode({
          email: this.emailForm.value.email!,
          code: this.codeForm.value.code!,
        }),
      );
      this.verificationToken.set(res.verificationToken);
      this.step.set('details');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Invalid verification code');
    } finally {
      this.loading.set(false);
    }
  }

  // Step 3: Complete registration
  async submitDetails(): Promise<void> {
    this.error.set(null);
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.register({
        email: this.emailForm.value.email!,
        verificationToken: this.verificationToken()!,
        password: this.detailsForm.value.password!,
        firstName: this.detailsForm.value.firstName || undefined,
        lastName: this.detailsForm.value.lastName || undefined,
        phone: this.detailsForm.value.phone || undefined,
        referralCode: this.referralCode() || undefined,
      });
      await this.router.navigateByUrl(this.nextUrl() || '/');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }

  // Resend verification code
  async resendCode(): Promise<void> {
    if (this.cooldown() > 0) return;

    this.error.set(null);
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.authApi.sendVerification({ email: this.emailForm.value.email! }),
      );
      this.startCooldown(60);
      this.codeForm.reset();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to resend code');
    } finally {
      this.loading.set(false);
    }
  }

  // Go back to previous step
  goBack(): void {
    this.error.set(null);
    if (this.step() === 'verify') {
      this.step.set('email');
    } else if (this.step() === 'details') {
      this.step.set('verify');
    }
  }

  private startCooldown(seconds: number): void {
    this.cooldown.set(seconds);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      const current = this.cooldown();
      if (current <= 1) {
        this.cooldown.set(0);
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
        }
      } else {
        this.cooldown.set(current - 1);
      }
    }, 1000);
  }
}

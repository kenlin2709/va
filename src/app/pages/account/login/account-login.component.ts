import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../shared/auth/auth.service';

@Component({
  selector: 'app-account-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './account-login.component.html',
  styleUrl: './account-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async submit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.login({
        email: this.form.value.email!,
        password: this.form.value.password!,
      });
      await this.router.navigateByUrl('/');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Login failed');
    } finally {
      this.loading.set(false);
    }
  }
}



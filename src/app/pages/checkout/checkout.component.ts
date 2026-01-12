import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartService } from '../../shared/cart/cart.service';
import { AuthService } from '../../shared/auth/auth.service';
import { OrdersApiService, ValidateReferralResponse } from '../../shared/api/orders-api.service';
import { AuthApiService } from '../../shared/api/auth-api.service';

function isMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authApi = inject(AuthApiService);

  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly emailAlreadyRegistered = signal(false);

  readonly items = computed(() => this.cart.items());
  readonly subtotal = computed(() => this.cart.subtotal());

  // Referral state
  readonly referralValidation = signal<ValidateReferralResponse | null>(null);
  readonly referralError = signal<string | null>(null);
  readonly referralLoading = signal(false);

  readonly discountAmount = computed(() => {
    const referral = this.referralValidation();
    if (!referral) return 0;

    const subtotal = this.subtotal();
    if (referral.discountType === 'percent') {
      return Math.min(subtotal, (subtotal * referral.discountValue) / 100);
    } else {
      return Math.min(subtotal, referral.discountValue);
    }
  });

  readonly total = computed(() => Math.max(0, this.subtotal() - this.discountAmount()));

  readonly form = this.fb.group({
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    password: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(8)]],
    country: ['Australia', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    address1: ['', [Validators.required]],
    address2: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postcode: ['', [Validators.required]],
    phone: ['', [Validators.required]],
  });

  readonly referralForm = this.fb.group({
    referralCode: [''],
  });

  constructor() {
    // Ensure we have customer info for prefilling.
    void this.auth.hydrateCustomer();

    // If not authenticated, require email/password (create account or login) before placing order.
    effect(() => {
      const authed = this.auth.isAuthenticated();
      const emailCtrl = this.form.get('email');
      const passwordCtrl = this.form.get('password');
      if (!emailCtrl || !passwordCtrl) return;

      if (authed) {
        emailCtrl.disable({ emitEvent: false });
        passwordCtrl.disable({ emitEvent: false });
      } else {
        emailCtrl.enable({ emitEvent: false });
        passwordCtrl.enable({ emitEvent: false });

        emailCtrl.updateValueAndValidity({ emitEvent: false });
        passwordCtrl.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.form
      .get('email')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emailAlreadyRegistered.set(false));

    // Validate referral code when it changes
    this.referralForm
      .get('referralCode')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        map((v) => String(v ?? '').trim()),
        debounceTime(500),
        distinctUntilChanged(),
        filter((code) => code.length > 0),
        switchMap((code) => this.validateReferralCode(code)),
      )
      .subscribe();

    // Proactively detect existing emails after user finishes typing (debounced) so we can show a login link
    // without waiting for "Complete order".
    this.form
      .get('email')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        map((v) => String(v ?? '').trim()),
        debounceTime(450),
        distinctUntilChanged(),
        filter(() => !this.auth.isAuthenticated()),
        filter((email) => !!email),
        filter(() => !!this.form.get('email')?.valid),
        switchMap((email) =>
          this.authApi.emailExists(email).pipe(
            map((res) => !!res.exists),
            catchError(() => of(false)),
          ),
        ),
      )
      .subscribe((exists) => this.emailAlreadyRegistered.set(exists));

    effect(() => {
      const c = this.auth.customer();
      if (!c) return;
      const s = c.shippingAddress;
      const splitName = (s?.fullName ?? '').trim().split(/\s+/);
      const first = (c.firstName ?? splitName[0] ?? '').trim();
      const last = (c.lastName ?? splitName.slice(1).join(' ') ?? '').trim();

      this.form.patchValue(
        {
          email: c.email ?? '',
          country: s?.country ?? 'Australia',
          firstName: first,
          lastName: last,
          address1: s?.address1 ?? '',
          address2: s?.address2 ?? '',
          city: s?.city ?? '',
          state: s?.state ?? '',
          postcode: s?.postcode ?? '',
          phone: c.phone ?? s?.phone ?? '',
        },
        { emitEvent: false },
      );
    });
  }

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  private async ensureAuthenticatedForCheckout(): Promise<boolean> {
    if (this.auth.isAuthenticated()) return true;

    const email = String(this.form.value.email ?? '').trim();
    const password = String(this.form.value.password ?? '');

    // Create account (creates session). If email already exists, show login link prompt.
    try {
      await this.auth.register({
        email,
        password,
        firstName: (this.form.value.firstName || '').trim() || undefined,
        lastName: (this.form.value.lastName || '').trim() || undefined,
        phone: (this.form.value.phone || '').trim() || undefined,
      });
      return true;
    } catch (e: any) {
      const msg = String(e?.error?.message ?? e?.message ?? '').toLowerCase();
      const status = e?.status;
      const looksLikeAlreadyExists = status === 409 || msg.includes('already') || msg.includes('exists');
      if (!looksLikeAlreadyExists) throw e;

      this.emailAlreadyRegistered.set(true);
      return false;
    }
  }

  async goToLogin(): Promise<void> {
    const email = String(this.form.value.email ?? '').trim() || undefined;
    await this.router.navigate(['/account/login'], { queryParams: { email, next: '/checkout' } });
  }

  private async validateReferralCode(code: string): Promise<void> {
    this.referralLoading.set(true);
    this.referralError.set(null);

    try {
      const response = await firstValueFrom(this.ordersApi.validateReferral(code));
      this.referralValidation.set(response);
    } catch (e: any) {
      this.referralValidation.set(null);
      this.referralError.set(e?.error?.message ?? 'Invalid referral code');
    } finally {
      this.referralLoading.set(false);
    }
  }

  async submit(): Promise<void> {
    this.error.set(null);

    if (!this.items().length) {
      this.error.set('Your cart is empty.');
      return;
    }

    const invalid = this.items().find((it) => !isMongoId(it.id));
    if (invalid) {
      this.error.set('Some cart items are from the demo catalog. Please clear your cart and add products again.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // If the email is already registered, guide user to log in instead of attempting registration.
    if (!this.auth.isAuthenticated() && this.emailAlreadyRegistered()) {
      return;
    }

    this.submitting.set(true);
    try {
      const ok = await this.ensureAuthenticatedForCheckout();
      if (!ok) return;

      const v = this.form.value;
      const referralV = this.referralForm.value;
      const shippingName = `${v.firstName} ${v.lastName}`.trim();

      await firstValueFrom(
        this.ordersApi.create({
          items: this.items().map((it) => ({ productId: it.id, qty: it.qty })),
          referralCode: String(referralV.referralCode ?? '').trim() || undefined,
          shippingName,
          shippingAddress1: v.address1!,
          shippingCity: v.city!,
          shippingState: v.state!,
          shippingPostcode: v.postcode!,
        }),
      );

      this.cart.clear();
      await this.router.navigateByUrl('/account/orders');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to place order');
    } finally {
      this.submitting.set(false);
    }
  }
}



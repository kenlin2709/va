import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, of, interval } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartService } from '../../shared/cart/cart.service';
import { AuthService } from '../../shared/auth/auth.service';
import { Order, OrdersApiService } from '../../shared/api/orders-api.service';
import { AuthApiService } from '../../shared/api/auth-api.service';
import { Coupon, CouponsApiService } from '../../shared/api/coupons-api.service';
import { PaymentSummaryModalComponent } from '../../ui/payment-summary-modal/payment-summary-modal.component';

function isMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaymentSummaryModalComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly couponsApi = inject(CouponsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authApi = inject(AuthApiService);

  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly emailAlreadyRegistered = signal(false);
  readonly createdOrder = signal<Order | null>(null);

  // Verification flow signals
  readonly verificationStep = signal<'email' | 'verify' | 'ready'>('email');
  readonly verificationToken = signal<string | null>(null);
  readonly verificationCooldown = signal(0);
  readonly verificationLoading = signal(false);

  // Verification code form control
  readonly verificationCodeControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/),
  ]);

  readonly items = computed(() => this.cart.items());
  readonly subtotal = computed(() => this.cart.subtotal());

  // Coupon state (up to 3 coupons)
  readonly availableCoupons = signal<Coupon[]>([]);
  readonly selectedCoupons = signal<Coupon[]>([]);
  readonly couponsLoading = signal(false);
  readonly maxCoupons = 3;

  readonly discountAmount = computed(() => {
    let discount = 0;
    const subtotal = this.subtotal();

    // Coupon discounts (fixed amounts, up to 3)
    const coupons = this.selectedCoupons();
    for (const coupon of coupons) {
      const remaining = subtotal - discount;
      if (remaining > 0) {
        discount += Math.min(remaining, coupon.value);
      }
    }

    return discount;
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

  constructor() {
    // Ensure we have customer info for prefilling.
    void this.auth.hydrateCustomer();

    // Manage email/password controls based on auth state and verification step.
    effect(() => {
      const authed = this.auth.isAuthenticated();
      const step = this.verificationStep();
      const emailCtrl = this.form.get('email');
      const passwordCtrl = this.form.get('password');
      if (!emailCtrl || !passwordCtrl) return;

      if (authed) {
        // User is logged in, disable both
        emailCtrl.disable({ emitEvent: false });
        passwordCtrl.disable({ emitEvent: false });
      } else {
        // Email enabled only in 'email' step (before sending code)
        if (step === 'email') {
          emailCtrl.enable({ emitEvent: false });
        } else {
          emailCtrl.disable({ emitEvent: false });
        }

        // Password enabled only in 'ready' step (after email verified)
        if (step === 'ready') {
          passwordCtrl.enable({ emitEvent: false });
        } else {
          passwordCtrl.disable({ emitEvent: false });
        }

        emailCtrl.updateValueAndValidity({ emitEvent: false });
        passwordCtrl.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.form
      .get('email')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emailAlreadyRegistered.set(false));

    // Load available coupons when authenticated
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadAvailableCoupons();
      } else {
        this.availableCoupons.set([]);
        this.selectedCoupons.set([]);
      }
    });

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

    // Use verificationToken to register inline
    const token = this.verificationToken();
    if (!token) {
      this.error.set('Please verify your email first.');
      return false;
    }

    try {
      const formValue = this.form.getRawValue();
      const fullName = `${formValue.firstName || ''} ${formValue.lastName || ''}`.trim();
      await this.auth.register({
        email: formValue.email!,
        verificationToken: token,
        password: formValue.password!,
        firstName: formValue.firstName || undefined,
        lastName: formValue.lastName || undefined,
        phone: formValue.phone || undefined,
        shippingAddress: {
          fullName: fullName || undefined,
          phone: formValue.phone || undefined,
          address1: formValue.address1 || undefined,
          address2: formValue.address2 || undefined,
          city: formValue.city || undefined,
          state: formValue.state || undefined,
          postcode: formValue.postcode || undefined,
          country: formValue.country || undefined,
        },
      });
      return true;
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Registration failed. Please try again.');
      return false;
    }
  }

  async goToLogin(): Promise<void> {
    const email = String(this.form.get('email')?.value ?? '').trim() || undefined;
    await this.router.navigate(['/account/login'], { queryParams: { email, next: '/checkout' } });
  }

  async sendVerificationCode(): Promise<void> {
    const email = String(this.form.get('email')?.value ?? '').trim();
    if (!email || !this.form.get('email')?.valid) return;

    this.error.set(null);
    this.verificationLoading.set(true);

    try {
      await firstValueFrom(this.authApi.sendVerification({ email }));
      this.verificationStep.set('verify');
      this.startCooldown();
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Failed to send verification code';
      if (msg.toLowerCase().includes('already registered')) {
        this.emailAlreadyRegistered.set(true);
      } else {
        this.error.set(msg);
      }
    } finally {
      this.verificationLoading.set(false);
    }
  }

  async verifyCode(): Promise<void> {
    const email = String(this.form.get('email')?.value ?? '').trim();
    const code = String(this.verificationCodeControl.value ?? '').trim();
    if (!email || !code || this.verificationCodeControl.invalid) return;

    this.error.set(null);
    this.verificationLoading.set(true);

    try {
      const res = await firstValueFrom(this.authApi.verifyCode({ email, code }));
      this.verificationToken.set(res.verificationToken);
      this.verificationStep.set('ready');
      this.verificationCodeControl.reset();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Invalid verification code');
    } finally {
      this.verificationLoading.set(false);
    }
  }

  async resendCode(): Promise<void> {
    if (this.verificationCooldown() > 0) return;
    await this.sendVerificationCode();
  }

  private startCooldown(): void {
    this.verificationCooldown.set(60);
    interval(1000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        take(60),
        tap(() => {
          const current = this.verificationCooldown();
          if (current > 0) this.verificationCooldown.set(current - 1);
        }),
      )
      .subscribe();
  }

  async onPaymentModalClose(): Promise<void> {
    this.createdOrder.set(null);
    await this.router.navigateByUrl('/account/orders');
  }

  private async loadAvailableCoupons(): Promise<void> {
    this.couponsLoading.set(true);
    try {
      const coupons = await firstValueFrom(this.couponsApi.listMine());
      this.availableCoupons.set(coupons);
    } catch (e: any) {
      this.availableCoupons.set([]);
    } finally {
      this.couponsLoading.set(false);
    }
  }

  toggleCoupon(couponCode: string, selected: boolean): void {
    const coupon = this.availableCoupons().find((c) => c.code === couponCode);
    if (!coupon) return;

    const current = this.selectedCoupons();
    if (selected) {
      // Add coupon if not already selected and under limit
      if (current.length < this.maxCoupons && !current.some((c) => c.code === couponCode)) {
        this.selectedCoupons.set([...current, coupon]);
      }
    } else {
      // Remove coupon
      this.selectedCoupons.set(current.filter((c) => c.code !== couponCode));
    }
  }

  isCouponSelected(couponCode: string): boolean {
    return this.selectedCoupons().some((c) => c.code === couponCode);
  }

  get totalCouponDiscount(): number {
    return this.selectedCoupons().reduce((sum, c) => sum + c.value, 0);
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

    // Check verification flow for non-authenticated users
    if (!this.auth.isAuthenticated()) {
      if (this.verificationStep() !== 'ready') {
        this.error.set('Please verify your email first.');
        return;
      }

      // Validate password when creating account
      const password = this.form.get('password')?.value ?? '';
      if (!password || password.length < 8) {
        this.error.set('Password must be at least 8 characters.');
        return;
      }

      if (this.emailAlreadyRegistered()) {
        return;
      }
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const ok = await this.ensureAuthenticatedForCheckout();
      if (!ok) return;

      const v = this.form.value;
      const shippingName = `${v.firstName} ${v.lastName}`.trim();

      const couponCodes = this.selectedCoupons().map((c) => c.code);
      const order = await firstValueFrom(
        this.ordersApi.create({
          items: this.items().map((it) => ({ productId: it.id, qty: it.qty })),
          couponCodes: couponCodes.length > 0 ? couponCodes : undefined,
          shippingName,
          shippingAddress1: v.address1!,
          shippingCity: v.city!,
          shippingState: v.state!,
          shippingPostcode: v.postcode!,
        }),
      );

      this.cart.clear();
      this.createdOrder.set(order);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to place order');
    } finally {
      this.submitting.set(false);
    }
  }
}



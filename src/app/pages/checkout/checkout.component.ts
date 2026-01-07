import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CartService } from '../../shared/cart/cart.service';
import { AuthService } from '../../shared/auth/auth.service';
import { OrdersApiService } from '../../shared/api/orders-api.service';

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

  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly items = computed(() => this.cart.items());
  readonly subtotal = computed(() => this.cart.subtotal());

  readonly form = this.fb.group({
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

    effect(() => {
      const c = this.auth.customer();
      if (!c) return;
      const s = c.shippingAddress;
      const splitName = (s?.fullName ?? '').trim().split(/\s+/);
      const first = (c.firstName ?? splitName[0] ?? '').trim();
      const last = (c.lastName ?? splitName.slice(1).join(' ') ?? '').trim();

      this.form.patchValue(
        {
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

  async submit(): Promise<void> {
    this.error.set(null);

    if (!this.auth.isAuthenticated()) {
      await this.router.navigateByUrl('/account/login');
      return;
    }

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

    this.submitting.set(true);
    try {
      const v = this.form.value;
      const shippingName = `${v.firstName} ${v.lastName}`.trim();

      await firstValueFrom(
        this.ordersApi.create({
          items: this.items().map((it) => ({ productId: it.id, qty: it.qty })),
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



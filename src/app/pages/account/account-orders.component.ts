import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../shared/auth/auth.service';
import { OrdersApiService, Order } from '../../shared/api/orders-api.service';

@Component({
  selector: 'app-account-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account-orders.component.html',
  styleUrl: './account-orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountOrdersComponent {
  private readonly api = inject(OrdersApiService);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly selected = signal<Order | null>(null);
  readonly loadingSelected = signal(false);
  readonly selectedError = signal<string | null>(null);

  readonly hasOrders = computed(() => this.orders().length > 0);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set(null);

    if (!this.auth.isAuthenticated()) {
      this.orders.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const items = await firstValueFrom(this.api.listMine());
      this.orders.set(items);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load orders');
    } finally {
      this.loading.set(false);
    }
  }

  open(o: Order): void {
    this.selectedError.set(null);
    this.selected.set(o);
    void this.refreshSelected(o._id);
  }

  close(): void {
    this.selectedError.set(null);
    this.selected.set(null);
  }

  private async refreshSelected(id: string): Promise<void> {
    this.loadingSelected.set(true);
    try {
      const updated = await firstValueFrom(this.api.getMine(id));
      this.orders.set(this.orders().map((x) => (x._id === updated._id ? updated : x)));
      this.selected.set(updated);
    } catch (e: any) {
      this.selectedError.set(e?.error?.message ?? e?.message ?? 'Failed to load order');
    } finally {
      this.loadingSelected.set(false);
    }
  }

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  itemCount(o: Order): number {
    return o.items?.reduce((sum, it) => sum + (it.qty ?? 0), 0) ?? 0;
  }

  orderDisplayId(o: Order): string {
    return o.orderId || o._id;
  }

  shippingText(o: Order): string {
    const parts = [
      o.shippingName,
      o.shippingAddress1,
      [o.shippingCity, o.shippingState].filter(Boolean).join(', '),
      o.shippingPostcode,
    ].filter(Boolean);
    return parts.join(' • ');
  }

  ausPostTrackingUrl(trackingNumber: string): string {
    return `https://auspost.com.au/track/${encodeURIComponent(trackingNumber.trim())}`;
  }
}



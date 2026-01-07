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

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  itemCount(o: Order): number {
    return o.items?.reduce((sum, it) => sum + (it.qty ?? 0), 0) ?? 0;
  }
}



import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { OrdersApiService, Order } from '../../shared/api/orders-api.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersComponent {
  private readonly api = inject(OrdersApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orders = signal<Order[]>([]);
  readonly q = signal('');
  readonly selected = signal<Order | null>(null);
  readonly statusDraft = signal<Order['status']>('pending');
  readonly savingStatus = signal(false);
  readonly statusError = signal<string | null>(null);
  readonly carrierDraft = signal('');
  readonly trackingDraft = signal('');
  readonly savingShipment = signal(false);
  readonly shipmentError = signal<string | null>(null);

  readonly filtered = computed(() => {
    const term = this.q().trim().toLowerCase();
    const items = this.orders();
    if (!term) return items;
    return items.filter((o) => {
      return (
        String(o.orderId ?? '').toLowerCase().includes(term) ||
        String(o._id).toLowerCase().includes(term) ||
        String(o.customerId).toLowerCase().includes(term) ||
        String(o.customerEmail ?? '').toLowerCase().includes(term)
      );
    });
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const items = await firstValueFrom(this.api.listAll());
      this.orders.set(items);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load orders');
    } finally {
      this.loading.set(false);
    }
  }

  setQuery(v: string): void {
    this.q.set(v);
  }

  open(o: Order): void {
    this.statusError.set(null);
    this.shipmentError.set(null);
    this.statusDraft.set(o.status);
    this.carrierDraft.set(o.shippingCarrier ?? '');
    this.trackingDraft.set(o.trackingNumber ?? '');
    this.selected.set(o);
  }

  close(): void {
    this.statusError.set(null);
    this.shipmentError.set(null);
    this.selected.set(null);
  }

  setStatusDraft(v: string): void {
    // template gives us string
    this.statusDraft.set(v as Order['status']);
  }

  async saveStatus(): Promise<void> {
    const o = this.selected();
    if (!o) return;
    const next = this.statusDraft();
    if (next === o.status) return;

    this.savingStatus.set(true);
    this.statusError.set(null);
    try {
      const updated = await firstValueFrom(
        this.api.adminUpdateStatus(o._id, { status: next }),
      );

      const merged: Order = {
        ...o,
        ...updated,
        customerEmail: updated.customerEmail ?? o.customerEmail,
        customerInfo: updated.customerInfo ?? o.customerInfo,
      };

      // Update list
      this.orders.set(
        this.orders().map((x) => (x._id === merged._id ? merged : x)),
      );
      // Update modal
      this.selected.set(merged);
      this.statusDraft.set(merged.status);
    } catch (e: any) {
      this.statusError.set(
        e?.error?.message ?? e?.message ?? 'Failed to update status',
      );
      // revert draft to current selected status
      const cur = this.selected();
      if (cur) this.statusDraft.set(cur.status);
    } finally {
      this.savingStatus.set(false);
    }
  }

  setCarrierDraft(v: string): void {
    this.carrierDraft.set(v);
  }

  setTrackingDraft(v: string): void {
    this.trackingDraft.set(v);
  }

  async saveShipment(): Promise<void> {
    const o = this.selected();
    if (!o) return;

    const shippingCarrier = this.carrierDraft().trim() || undefined;
    const trackingNumber = this.trackingDraft().trim() || undefined;

    if (shippingCarrier === (o.shippingCarrier ?? undefined) && trackingNumber === (o.trackingNumber ?? undefined)) {
      return;
    }

    this.savingShipment.set(true);
    this.shipmentError.set(null);
    try {
      const updated = await firstValueFrom(
        this.api.adminUpdateShipment(o._id, { shippingCarrier, trackingNumber }),
      );

      const merged: Order = {
        ...o,
        ...updated,
        customerEmail: updated.customerEmail ?? o.customerEmail,
        customerInfo: updated.customerInfo ?? o.customerInfo,
      };

      this.orders.set(
        this.orders().map((x) => (x._id === merged._id ? merged : x)),
      );
      this.selected.set(merged);
      this.carrierDraft.set(merged.shippingCarrier ?? '');
      this.trackingDraft.set(merged.trackingNumber ?? '');
    } catch (e: any) {
      this.shipmentError.set(
        e?.error?.message ?? e?.message ?? 'Failed to update shipment info',
      );
      const cur = this.selected();
      if (cur) {
        this.carrierDraft.set(cur.shippingCarrier ?? '');
        this.trackingDraft.set(cur.trackingNumber ?? '');
      }
    } finally {
      this.savingShipment.set(false);
    }
  }

  itemCount(o: Order): number {
    return o.items?.reduce((sum, it) => sum + (it.qty ?? 0), 0) ?? 0;
  }

  orderDisplayId(o: Order): string {
    return o.orderId || o._id;
  }

  itemLineTotal(o: Order, productId: string): number {
    const it = o.items?.find((x) => String(x.productId) === String(productId));
    if (!it) return 0;
    return (it.price ?? 0) * (it.qty ?? 0);
  }

  customerName(o: Order): string {
    const c = o.customerInfo;
    const s =
      c?.shippingAddress?.fullName ||
      [c?.firstName, c?.lastName].filter(Boolean).join(' ') ||
      o.shippingName ||
      '';
    return s.trim();
  }

  customerPhone(o: Order): string {
    return (
      o.customerInfo?.shippingAddress?.phone ||
      o.customerInfo?.phone ||
      ''
    ).trim();
  }

  shippingAddressText(o: Order): string {
    const s = o.customerInfo?.shippingAddress;
    const parts = [
      o.shippingAddress1 || s?.address1,
      s?.address2,
      [o.shippingCity || s?.city, o.shippingState || s?.state].filter(Boolean).join(', '),
      o.shippingPostcode || s?.postcode,
      s?.country,
    ].filter(Boolean);
    return parts.join(' • ');
  }

  ausPostTrackingUrl(trackingNumber: string): string {
    return `https://auspost.com.au/track/${encodeURIComponent(trackingNumber.trim())}`;
  }

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }
}



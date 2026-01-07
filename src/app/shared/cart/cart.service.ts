import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type CartItem = {
  /** stable unique id for cart row (productId preferred; slug fallback) */
  id: string;
  title: string;
  price: number; // numeric
  imageUrl?: string | null;
  qty: number;
};

const STORAGE_KEY = 'va.cart.v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly isOpen = signal(false);
  readonly items = signal<CartItem[]>([]);

  readonly count = computed(() => this.items().reduce((sum, it) => sum + it.qty, 0));
  readonly subtotal = computed(() => this.items().reduce((sum, it) => sum + it.qty * it.price, 0));

  constructor() {
    if (!this.isBrowser) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.items.set(
          parsed
            .filter(Boolean)
            .map((x: any) => ({
              id: String(x.id),
              title: String(x.title ?? ''),
              price: Number(x.price ?? 0),
              imageUrl: x.imageUrl ?? null,
              qty: Math.max(1, Number(x.qty ?? 1)),
            }))
            .filter((x) => !!x.id && !!x.title),
        );
      }
    } catch {
      // ignore
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  add(item: Omit<CartItem, 'qty'>, qty = 1): void {
    const q = Math.max(1, Math.floor(qty));
    const next = [...this.items()];
    const idx = next.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      next[idx] = { ...next[idx], qty: next[idx].qty + q };
    } else {
      next.push({ ...item, qty: q });
    }
    this.items.set(next);
    this.persist();
    this.open();
  }

  setQty(id: string, qty: number): void {
    const q = Math.max(1, Math.floor(qty));
    const next = this.items().map((x) => (x.id === id ? { ...x, qty: q } : x));
    this.items.set(next);
    this.persist();
  }

  inc(id: string): void {
    const it = this.items().find((x) => x.id === id);
    if (!it) return;
    this.setQty(id, it.qty + 1);
  }

  dec(id: string): void {
    const it = this.items().find((x) => x.id === id);
    if (!it) return;
    this.setQty(id, Math.max(1, it.qty - 1));
  }

  remove(id: string): void {
    this.items.set(this.items().filter((x) => x.id !== id));
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  formatMoney(n: number): string {
    return `$${n.toFixed(2)}`;
  }

  private persist(): void {
    if (!this.isBrowser) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    } catch {
      // ignore
    }
  }
}



import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { CartService } from '../../shared/cart/cart.service';
import { ProductsApiService } from '../../shared/api/products-api.service';
import { firstValueFrom } from 'rxjs';

type SortKey = 'featured' | 'best' | 'az' | 'za' | 'price_asc' | 'price_desc';

type Product = {
  id: string;
  title: string;
  price: number; // AUD
  inStock: boolean;
  imageUrl?: string;
};

function byTitleAsc(a: Product, b: Product): number {
  return a.title.localeCompare(b.title);
}

function byPriceAsc(a: Product, b: Product): number {
  return a.price - b.price;
}

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './all-products.component.html',
  styleUrl: './all-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllProductsComponent {
  private readonly cart = inject(CartService);
  private readonly productsApi = inject(ProductsApiService);

  // Backend-driven products
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.productsApi.list({ limit: 200 }));
      this.products.set(
        res.items.map((p) => ({
          id: p._id,
          title: p.name,
          price: p.price,
          inStock: (p.stockQty ?? 0) > 0,
          imageUrl: p.productImageUrl ?? undefined,
        })),
      );
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load products');
    } finally {
      this.loading.set(false);
    }
  }

  // UI state (drawer)
  readonly isDrawerOpen = signal(false);
  readonly sortKey = signal<SortKey>('featured');
  readonly availability = signal<'all' | 'in' | 'out'>('all');
  readonly priceMin = signal<number | null>(null);
  readonly priceMax = signal<number | null>(null);

  readonly hasAnyFilter = computed(() => {
    return this.availability() !== 'all' || this.priceMin() !== null || this.priceMax() !== null;
  });

  readonly filtered = computed(() => {
    const items = this.products();
    const avail = this.availability();
    const min = this.priceMin();
    const max = this.priceMax();

    return items.filter((p) => {
      if (avail === 'in' && !p.inStock) return false;
      if (avail === 'out' && p.inStock) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      return true;
    });
  });

  readonly sorted = computed(() => {
    const items = [...this.filtered()];
    switch (this.sortKey()) {
      case 'az':
        return items.sort(byTitleAsc);
      case 'za':
        return items.sort((a, b) => byTitleAsc(b, a));
      case 'price_asc':
        return items.sort(byPriceAsc);
      case 'price_desc':
        return items.sort((a, b) => byPriceAsc(b, a));
      case 'best':
      case 'featured':
      default:
        return items;
    }
  });

  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  clearAll(): void {
    this.sortKey.set('featured');
    this.availability.set('all');
    this.priceMin.set(null);
    this.priceMax.set(null);
  }

  setPriceMin(value: string): void {
    const v = value.trim();
    this.priceMin.set(v ? Number(v) : null);
  }

  setPriceMax(value: string): void {
    const v = value.trim();
    this.priceMax.set(v ? Number(v) : null);
  }

  formatPrice(n: number): string {
    return `$${n.toFixed(2)}`;
  }

  addToCart(p: Product): void {
    this.cart.add(
      {
        id: p.id,
        title: p.title,
        price: p.price,
        imageUrl: p.imageUrl ?? null,
      },
      1,
    );
  }
}



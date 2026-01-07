import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { PRODUCT_CATALOG } from '../../shared/product-catalog';
import { CartService } from '../../shared/cart/cart.service';

type SortKey = 'featured' | 'best' | 'az' | 'za' | 'price_asc' | 'price_desc';

type Product = {
  title: string;
  price: number; // AUD
  inStock: boolean;
  imageUrl?: string;
  slug?: string;
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
  // Demo data from shared catalog (slug-based for navigation).
  // Reference listing: https://vapelabgroup.com.au/collections/all-products
  readonly products = signal<Product[]>(
    PRODUCT_CATALOG.map((p) => ({
      title: p.title,
      price: p.price,
      inStock: p.inStock,
      slug: p.slug,
      imageUrl: p.images[0]
    }))
  );

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
    if (!p.slug) return;
    this.cart.add(
      {
        id: p.slug,
        title: p.title,
        price: p.price,
        imageUrl: p.imageUrl ?? null,
      },
      1,
    );
  }
}



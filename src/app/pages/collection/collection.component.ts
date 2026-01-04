import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoriesApiService, Category } from '../../shared/api/categories-api.service';
import { ProductsApiService } from '../../shared/api/products-api.service';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type SortKey = 'featured' | 'best' | 'az' | 'za' | 'price_asc' | 'price_desc';

type Product = {
  title: string;
  price: number;
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
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './collection.component.html',
  styleUrl: './collection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly productsApi = inject(ProductsApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);

  readonly categorySlug = computed(() => this.route.snapshot.paramMap.get('category') ?? '');

  readonly currentCategory = computed(() => {
    const slug = this.categorySlug();
    return this.categories().find((c) => slugify(c.name) === slug) ?? null;
  });

  // UI state (drawer) — same as All Products page
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

  constructor() {
    // Re-load if the route param changes (navigate between collections)
    this.route.paramMap.subscribe(() => void this.load());
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const cats = await firstValueFrom(this.categoriesApi.list());
      this.categories.set(cats);

      const cat = cats.find((c) => slugify(c.name) === this.categorySlug());
      if (!cat) {
        this.products.set([]);
        return;
      }

      const res = await firstValueFrom(this.productsApi.list({ categoryId: cat._id, limit: 200 }));
      this.products.set(
        res.items.map((p) => ({
          title: p.name,
          price: p.price,
          inStock: (p.stockQty ?? 0) > 0,
          imageUrl: p.productImageUrl,
        })),
      );
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load collection');
    } finally {
      this.loading.set(false);
    }
  }

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
    return `$${Number(n).toFixed(2)}`;
  }
}



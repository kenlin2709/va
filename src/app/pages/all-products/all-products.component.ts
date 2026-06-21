import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { CartService } from '../../shared/cart/cart.service';
import { ProductsApiService } from '../../shared/api/products-api.service';
import { CategoriesApiService, Category } from '../../shared/api/categories-api.service';
import { firstValueFrom } from 'rxjs';

type Product = {
  id: string;
  title: string;
  price: number; // AUD
  inStock: boolean;
  imageUrl?: string;
  categoryId?: string;
  categoryIds?: string[];
};

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
  private readonly categoriesApi = inject(CategoriesApiService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly selectedCategoryId = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [res, cats] = await Promise.all([
        firstValueFrom(this.productsApi.list({ limit: 200 })),
        firstValueFrom(this.categoriesApi.list()),
      ]);
      this.products.set(
        res.items.map((p) => ({
          id: p._id,
          title: p.name,
          price: p.price,
          inStock: (p.stockQty ?? 0) > 0,
          imageUrl: p.productImageUrl ?? undefined,
          categoryId: p.categoryId,
          categoryIds: p.categoryIds,
        })),
      );
      const sorted = [...cats].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      this.categories.set(sorted);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load products');
    } finally {
      this.loading.set(false);
    }
  }

  readonly filtered = computed(() => {
    const catId = this.selectedCategoryId();
    const items = [...this.products()].sort(byPriceAsc);
    if (!catId) return items;
    const selectedCat = this.categories().find((c) => c._id === catId);
    if (selectedCat?.name.toLowerCase().includes('all')) return items;
    return items.filter((p) => p.categoryId === catId || (p.categoryIds ?? []).includes(catId));
  });

  selectCategory(id: string | null): void {
    this.selectedCategoryId.set(id);
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

import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoriesApiService, Category } from '../../shared/api/categories-api.service';
import { ProductsApiService, Product } from '../../shared/api/products-api.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent {
  private readonly productsApi = inject(ProductsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);

  readonly sort = signal<'default' | 'stockAsc' | 'stockDesc'>('default');

  readonly categoriesById = computed(() => {
    const map = new Map<string, Category>();
    for (const c of this.categories()) map.set(c._id, c);
    return map;
  });

  readonly productsSorted = computed(() => {
    const items = this.products();
    const mode = this.sort();
    if (mode === 'default') return items;

    const copy = [...items];
    copy.sort((a, b) => {
      const av = a.stockQty ?? 0;
      const bv = b.stockQty ?? 0;
      return mode === 'stockAsc' ? av - bv : bv - av;
    });
    return copy;
  });

  primaryCategoryName(p: Product): string {
    const ids = p.categoryIds ?? [];
    const primaryId = ids.length ? ids[0] : p.categoryId;
    if (!primaryId) return '—';
    return this.categoriesById().get(primaryId)?.name ?? '—';
  }

  extraCategoryCount(p: Product): number {
    const ids = p.categoryIds ?? [];
    return ids.length > 1 ? ids.length - 1 : 0;
  }

  constructor() {
    void this.reload();
  }

  async reload() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [cats, prods] = await Promise.all([
        firstValueFrom(this.categoriesApi.list()),
        firstValueFrom(this.productsApi.list({ limit: 200 })),
      ]);
      this.categories.set(cats);
      this.products.set(prods.items);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load products');
    } finally {
      this.loading.set(false);
    }
  }

  goCreate() {
    void this.router.navigateByUrl('/admin/products/new');
  }

  goEdit(p: Product) {
    void this.router.navigateByUrl(`/admin/products/${p._id}/edit`);
  }

  async delete(p: Product) {
    if (!confirm(`Delete product "${p.name}"?`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.productsApi.remove(p._id));
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to delete product');
    } finally {
      this.loading.set(false);
    }
  }
}



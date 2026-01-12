import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ProductsApiService, Product } from '../../shared/api/products-api.service';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { CartService } from '../../shared/cart/cart.service';
import { CartFlyService } from '../../shared/cart/cart-fly.service';

@Component({
  selector: 'app-product-detail-api',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './product-detail-api.component.html',
  styleUrl: './product-detail-api.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailApiComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductsApiService);
  readonly cart = inject(CartService);
  private readonly cartFly = inject(CartFlyService);

  @ViewChild('heroImg', { read: ElementRef }) private readonly heroImg?: ElementRef<HTMLElement>;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly id = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  readonly qty = signal(1);

  readonly product = signal<Product | null>(null);
  readonly related = signal<Product[]>([]);

  readonly heroImage = computed(() => this.product()?.productImageUrl ?? null);

  constructor() {
    this.route.paramMap.subscribe(() => void this.load());
  }

  async load(): Promise<void> {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const p = await firstValueFrom(this.productsApi.getById(id));
      this.product.set(p);

      const rel = await firstValueFrom(this.productsApi.list({ limit: 8 }));
      this.related.set(rel.items.filter((x) => x._id !== id).slice(0, 6));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load product');
      this.product.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  dec(): void {
    this.qty.update((v) => Math.max(1, v - 1));
  }

  inc(): void {
    this.qty.update((v) => Math.min(99, v + 1));
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;

    this.cartFly.flyFromElement(this.heroImg?.nativeElement ?? null, this.heroImage() ?? p.productImageUrl ?? null);

    this.cart.add(
      {
        id: p._id,
        title: p.name,
        price: p.price,
        imageUrl: p.productImageUrl ?? null,
      },
      this.qty(),
    );
  }

  formatPrice(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }
}



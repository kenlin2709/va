import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findProductBySlug, PRODUCT_CATALOG, type Product } from '../../shared/product-catalog';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { CartService } from '../../shared/cart/cart.service';
import { CartFlyService } from '../../shared/cart/cart-fly.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly cart = inject(CartService);
  private readonly cartFly = inject(CartFlyService);

  @ViewChild('heroImg', { read: ElementRef }) private readonly heroImg?: ElementRef<HTMLElement>;

  readonly slug = signal<string>('');
  readonly qty = signal(1);

  readonly product = computed<Product | null>(() => {
    const s = this.slug();
    return s ? findProductBySlug(s) ?? null : null;
  });

  readonly heroImage = computed(() => this.product()?.images?.[0] ?? null);

  // Simple “You may also like” list from our demo catalog.
  readonly related = computed(() => {
    const current = this.slug();
    return PRODUCT_CATALOG.filter((p) => p.slug !== current).slice(0, 6);
  });

  constructor() {
    // Pull slug from URL
    const s = this.route.snapshot.paramMap.get('slug') ?? '';
    this.slug.set(s);
  }

  dec(): void {
    this.qty.update((v) => Math.max(1, v - 1));
  }

  inc(): void {
    this.qty.update((v) => Math.min(99, v + 1));
  }

  formatPrice(n: number): string {
    return `$${n.toFixed(2)}`;
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;

    this.cartFly.flyFromElement(this.heroImg?.nativeElement ?? null, this.heroImage() ?? p.images?.[0] ?? null);

    this.cart.add(
      {
        id: p.slug,
        title: p.title,
        price: p.price,
        imageUrl: p.images?.[0] ?? null,
      },
      this.qty(),
    );
  }
}






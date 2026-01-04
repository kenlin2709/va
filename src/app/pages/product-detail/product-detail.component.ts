import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findProductBySlug, PRODUCT_CATALOG, type Product } from '../../shared/product-catalog';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';

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
}




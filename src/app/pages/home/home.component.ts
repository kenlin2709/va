import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { PRODUCT_CATALOG } from '../../shared/product-catalog';
import { firstValueFrom } from 'rxjs';
import { CategoriesApiService, Category } from '../../shared/api/categories-api.service';
import { CartService } from '../../shared/cart/cart.service';

type Product = { name: string; category: string; price: string; imageUrl?: string };
type Feature = { title: string; description: string; icon: 'flask' | 'cherries' | 'cloud' };
type HeroSlide = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  tone: 'dessert' | 'tobacco' | 'fruit';
  imageUrl: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly cart = inject(CartService);

  readonly bestSellerBreakpoints = {
    900: { slidesPerView: 3, spaceBetween: 64 },
    1280: { slidesPerView: 4, spaceBetween: 64 },
  } as const;

  readonly heroSlides: HeroSlide[] = [
    {
      title: 'Sweet. Smooth.\nDecadent.',
      subtitle: 'Indulge in rich, dessert-inspired blends like vanilla custard, apple crumble, and chocolate.',
      cta: 'Shop Here',
      href: '#',
      tone: 'dessert',
      imageUrl: '/images/hero/20250618456-2-scaled.jpg'
    },
    {
      title: 'Classic. Smooth.\nRefined.',
      subtitle: 'Discover rich tobacco notes crafted for the authentic taste you know and love.',
      cta: 'Shop Here',
      href: '#',
      tone: 'tobacco',
      imageUrl: '/images/hero/20250618456-4-scaled.jpg'
    },
    {
      title: 'Fresh. Juicy.\nUnforgettable.',
      subtitle: 'Bursting with flavour—sweet, tangy, and always refreshing.',
      cta: 'Shop Here',
      href: '#',
      tone: 'fruit',
      imageUrl: '/images/hero/54846548.jpg'
    },
    {
      title: 'Lab-Crafted.\nAustralian.',
      subtitle: 'Premium blends made for smooth hits, bold flavour, and reliable performance.',
      cta: 'Shop Here',
      href: '#',
      tone: 'dessert',
      imageUrl: '/images/hero/home-2-06-2048x1158.jpg'
    },
  ];

  readonly heroIndex = signal(0);

  private autoTimer: number | null = null;

  // swipe tracking
  private swipePointerId: number | null = null;
  private swipeStartX = 0;
  private swipeStartY = 0;

  readonly apiCategories = signal<Category[]>([]);

  readonly collectionsForView = computed(() => {
    const cats = this.apiCategories();
    if (!cats.length) {
      // SSR/prerender + initial load fallback
      return [
        { title: 'All Products', href: '/collections/all-products', imageUrl: '/images/hero/20250618456-2-scaled.jpg' },
        { title: 'Desserts', href: '/collections/desserts', imageUrl: '/images/hero/20250618456-4-scaled.jpg' },
        { title: 'Energy', href: '/collections/energy', imageUrl: '/images/hero/54846548.jpg' },
        { title: 'Fruit', href: '/collections/fruit', imageUrl: '/images/hero/home-2-06-2048x1158.jpg' },
        { title: 'Tobacco', href: '/collections/tobacco', imageUrl: '/images/hero/20250618456-2-scaled.jpg' },
        { title: 'Party Mix', href: '/collections/party-mix', imageUrl: '/images/hero/54846548.jpg' },
      ];
    }

    // Keep "All Products" first if it exists
    const sorted = [...cats].sort((a, b) => {
      if (a.name === 'All Products') return -1;
      if (b.name === 'All Products') return 1;
      return a.name.localeCompare(b.name);
    });

    return sorted.slice(0, 6).map((c) => ({
      title: c.name,
      href: c.name === 'All Products' ? '/collections/all-products' : `/collections/${this.slugify(c.name)}`,
      imageUrl: c.categoryImageUrl ?? '',
    }));
  });

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.startAutoRotate();
    void this.loadCategories();
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
  }

  setHeroIndex(i: number): void {
    const n = this.heroSlides.length;
    const next = ((i % n) + n) % n;
    this.heroIndex.set(next);
    this.restartAutoRotate();
  }

  nextHero(): void {
    this.setHeroIndex(this.heroIndex() + 1);
  }

  prevHero(): void {
    this.setHeroIndex(this.heroIndex() - 1);
  }

  onHeroPointerDown(ev: PointerEvent): void {
    // Ignore non-primary pointers
    if ((ev as any).isPrimary === false) return;
    if (this.swipePointerId !== null) return;

    this.swipePointerId = ev.pointerId;
    this.swipeStartX = ev.clientX;
    this.swipeStartY = ev.clientY;
  }

  onHeroPointerUp(ev: PointerEvent): void {
    if (this.swipePointerId !== ev.pointerId) return;
    this.swipePointerId = null;

    const dx = ev.clientX - this.swipeStartX;
    const dy = ev.clientY - this.swipeStartY;

    // horizontal swipe threshold, don’t hijack vertical scroll
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dx) <= Math.abs(dy)) return;

    if (dx < 0) this.nextHero();
    else this.prevHero();
  }

  private startAutoRotate(): void {
    this.stopAutoRotate();
    this.autoTimer = window.setInterval(() => {
      this.heroIndex.update((v) => (v + 1) % this.heroSlides.length);
    }, 5500);
  }

  private stopAutoRotate(): void {
    if (this.autoTimer === null) return;
    window.clearInterval(this.autoTimer);
    this.autoTimer = null;
  }

  private restartAutoRotate(): void {
    if (!this.isBrowser) return;
    this.startAutoRotate();
  }

  private async loadCategories(): Promise<void> {
    try {
      const cats = await firstValueFrom(this.categoriesApi.list());
      this.apiCategories.set(cats);
    } catch {
      // keep fallback
    }
  }

  readonly bestSellers = PRODUCT_CATALOG.map((p) => ({
    slug: p.slug,
    name: p.title,
    price: `$${p.price.toFixed(2)}`,
    imageUrl: p.images[0],
    priceNumber: p.price,
  }));

  readonly features: Feature[] = [
    {
      title: 'Perfect PG/VG Balance',
      description:
        'Every bottle is formulated with an ideal ratio for consistent vapour density and reliable performance—every single time.',
      icon: 'flask'
    },
    {
      title: 'Unforgettable Flavours',
      description:
        'Inspired by fruits, desserts, drinks, and classics—each flavour is crafted to be vibrant, true-to-taste, and satisfying.',
      icon: 'cherries'
    },
    {
      title: 'Smooth & Satisfying',
      description:
        'Rich texture and flawless consistency for smooth throat hits and dense clouds—without compromise.',
      icon: 'cloud'
    }
  ];

  readonly discoverAll: Product[] = [
    { name: 'Cloudy Apple Vape Juice', category: 'Fruit', price: '$26.95' },
    { name: 'Bonkers Banana Vape Juice', category: 'Fruit', price: '$26.95' },
    { name: 'Blackberry Blast Fruit Vape Juice', category: 'Fruit', price: '$26.95' },
    { name: 'Fuji Apple Vape Juice', category: 'Fruit', price: '$26.95' },
    { name: 'Vanilla Custard Vape juice', category: 'Dessert', price: '$26.95' },
    { name: 'Espresso Vape Juice', category: 'Energy', price: '$26.95' },
    { name: 'Grapezilla Vape Juice', category: 'Fruit', price: '$26.95' },
    { name: 'Raging Raspberry Vape Juice', category: 'Fruit', price: '$26.95' }
  ];

  addBestSellerToCart(p: { slug: string; name: string; priceNumber: number; imageUrl?: string }): void {
    this.cart.add(
      {
        id: p.slug,
        title: p.name,
        price: p.priceNumber,
        imageUrl: p.imageUrl ?? null,
      },
      1,
    );
  }
}



import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { PRODUCT_CATALOG } from '../../shared/product-catalog';
import { firstValueFrom } from 'rxjs';
import { CategoriesApiService, Category } from '../../shared/api/categories-api.service';
import { ProductsApiService } from '../../shared/api/products-api.service';
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
  private readonly productsApi = inject(ProductsApiService);
  private readonly cart = inject(CartService);

  readonly bestSellerBreakpoints = {
    900: { slidesPerView: 3, spaceBetween: 64 },
    1280: { slidesPerView: 4, spaceBetween: 64 },
  } as const;

  readonly heroSlides: HeroSlide[] = [
    {
      title: 'Cool. Crisp.\nUnforgettable.',
      subtitle: 'Experience an icy menthol blast with MAC Cool Blast Super Slims — pure refreshment in every draw.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'fruit',
      imageUrl: '/images/hero/hero-01.jpg',
    },
    {
      title: 'Silky. Smooth.\nIconic.',
      subtitle: 'AURE delivers a classic experience at an affordable price — silk-smooth flavour with every puff.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-02.jpg',
    },
    {
      title: 'Bold. Intense.\nElectrifying.',
      subtitle: 'Crush the Peel Scorpion capsule for a rush of bold flavour and long-lasting satisfaction.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'fruit',
      imageUrl: '/images/hero/hero-03.jpg',
    },
    {
      title: 'Two Flavours.\nDouble the Burst.',
      subtitle: 'Switch between Applemint and Orange with ESSE Change Double — twin capsules, one perfect smoke.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'fruit',
      imageUrl: '/images/hero/hero-04.jpg',
    },
    {
      title: 'Refined. Elegant.\nEffortless.',
      subtitle: 'AURE blends timeless craftsmanship with everyday value — silky smooth, classically refined.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-05.jpg',
    },
    {
      title: 'Refresh.\nEvery Moment.',
      subtitle: 'Cool menthol meets a slim, elegant silhouette — ESSE Menthol Super Slim, refreshing from first puff to last.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'fruit',
      imageUrl: '/images/hero/hero-06.jpg',
    },
    {
      title: 'Rich. Smooth.\nSatisfying.',
      subtitle: 'Gold Pin Mixpod\'s fresh-seal pack delivers premium flavour and satisfying depth in every draw.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-07.jpg',
    },
    {
      title: 'Iconic Taste.\nTime-Honoured Quality.',
      subtitle: 'Zhonghua carries a legacy of smooth, rich tradition — heritage in every carefully crafted blend.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-08.jpg',
    },
    {
      title: 'Classic Trust.\nSince 1906.',
      subtitle: 'Shuangxi premium cigarettes deliver smooth, mellow, and rich flavour — over a century of craftsmanship.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-09.jpg',
    },
    {
      title: 'Rich. Refined.\nFull-Bodied.',
      subtitle: 'Crush the Peel Red Wine capsule and unlock a smooth, aromatic red-wine experience — perfectly balanced.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'dessert',
      imageUrl: '/images/hero/hero-10.jpg',
    },
    {
      title: 'Limited Edition.\nGolden Style.',
      subtitle: 'Manchester Queen Gold blends quality and elegance — rich, smooth, and satisfying with every draw.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-11.jpg',
    },
    {
      title: 'Smooth Draw.\nPure Enjoyment.',
      subtitle: 'Crafted for a smooth, rich taste — savour every moment with our trusted Australian blends.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-12.jpg',
    },
    {
      title: 'Silky Smooth.\nClassic Experience.',
      subtitle: 'AURE brings affordable luxury — timeless flavour with the polish of fine craftsmanship.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-13.jpg',
    },
    {
      title: 'Japanese Craftsmanship.\nRefined Pleasure.',
      subtitle: 'Mevius delivers smooth, rich, and satisfying taste — precision-blended for the discerning smoker.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-14.jpg',
    },
    {
      title: 'Bold. Mysterious.\nPremium.',
      subtitle: 'AURE in purple — silky smooth and full-flavoured, made in Indonesia for the bold at heart.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-15.jpg',
    },
    {
      title: 'Light. Refined.\nIconic.',
      subtitle: 'ESSE Lights Super Slim — the iconic choice for a smooth, mild taste with a refined finish.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-16.jpg',
    },
    {
      title: 'Iconic Taste.\nTimeless Choice.',
      subtitle: 'Marlboro — rich, smooth, and satisfying. The world\'s most loved blend, bold and unmistakable.',
      cta: 'Shop Here',
      href: '/collections/all-products',
      tone: 'tobacco',
      imageUrl: '/images/hero/hero-17.jpg',
    },
  ];

  readonly heroIndex = signal(0);

  private autoTimer: number | null = null;

  // swipe tracking
  private swipePointerId: number | null = null;
  private swipeStartX = 0;
  private swipeStartY = 0;

  readonly apiCategories = signal<Category[]>([]);
  readonly apiProducts = signal<any[]>([]);

  readonly collectionsForView = computed(() => {
    const cats = this.apiCategories();
    if (!cats.length) {
      // SSR/prerender + initial load fallback
      return [
        { title: 'All Products', href: '/collections/all-products', imageUrl: '/images/hero/hero-01.jpg' },
        { title: 'Desserts', href: '/collections/desserts', imageUrl: '/images/hero/hero-02.jpg' },
        { title: 'Energy', href: '/collections/energy', imageUrl: '/images/hero/hero-03.jpg' },
        { title: 'Fruit', href: '/collections/fruit', imageUrl: '/images/hero/hero-04.jpg' },
        { title: 'Tobacco', href: '/collections/tobacco', imageUrl: '/images/hero/hero-01.jpg' },
        { title: 'Party Mix', href: '/collections/party-mix', imageUrl: '/images/hero/hero-03.jpg' },
      ];
    }

    // Keep "All Products" first if it exists
    const sorted = [...cats].sort((a, b) => {
      if (a.name === 'All Products') return -1;
      if (b.name === 'All Products') return 1;
      return a.name.localeCompare(b.name);
    });

    return sorted.map((c) => ({
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
    void this.loadProducts();
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

  private async loadProducts(): Promise<void> {
    try {
      const products = await firstValueFrom(this.productsApi.list({ limit: 200 }));
      this.apiProducts.set(products.items);
    } catch {
      // keep fallback to static catalog
    }
  }

  readonly bestSellers = computed(() => {
    const apiProducts = this.apiProducts();
    if (apiProducts.length > 0) {
      return [...apiProducts]
        .sort((a: any, b: any) => a.price - b.price)
        .slice(0, 8)
        .map((p: any) => ({
          slug: p._id,
          name: p.name,
          price: `$${p.price.toFixed(2)}`,
          imageUrl: p.productImageUrl || '',
          priceNumber: p.price,
        }));
    }
    // Fallback to static catalog
    return [...PRODUCT_CATALOG]
      .sort((a, b) => a.price - b.price)
      .map((p) => ({
        slug: p.slug,
        name: p.title,
        price: `$${p.price.toFixed(2)}`,
        imageUrl: p.images[0],
        priceNumber: p.price,
      }));
  });

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



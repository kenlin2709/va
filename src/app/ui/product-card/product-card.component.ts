import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartFlyService } from '../../shared/cart/cart-fly.service';

export type ProductCardAddMode = 'icon' | 'text' | 'none';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly cartFly = inject(CartFlyService);

  @Input({ required: true }) title!: string;
  @Input({ required: true }) price!: string;
  @Input() imageUrl: string | null = null;
  @Input() imageAlt: string | null = null;
  /** When set, the whole card becomes a link (SPA navigation). */
  @Input() link: string | null = null;

  /** `icon` = floating add button; `text` = button under price */
  @Input() addMode: ProductCardAddMode = 'icon';
  @Input() addLabel = '+ Add To Cart';
  @Input() addAriaLabel = 'Add to cart';

  @Output() add = new EventEmitter<void>();

  onAddClick(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();

    const host = this.el.nativeElement as HTMLElement;
    const img = host.querySelector('.pc__img') as HTMLElement | null;
    this.cartFly.flyFromElement(img ?? (ev.currentTarget as HTMLElement | null), this.imageUrl);

    this.add.emit();
  }
}



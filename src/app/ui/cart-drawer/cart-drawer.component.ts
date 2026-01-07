import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CartService } from '../../shared/cart/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartDrawerComponent {
  readonly cart = inject(CartService);
  private readonly router = inject(Router);

  close(): void {
    this.cart.close();
  }

  async goCheckout(): Promise<void> {
    this.cart.close();
    await this.router.navigateByUrl('/checkout');
  }
}



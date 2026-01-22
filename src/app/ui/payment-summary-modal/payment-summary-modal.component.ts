import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../shared/api/orders-api.service';

@Component({
  selector: 'app-payment-summary-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-summary-modal.component.html',
  styleUrl: './payment-summary-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSummaryModalComponent {
  readonly order = input<Order | null>(null);
  readonly close = output<void>();

  readonly isOpen = computed(() => this.order() !== null);

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  onClose(): void {
    this.close.emit();
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { OrdersApiService, MonthlyStat, CategoryStat } from '../../shared/api/orders-api.service';

@Component({
  selector: 'app-admin-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-sales.component.html',
  styleUrl: './admin-sales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSalesComponent {
  private readonly api = inject(OrdersApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly monthlyStats = signal<MonthlyStat[]>([]);
  readonly categoryStats = signal<CategoryStat[]>([]);

  readonly selectedYear = signal<number | 'all'>('all');

  readonly availableYears = computed(() => {
    const years = new Set<number>();
    this.monthlyStats().forEach(s => years.add(s.year));
    return Array.from(years).sort((a, b) => b - a);
  });

  readonly filteredMonthlyStats = computed(() => {
    const year = this.selectedYear();
    const stats = this.monthlyStats();
    if (year === 'all') return stats;
    return stats.filter(s => s.year === year);
  });

  readonly monthlyTotals = computed(() => {
    const stats = this.filteredMonthlyStats();
    return {
      totalSalesValue: stats.reduce((sum, s) => sum + s.totalSalesValue, 0),
      totalCouponUsed: stats.reduce((sum, s) => sum + s.totalCouponUsed, 0),
      totalMoneyReceived: stats.reduce((sum, s) => sum + s.totalMoneyReceived, 0),
      canceledValue: stats.reduce((sum, s) => sum + s.canceledValue, 0),
      refundValue: stats.reduce((sum, s) => sum + s.refundValue, 0),
      orderCount: stats.reduce((sum, s) => sum + s.orderCount, 0),
    };
  });

  readonly categoryTotals = computed(() => {
    const stats = this.categoryStats();
    return {
      totalSalesValue: stats.reduce((sum, s) => sum + s.totalSalesValue, 0),
      totalCouponUsed: stats.reduce((sum, s) => sum + s.totalCouponUsed, 0),
      totalMoneyReceived: stats.reduce((sum, s) => sum + s.totalMoneyReceived, 0),
      canceledValue: stats.reduce((sum, s) => sum + s.canceledValue, 0),
      refundValue: stats.reduce((sum, s) => sum + s.refundValue, 0),
    };
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.api.getSalesAnalytics());
      this.monthlyStats.set(data.monthlyStats);
      this.categoryStats.set(data.categoryStats);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load sales data');
    } finally {
      this.loading.set(false);
    }
  }

  setYear(value: string): void {
    this.selectedYear.set(value === 'all' ? 'all' : parseInt(value, 10));
  }

  formatMoney(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  formatMonth(year: number, month: number): string {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short' });
  }
}

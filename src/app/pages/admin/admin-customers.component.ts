import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CustomersApiService, Customer } from '../../shared/api/customers-api.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCustomersComponent {
  private readonly api = inject(CustomersApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly q = signal('');

  readonly filtered = computed(() => {
    const term = this.q().trim().toLowerCase();
    const items = this.customers();
    if (!term) return items;
    return items.filter((c) => {
      const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim().toLowerCase();
      return (
        c.email.toLowerCase().includes(term) ||
        name.includes(term) ||
        (c.phone ?? '').toLowerCase().includes(term)
      );
    });
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const items = await firstValueFrom(this.api.list());
      this.customers.set(items);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load customers');
    } finally {
      this.loading.set(false);
    }
  }

  setQuery(value: string): void {
    this.q.set(value);
  }

  displayName(c: Customer): string {
    const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
    return name || '—';
  }
}




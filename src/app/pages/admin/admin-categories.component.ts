import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoriesApiService, Category } from '../../shared/api/categories-api.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent {
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly categories = signal<Category[]>([]);

  constructor() {
    void this.reload();
  }

  async reload() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const cats = await firstValueFrom(this.categoriesApi.list());
      this.categories.set(cats);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load categories');
    } finally {
      this.loading.set(false);
    }
  }

  goCreate() {
    void this.router.navigateByUrl('/admin/categories/new');
  }

  goEdit(c: Category) {
    void this.router.navigateByUrl(`/admin/categories/${c._id}/edit`);
  }

  async delete(c: Category) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.categoriesApi.remove(c._id));
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to delete category');
    } finally {
      this.loading.set(false);
    }
  }
}



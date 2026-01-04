import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoriesApiService } from '../../shared/api/categories-api.service';

@Component({
  selector: 'app-admin-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-category-form.component.html',
  styleUrl: './admin-category-form.component.scss',
})
export class AdminCategoryFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriesApi = inject(CategoriesApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly uploading = signal(false);

  readonly categoryId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => !!this.categoryId());

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    // Backwards-compat: older UI versions referenced this control. We keep it so the form
    // never throws "Cannot find control with name: 'categoryImageUrl'".
    categoryImageUrl: new FormControl<string>('', { nonNullable: true }),
  });

  private selectedImage: File | null = null;
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly existingImageUrl = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const id = this.categoryId();
      if (id) {
        const c = await firstValueFrom(this.categoriesApi.getById(id));
        this.form.setValue({
          name: c.name,
          description: c.description ?? '',
          categoryImageUrl: c.categoryImageUrl ?? '',
        });
        this.existingImageUrl.set(c.categoryImageUrl ?? null);
      } else {
        this.form.reset({ name: '', description: '', categoryImageUrl: '' });
        this.existingImageUrl.set(null);
      }
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load category form');
    } finally {
      this.loading.set(false);
    }
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.uploading.set(!!this.selectedImage);
    try {
      const id = this.categoryId();
      const image = this.selectedImage;

      if (image) {
        const form = new FormData();
        form.append('name', this.form.controls.name.value);
        if (this.form.controls.description.value) form.append('description', this.form.controls.description.value);
        form.append('image', image);

        if (id) await firstValueFrom(this.categoriesApi.updateMultipart(id, form));
        else await firstValueFrom(this.categoriesApi.createMultipart(form));
      } else {
        const payload = {
          name: this.form.controls.name.value,
          description: this.form.controls.description.value || undefined,
        };
        if (id) await firstValueFrom(this.categoriesApi.update(id, payload));
        else await firstValueFrom(this.categoriesApi.create(payload));
      }

      await this.router.navigateByUrl('/admin/categories');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to save category');
    } finally {
      this.loading.set(false);
      this.uploading.set(false);
      this.selectedImage = null;
      this.revokePreviewUrl();
    }
  }

  onImageSelected(ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    this.selectedImage = file;
    this.revokePreviewUrl();
    this.imagePreviewUrl.set(URL.createObjectURL(file));
    if (input) input.value = '';
  }

  private revokePreviewUrl() {
    const url = this.imagePreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.imagePreviewUrl.set(null);
  }
}



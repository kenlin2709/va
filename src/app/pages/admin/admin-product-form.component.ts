import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CategoriesApiService, Category } from '../../shared/api/categories-api.service';
import { ProductsApiService } from '../../shared/api/products-api.service';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
})
export class AdminProductFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly uploading = signal(false); // file is uploaded during Save

  readonly categories = signal<Category[]>([]);
  private allProductsCategoryId: string | null = null;
  private selectedImage: File | null = null;
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly existingImageUrl = signal<string | null>(null);

  readonly productId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => !!this.productId());

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    categoryIds: new FormControl<string[]>([], { nonNullable: true }),
    productImageUrl: new FormControl<string>('', { nonNullable: true }),
    stockQty: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] }),
    description: new FormControl<string>('', { nonNullable: true }),
    disclaimer: new FormControl<string>('', { nonNullable: true }),
  });

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
      const cats = await firstValueFrom(this.categoriesApi.list());
      this.categories.set(cats);
      this.allProductsCategoryId =
        cats.find((c) => c.name.trim().toLowerCase() === 'all products')?._id ?? null;

      const id = this.productId();
      if (id) {
        const p = await firstValueFrom(this.productsApi.getById(id));
        this.form.setValue({
          name: p.name,
          price: p.price,
          categoryIds: p.categoryIds ?? (p.categoryId ? [p.categoryId] : []),
          productImageUrl: p.productImageUrl ?? '',
          stockQty: p.stockQty ?? 0,
          description: p.description ?? '',
          disclaimer: p.disclaimer ?? '',
        });
        this.ensureAllProductsSelected();
        this.existingImageUrl.set(p.productImageUrl ?? null);
      } else {
        this.form.reset({
          name: '',
          price: 0,
          categoryIds: [],
          productImageUrl: '',
          stockQty: 0,
          description: '',
          disclaimer: '',
        });
        this.ensureAllProductsSelected(true);
        this.existingImageUrl.set(null);
      }
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load product form');
    } finally {
      this.loading.set(false);
    }
  }

  async submit() {
    if (this.form.invalid) return;
    this.ensureAllProductsSelected();
    this.loading.set(true);
    this.error.set(null);
    this.uploading.set(!!this.selectedImage);
    try {
      const id = this.productId();
      const image = this.selectedImage;

      // If an image is selected, submit multipart so backend can upload + set productImageUrl.
      if (image) {
        const form = new FormData();
        form.append('name', this.form.controls.name.value);
        form.append('price', String(this.form.controls.price.value));
        if (this.form.controls.categoryIds.value.length)
          form.append('categoryIds', JSON.stringify(this.form.controls.categoryIds.value));
        form.append('stockQty', String(this.form.controls.stockQty.value ?? 0));
        if (this.form.controls.description.value) form.append('description', this.form.controls.description.value);
        if (this.form.controls.disclaimer.value) form.append('disclaimer', this.form.controls.disclaimer.value);
        form.append('image', image);

        if (id) await firstValueFrom(this.productsApi.updateMultipart(id, form));
        else await firstValueFrom(this.productsApi.createMultipart(form));
      } else {
        const payload = {
          name: this.form.controls.name.value,
          price: this.form.controls.price.value,
          categoryIds: this.form.controls.categoryIds.value.length ? this.form.controls.categoryIds.value : undefined,
          stockQty: this.form.controls.stockQty.value ?? 0,
          description: this.form.controls.description.value || undefined,
          disclaimer: this.form.controls.disclaimer.value || undefined,
        };

        if (id) await firstValueFrom(this.productsApi.update(id, payload));
        else await firstValueFrom(this.productsApi.create(payload));
      }

      await this.router.navigateByUrl('/admin/products');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? 'Failed to save product');
    } finally {
      this.loading.set(false);
      this.uploading.set(false);
      this.selectedImage = null;
      this.revokePreviewUrl();
    }
  }

  async onImageSelected(ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    this.selectedImage = file;
    this.revokePreviewUrl();
    this.imagePreviewUrl.set(URL.createObjectURL(file));
    if (input) input.value = '';
  }

  toggleCategory(id: string, checked: boolean) {
    // "All Products" must always remain selected.
    if (this.allProductsCategoryId && id === this.allProductsCategoryId && !checked) {
      this.ensureAllProductsSelected();
      return;
    }
    const next = new Set(this.form.controls.categoryIds.value ?? []);
    if (checked) next.add(id);
    else next.delete(id);
    this.form.controls.categoryIds.setValue([...next]);
  }

  isAllProductsCategory(id: string): boolean {
    return !!this.allProductsCategoryId && id === this.allProductsCategoryId;
  }

  private ensureAllProductsSelected(forceIfEmpty = false): void {
    if (!this.allProductsCategoryId) return;
    const current = this.form.controls.categoryIds.value ?? [];
    if (!current.length && !forceIfEmpty) return;
    if (current.includes(this.allProductsCategoryId)) return;
    this.form.controls.categoryIds.setValue([this.allProductsCategoryId, ...current]);
  }

  private revokePreviewUrl() {
    const url = this.imagePreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.imagePreviewUrl.set(null);
  }
}



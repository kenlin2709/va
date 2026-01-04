import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api.tokens';

export type Product = {
  _id: string;
  name: string;
  price: number;
  categoryId?: string;
  productImageUrl?: string;
  description?: string;
  disclaimer?: string;
  stockQty: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Paged<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getById(id: string) {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }

  list(opts?: { q?: string; categoryId?: string; page?: number; limit?: number }) {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.categoryId) params = params.set('categoryId', opts.categoryId);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.limit) params = params.set('limit', String(opts.limit));

    return this.http.get<Paged<Product>>(`${this.baseUrl}/products`, { params });
  }

  create(body: {
    name: string;
    price: number;
    categoryId?: string;
    productImageUrl?: string;
    description?: string;
    disclaimer?: string;
    stockQty?: number;
  }) {
    return this.http.post<Product>(`${this.baseUrl}/products`, body);
  }

  createMultipart(form: FormData) {
    return this.http.post<Product>(`${this.baseUrl}/products`, form);
  }

  update(
    id: string,
    body: Partial<{
      name: string;
      price: number;
      categoryId?: string;
      productImageUrl?: string;
      description?: string;
      disclaimer?: string;
      stockQty: number;
    }>,
  ) {
    return this.http.patch<Product>(`${this.baseUrl}/products/${id}`, body);
  }

  updateMultipart(id: string, form: FormData) {
    return this.http.patch<Product>(`${this.baseUrl}/products/${id}`, form);
  }

  remove(id: string) {
    return this.http.delete<{ deleted: true }>(`${this.baseUrl}/products/${id}`);
  }
}



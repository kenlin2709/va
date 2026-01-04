import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.tokens';

export type Category = {
  _id: string;
  name: string;
  description?: string;
  categoryImageUrl?: string;
};

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getById(id: string) {
    return this.http.get<Category>(`${this.baseUrl}/categories/${id}`);
  }

  list() {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  create(body: { name: string; description?: string; categoryImageUrl?: string }) {
    return this.http.post<Category>(`${this.baseUrl}/categories`, body);
  }

  createMultipart(form: FormData) {
    return this.http.post<Category>(`${this.baseUrl}/categories`, form);
  }

  update(id: string, body: { name?: string; description?: string; categoryImageUrl?: string }) {
    return this.http.patch<Category>(`${this.baseUrl}/categories/${id}`, body);
  }

  updateMultipart(id: string, form: FormData) {
    return this.http.patch<Category>(`${this.baseUrl}/categories/${id}`, form);
  }

  remove(id: string) {
    return this.http.delete<{ deleted: true }>(`${this.baseUrl}/categories/${id}`);
  }
}



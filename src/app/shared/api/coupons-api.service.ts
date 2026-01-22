import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from './api.tokens';

export type Coupon = {
  _id: string;
  code: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  value: number;
  isUsed: boolean;
  usedInOrderId?: string;
  expiryDate?: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCouponRequest = {
  customerId: string;
  value: number;
  expiryDate?: string;
  description?: string;
};

export type UpdateCouponRequest = {
  value?: number;
  active?: boolean;
  expiryDate?: string;
  description?: string;
};

export type ValidateCouponResponse = {
  code: string;
  value: number;
  description?: string;
};

@Injectable({ providedIn: 'root' })
export class CouponsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // Customer endpoints
  listMine() {
    return this.http.get<Coupon[]>(`${this.baseUrl}/coupons/my`);
  }

  validate(code: string) {
    return this.http.get<ValidateCouponResponse>(`${this.baseUrl}/coupons/validate/${encodeURIComponent(code)}`);
  }

  // Admin endpoints
  listAll() {
    return this.http.get<Coupon[]>(`${this.baseUrl}/coupons`);
  }

  getById(id: string) {
    return this.http.get<Coupon>(`${this.baseUrl}/coupons/${id}`);
  }

  create(body: CreateCouponRequest) {
    return this.http.post<Coupon>(`${this.baseUrl}/coupons`, body);
  }

  update(id: string, body: UpdateCouponRequest) {
    return this.http.patch<Coupon>(`${this.baseUrl}/coupons/${id}`, body);
  }

  delete(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/coupons/${id}`);
  }
}

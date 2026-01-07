import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from './api.tokens';

export type Customer = {
  _id: string;
  email: string;
  isAdmin?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  customer: Customer;
  accessToken: string;
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  register(body: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, body);
  }

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, body);
  }

  me() {
    return this.http.get<{ customer: Customer }>(`${this.baseUrl}/auth/me`);
  }

  updateMe(body: Partial<Pick<Customer, 'firstName' | 'lastName' | 'phone' | 'shippingAddress'>>) {
    return this.http.patch<{ customer: Customer }>(`${this.baseUrl}/auth/me`, body);
  }

  changePassword(body: { currentPassword: string; newPassword: string }) {
    return this.http.patch<{ updated: true }>(`${this.baseUrl}/auth/me/password`, body);
  }
}



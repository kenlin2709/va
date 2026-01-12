import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from './api.tokens';

export type Customer = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isAdmin?: boolean;
  referralProgramId?: string;
  referralCode?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateCustomerRequest = Partial<
  Pick<Customer, 'email' | 'firstName' | 'lastName' | 'phone' | 'isAdmin' | 'referralProgramId'>
>;

@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list() {
    return this.http.get<Customer[]>(`${this.baseUrl}/customers`);
  }

  get(id: string) {
    return this.http.get<Customer>(`${this.baseUrl}/customers/${id}`);
  }

  update(id: string, body: UpdateCustomerRequest) {
    return this.http.patch<Customer>(`${this.baseUrl}/customers/${id}`, body);
  }
}



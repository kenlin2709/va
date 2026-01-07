import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from './api.tokens';

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
};

export type Order = {
  _id: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
};

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listMine() {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/my`);
  }
}



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
  orderId?: string;
  customerId: string;
  customerEmail?: string;
  customerInfo?: {
    _id?: string;
    email?: string;
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
  };
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped';
  shippingName?: string;
  shippingAddress1?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostcode?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUpdateOrderStatusRequest = {
  status: Order['status'];
};

export type AdminUpdateOrderShipmentRequest = {
  shippingCarrier?: string;
  trackingNumber?: string;
};
@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listMine() {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/my`);
  }

  getMine(orderMongoId: string) {
    return this.http.get<Order>(`${this.baseUrl}/orders/my/${orderMongoId}`);
  }

  listAll() {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  adminUpdateStatus(orderMongoId: string, body: AdminUpdateOrderStatusRequest) {
    return this.http.patch<Order>(`${this.baseUrl}/orders/${orderMongoId}/status`, body);
  }

  adminUpdateShipment(orderMongoId: string, body: AdminUpdateOrderShipmentRequest) {
    return this.http.patch<Order>(`${this.baseUrl}/orders/${orderMongoId}/shipment`, body);
  }

  create(body: {
    items: { productId: string; qty: number }[];
    shippingName?: string;
    shippingAddress1?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPostcode?: string;
  }) {
    return this.http.post<Order>(`${this.baseUrl}/orders`, body);
  }
}



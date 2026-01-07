import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { AuthApiService, Customer, LoginRequest, RegisterRequest } from '../api/auth-api.service';

const STORAGE_KEY = 'va.auth.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly accessToken = signal<string | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly isAuthenticated = computed(() => !!this.accessToken());

  constructor() {
    if (!this.isBrowser) return;
    const t = window.localStorage.getItem(STORAGE_KEY);
    if (t) this.accessToken.set(t);
  }

  async register(body: RegisterRequest): Promise<void> {
    const res = await firstValueFrom(this.api.register(body));
    this.setSession(res.accessToken, res.customer);
  }

  async login(body: LoginRequest): Promise<void> {
    const res = await firstValueFrom(this.api.login(body));
    this.setSession(res.accessToken, res.customer);
  }

  async hydrateCustomer(): Promise<void> {
    if (!this.isBrowser) return;
    if (!this.accessToken()) return;
    try {
      const res = await firstValueFrom(this.api.me());
      this.customer.set(res.customer);
    } catch {
      // token likely invalid
      this.logout();
    }
  }

  async updateMe(body: Partial<Pick<Customer, 'firstName' | 'lastName' | 'phone' | 'shippingAddress'>>): Promise<void> {
    if (!this.isBrowser) return;
    if (!this.accessToken()) return;
    const res = await firstValueFrom(this.api.updateMe(body));
    this.customer.set(res.customer);
  }

  logout(): void {
    this.accessToken.set(null);
    this.customer.set(null);
    if (this.isBrowser) window.localStorage.removeItem(STORAGE_KEY);
  }

  private setSession(token: string, customer: Customer): void {
    this.accessToken.set(token);
    this.customer.set(customer);
    if (this.isBrowser) window.localStorage.setItem(STORAGE_KEY, token);
  }
}



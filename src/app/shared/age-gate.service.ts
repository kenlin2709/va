import { PLATFORM_ID, inject, Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type AgeGateStatus = 'loading' | 'verified' | 'unverified' | 'blocked';

const STORAGE_KEY = 'ageGate.verified.v1';

@Injectable({ providedIn: 'root' })
export class AgeGateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly status = signal<AgeGateStatus>(this.isBrowser ? 'loading' : 'verified');

  constructor() {
    if (!this.isBrowser) return;

    queueMicrotask(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'yes') {
        this.status.set('verified');
      } else if (stored === 'blocked') {
        this.status.set('blocked');
      } else {
        this.status.set('unverified');
      }
    });
  }

  accept(): void {
    if (!this.isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY, 'yes');
    this.status.set('verified');
  }

  decline(): void {
    if (!this.isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY, 'blocked');
    this.status.set('blocked');
  }
}





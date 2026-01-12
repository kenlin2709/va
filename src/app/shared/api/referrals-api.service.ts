import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from './api.tokens';

export type Referral = {
  _id: string;
  name: string;
  discountType: 'percent' | 'amount';
  discountValue: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateReferralRequest = Pick<Referral, 'name' | 'discountType' | 'discountValue' | 'active'>;
export type UpdateReferralRequest = Partial<CreateReferralRequest>;

@Injectable({ providedIn: 'root' })
export class ReferralsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list() {
    return this.http.get<Referral[]>(`${this.baseUrl}/referrals`);
  }

  create(body: CreateReferralRequest) {
    return this.http.post<Referral>(`${this.baseUrl}/referrals`, body);
  }

  update(id: string, body: UpdateReferralRequest) {
    return this.http.patch<Referral>(`${this.baseUrl}/referrals/${id}`, body);
  }
}




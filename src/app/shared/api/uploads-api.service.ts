import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.tokens';

export type PresignUploadResponse = {
  uploadUrl: string;
  fileUrl: string;
  key: string;
};

export type UploadImageResponse = {
  fileUrl: string;
  key: string;
};

@Injectable({ providedIn: 'root' })
export class UploadsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  presignS3(body: { fileName: string; contentType: string; folder?: string }) {
    return this.http.post<PresignUploadResponse>(`${this.baseUrl}/uploads/s3/presign`, body);
  }

  uploadImageToS3ViaBackend(file: File, folder = 'products') {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    return this.http.post<UploadImageResponse>(`${this.baseUrl}/uploads/s3/image`, form);
  }
}



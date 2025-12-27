import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'collections/all-products',
    loadComponent: () => import('./pages/all-products/all-products.component').then((m) => m.AllProductsComponent)
  },
  {
    path: 'collections/all-products/products/:slug',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent)
  }
];

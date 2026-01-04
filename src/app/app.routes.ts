import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin/admin-products.component').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./pages/admin/admin-product-form.component').then((m) => m.AdminProductFormComponent),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./pages/admin/admin-product-form.component').then((m) => m.AdminProductFormComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin/admin-categories.component').then((m) => m.AdminCategoriesComponent),
      },
      {
        path: 'categories/new',
        loadComponent: () =>
          import('./pages/admin/admin-category-form.component').then((m) => m.AdminCategoryFormComponent),
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () =>
          import('./pages/admin/admin-category-form.component').then((m) => m.AdminCategoryFormComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
        data: { title: 'Orders', subtitle: 'Order management (coming soon)' },
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
        data: { title: 'Customers', subtitle: 'Customer management (coming soon)' },
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/admin/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
        data: { title: 'Settings', subtitle: 'Admin settings (coming soon)' },
      },
    ]
  },
  {
    path: 'collections/all-products',
    loadComponent: () => import('./pages/all-products/all-products.component').then((m) => m.AllProductsComponent)
  },
  {
    path: 'collections/:category',
    loadComponent: () => import('./pages/collection/collection.component').then((m) => m.CollectionComponent)
  },
  {
    path: 'collections/all-products/products/:slug',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent)
  }
];

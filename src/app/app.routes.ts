import { Routes } from '@angular/router';
import { adminGuard } from './shared/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'account/login',
    loadComponent: () =>
      import('./pages/account/login/account-login.component').then((m) => m.AccountLoginComponent),
  },
  {
    path: 'account/register',
    loadComponent: () =>
      import('./pages/account/register/account-register.component').then((m) => m.AccountRegisterComponent),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./pages/account/account-layout.component').then((m) => m.AccountLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'settings' },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/account/account-settings.component').then((m) => m.AccountSettingsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/account/account-orders.component').then((m) => m.AccountOrdersComponent),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./pages/account/account-coupons.component').then((m) => m.AccountCouponsComponent),
      },
      {
        path: 'referrals',
        loadComponent: () =>
          import('./pages/account/account-referral.component').then((m) => m.AccountReferralComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
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
          import('./pages/admin/admin-orders.component').then((m) => m.AdminOrdersComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/admin/admin-customers.component').then((m) => m.AdminCustomersComponent),
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () =>
          import('./pages/admin/admin-customer-form.component').then((m) => m.AdminCustomerFormComponent),
      },
      {
        path: 'referrals',
        loadComponent: () =>
          import('./pages/admin/admin-referrals.component').then((m) => m.AdminReferralsComponent),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./pages/admin/admin-coupons.component').then((m) => m.AdminCouponsComponent),
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
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail-api/product-detail-api.component').then((m) => m.ProductDetailApiComponent),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'refund-policy',
    loadComponent: () => import('./pages/refund-policy/refund-policy.component').then((m) => m.RefundPolicyComponent),
  }
];

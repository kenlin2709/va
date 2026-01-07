import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'checkout', renderMode: RenderMode.Server },
  { path: 'account', renderMode: RenderMode.Server },
  { path: 'account/settings', renderMode: RenderMode.Server },
  { path: 'account/orders', renderMode: RenderMode.Server },
  // Auth-gated pages should not be prerendered (SSR can't see localStorage tokens).
  { path: 'admin', renderMode: RenderMode.Server },
  { path: 'admin/products', renderMode: RenderMode.Server },
  { path: 'admin/products/new', renderMode: RenderMode.Server },
  { path: 'admin/categories', renderMode: RenderMode.Server },
  { path: 'admin/categories/new', renderMode: RenderMode.Server },
  { path: 'admin/orders', renderMode: RenderMode.Server },
  { path: 'admin/customers', renderMode: RenderMode.Server },
  { path: 'admin/customers/:id/edit', renderMode: RenderMode.Server },
  { path: 'admin/settings', renderMode: RenderMode.Server },
  {
    path: 'collections/all-products/products/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'products/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'collections/:category',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/products/:id/edit',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/categories/:id/edit',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];

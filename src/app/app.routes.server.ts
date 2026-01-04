import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'collections/all-products/products/:slug',
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

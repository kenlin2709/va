import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly nav = [
    { label: 'Dashboard', icon: 'dashboard', link: '/admin' },
    { label: 'Products', icon: 'box', link: '/admin/products' },
    { label: 'Categories', icon: 'tag', link: '/admin/categories' },
    { label: 'Orders', icon: 'receipt', link: '/admin/orders' },
    { label: 'Customers', icon: 'users', link: '/admin/customers' },
    { label: 'Referrals', icon: 'tag', link: '/admin/referrals' },
    { label: 'Settings', icon: 'settings', link: '/admin/settings' },
  ] as const;
}





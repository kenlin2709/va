import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../shared/auth/auth.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './account-layout.component.html',
  styleUrl: './account-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLayoutComponent {
  readonly auth = inject(AuthService);

  constructor() {
    void this.auth.hydrateCustomer();
  }
}



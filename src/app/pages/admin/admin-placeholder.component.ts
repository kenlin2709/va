import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-placeholder.component.html',
  styleUrl: './admin-placeholder.component.scss',
})
export class AdminPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  @Input() title = this.route.snapshot.data['title'] ?? 'Coming soon';
  @Input() subtitle = this.route.snapshot.data['subtitle'] ?? 'Coming soon';
}



import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-refund-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refund-policy.component.html',
  styleUrl: './refund-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RefundPolicyComponent {
  // Component logic can be added here if needed
}

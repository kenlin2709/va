import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgeGateService } from '../../shared/age-gate.service';

@Component({
  selector: 'app-age-gate-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './age-gate-modal.component.html',
  styleUrl: './age-gate-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgeGateModalComponent {
  private readonly ageGate = inject(AgeGateService);

  readonly status = this.ageGate.status;
  readonly isOpen = computed(() => this.status() === 'unverified');
  readonly isBlocked = computed(() => this.status() === 'blocked');

  accept(): void {
    this.ageGate.accept();
  }

  decline(): void {
    this.ageGate.decline();
  }
}








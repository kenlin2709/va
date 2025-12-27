import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from './ui/site-header/site-header.component';
import { SiteFooterComponent } from './ui/site-footer/site-footer.component';
import { AgeGateModalComponent } from './ui/age-gate-modal/age-gate-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, AgeGateModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('va');
}

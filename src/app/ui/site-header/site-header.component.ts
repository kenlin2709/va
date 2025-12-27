import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteHeaderComponent {
  readonly cartCount = signal(0);
  readonly isMenuOpen = signal(false);

  // Drawer animation/drag state
  readonly isDrawerVisible = signal(false);
  readonly drawerWidthPx = signal(420);
  readonly drawerX = signal(0); // 0 = open; negative = moving left (closing)
  readonly isDrawerDragging = signal(false);

  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStarted = false;
  private dragCleanup: AbortController | null = null;

  toggleMenu(): void {
    if (this.isMenuOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  closeMenu(): void {
    if (!this.isDrawerVisible()) {
      this.isMenuOpen.set(false);
      return;
    }

    // Animate out (swipe-out effect) before removing from DOM.
    this.isMenuOpen.set(false);
    this.isDrawerDragging.set(false);
    this.drawerX.set(-this.drawerWidthPx());

    window.setTimeout(() => {
      this.isDrawerVisible.set(false);
      this.drawerX.set(0);
    }, 180);
  }

  openMenu(): void {
    this.isMenuOpen.set(true);
    this.isDrawerVisible.set(true);

    // Start from off-canvas then animate in.
    this.drawerX.set(-this.drawerWidthPx());
    requestAnimationFrame(() => this.drawerX.set(0));
  }

  onDrawerPointerDown(ev: PointerEvent, panel: HTMLElement): void {
    // Only allow one active drag.
    if (this.dragPointerId !== null) return;

    // Don’t start a drag if there are multiple touches (rare with PointerEvents but safe).
    if ((ev as any).isPrimary === false) return;

    this.dragPointerId = ev.pointerId;
    this.dragStartX = ev.clientX;
    this.dragStartY = ev.clientY;
    this.dragStarted = false;

    // Measure drawer width for thresholds/limits.
    const width = panel.getBoundingClientRect().width;
    if (width > 0) this.drawerWidthPx.set(width);

    // Track move/up globally so the gesture keeps working if the pointer leaves the panel.
    this.dragCleanup?.abort();
    const ac = new AbortController();
    this.dragCleanup = ac;

    const onMove = (e: PointerEvent) => this.onDrawerPointerMove(e);
    const onUp = (e: PointerEvent) => this.onDrawerPointerUp(e);

    window.addEventListener('pointermove', onMove, { signal: ac.signal });
    window.addEventListener('pointerup', onUp, { signal: ac.signal });
    window.addEventListener('pointercancel', onUp, { signal: ac.signal });
  }

  private onDrawerPointerMove(ev: PointerEvent): void {
    if (this.dragPointerId !== ev.pointerId) return;

    const dx = ev.clientX - this.dragStartX;
    const dy = ev.clientY - this.dragStartY;

    // Don’t hijack vertical scrolling; only start once we’re confident it’s a horizontal swipe.
    if (!this.dragStarted) {
      if (Math.abs(dx) < 10) return;
      if (Math.abs(dx) <= Math.abs(dy)) return;
      this.dragStarted = true;
      this.isDrawerDragging.set(true);
    }

    ev.preventDefault();

    // Drawer is left-anchored: only allow swiping left (negative dx).
    const width = this.drawerWidthPx();
    const clamped = Math.max(-width, Math.min(0, dx));
    this.drawerX.set(clamped);
  }

  private onDrawerPointerUp(ev: PointerEvent): void {
    if (this.dragPointerId !== ev.pointerId) return;

    const width = this.drawerWidthPx();
    const x = this.drawerX();

    this.dragCleanup?.abort();
    this.dragCleanup = null;
    this.dragPointerId = null;

    const didDrag = this.dragStarted;
    this.dragStarted = false;

    if (!didDrag) return;

    this.isDrawerDragging.set(false);

    // Close if dragged past threshold; otherwise snap back open.
    if (x <= -Math.max(80, width * 0.25)) {
      this.closeMenu();
    } else {
      this.drawerX.set(0);
    }
  }
}



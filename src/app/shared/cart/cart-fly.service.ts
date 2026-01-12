import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CartFlyService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private targetEl: HTMLElement | null = null;

  registerTarget(el: HTMLElement | null): void {
    if (!this.isBrowser) return;
    this.targetEl = el;
  }

  flyFromElement(sourceEl: HTMLElement | null, imageUrl?: string | null): void {
    if (!this.isBrowser) return;
    if (!sourceEl) return;
    const rect = sourceEl.getBoundingClientRect();
    this.flyFromRect(rect, imageUrl ?? null);
  }

  flyFromRect(sourceRect: DOMRect, imageUrl: string | null): void {
    if (!this.isBrowser) return;
    const targetRect = this.getTargetRect();
    if (!targetRect) return;

    // Respect reduced motion.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      this.pulseTarget();
      return;
    }

    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const size = Math.max(18, Math.min(56, Math.min(sourceRect.width, sourceRect.height)));

    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = '14px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '99999';
    el.style.willChange = 'transform, opacity';
    el.style.transform = `translate(${startX - size / 2}px, ${startY - size / 2}px) scale(1)`;
    el.style.opacity = '1';
    el.style.boxShadow = '0 18px 50px rgba(0,0,0,0.22)';
    el.style.background = 'rgba(255,255,255,0.92)';
    el.style.border = '1px solid rgba(0,0,0,0.10)';
    if (imageUrl) {
      el.style.backgroundImage = `url("${imageUrl}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }

    document.body.appendChild(el);

    // Curved-ish path via keyframes (overshoot a bit then settle on icon).
    const midX = startX + (endX - startX) * 0.6;
    const midY = startY + (endY - startY) * 0.2 - 40;

    const anim = el.animate(
      [
        { transform: `translate(${startX - size / 2}px, ${startY - size / 2}px) scale(1)`, opacity: 1 },
        { transform: `translate(${midX - size / 2}px, ${midY - size / 2}px) scale(0.85)`, opacity: 0.9, offset: 0.55 },
        { transform: `translate(${endX - size / 2}px, ${endY - size / 2}px) scale(0.25)`, opacity: 0.0 },
      ],
      { duration: 860, easing: 'cubic-bezier(0.16, 0.9, 0.22, 1)', fill: 'forwards' },
    );

    anim.onfinish = () => {
      el.remove();
      this.pulseTarget();
    };
  }

  private pulseTarget(): void {
    if (!this.isBrowser) return;
    const target = this.getTargetEl();
    if (!target) return;

    try {
      target.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.08)' },
          { transform: 'scale(1)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)' },
      );
    } catch {
      // ignore
    }
  }

  private getTargetEl(): HTMLElement | null {
    if (!this.isBrowser) return null;
    const t = this.targetEl;
    if (t && t.isConnected) return t;
    return document.querySelector<HTMLElement>('[data-cart-target="true"]');
  }

  private getTargetRect(): DOMRect | null {
    const el = this.getTargetEl();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // If layout isn’t ready yet (0x0 at 0,0), don’t animate.
    if (!r.width || !r.height) return null;
    return r;
  }
}



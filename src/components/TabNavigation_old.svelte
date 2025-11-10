<script lang="ts">
  import { tabs } from '../lib/navigationStore';
  import { ToyBrick, Pin, MapPin } from '@lucide/svelte';
  import { push, location } from 'svelte-spa-router';
  import { onMount, tick } from 'svelte';
<script lang="ts">
  import { tabs } from '../lib/navigationStore';
  import { ToyBrick, Pin, MapPin } from '@lucide/svelte';
  import { push, location } from 'svelte-spa-router';
  import { onMount, tick } from 'svelte';

  const iconMap = { ToyBrick, Pin, MapPin };

  // Container reference
  let containerEl: HTMLElement;
  // Tab element references
  let tabEls: Record<string, HTMLElement> = {};

  // Reference to the underline element
  let indicatorEl: HTMLElement | null = null;
  // Keep last known target geometry
  let prevLeft = 0;
  let prevWidth = 0;
  let hasInitialized = false;
  let runningAnim: Animation | null = null;

  // Map route to current tab id (single source of truth = route)
  $: currentTabId = $location === '/experiments'
      ? 'experiments'
      : $location === '/eindhoven'
      ? 'eindhoven'
      : 'projects';

  // Switch tabs
  function switchTab(tabId: string) {
    if (tabId === 'projects') push('/projects');
    else if (tabId === 'experiments') push('/experiments');
    else if (tabId === 'eindhoven') push('/eindhoven');
  }

  // Move underline with Web Animations API using live measurements
  async function moveIndicator() {
    await tick(); // ensure DOM updated for new active class/layout
    const activeEl = tabEls[currentTabId];
    if (!containerEl || !activeEl) {
      return;
    }

    const cRect = containerEl.getBoundingClientRect();
    const tRect = activeEl.getBoundingClientRect();
    const toLeft = tRect.left - cRect.left;
    const toWidth = tRect.width; // underline width

    // Ensure indicator element
    const el = indicatorEl ?? (indicatorEl = containerEl.querySelector('.sliding-border') as HTMLElement | null);
    if (!el) {
      return;
    }

    // Determine current visual position (accounts for transforms if animating)
    const iRect = el.getBoundingClientRect();
    let fromLeft = iRect.width > 0 ? iRect.left - cRect.left : prevLeft;
    let fromWidth = iRect.width > 0 ? iRect.width : prevWidth || toWidth;

    // First-time setup: snap without animation
    if (!hasInitialized || iRect.width === 0 || el.style.opacity === '0') {
      el.style.opacity = '1';
      el.style.transform = `translateX(${toLeft}px)`;
      el.style.width = `${toWidth}px`;
      el.style.height = `2px`;
      hasInitialized = true;
      prevLeft = toLeft;
      prevWidth = toWidth;
      return;
    }

    // If an animation is running, cancel to capture current state properly
    if (runningAnim) {
      try { runningAnim.cancel(); } catch {}
      // Re-measure after cancel
      const cur = el.getBoundingClientRect();
      fromLeft = cur.left - cRect.left;
      fromWidth = cur.width;
    }

    runningAnim = el.animate(
      [
        { transform: `translateX(${fromLeft}px)`, width: `${fromWidth}px` },
        { transform: `translateX(${toLeft}px)`, width: `${toWidth}px` }
      ],
      {
        duration: 350,
        easing: 'cubic-bezier(0.35, 0, 0.25, 1.2)',
        fill: 'forwards'
      }
    );

    runningAnim.onfinish = () => {
      // Persist final values and clear animation handle
      el.style.transform = `translateX(${toLeft}px)`;
      el.style.width = `${toWidth}px`;
      el.style.height = `2px`;
      prevLeft = toLeft;
      prevWidth = toWidth;
      runningAnim = null;
    };

    runningAnim.oncancel = () => {
      runningAnim = null;
    };
  }

  // Trigger indicator update whenever the current route-derived tab id changes
  $: if (currentTabId) moveIndicator();

  // On mount: initial indicator setup and resize listeners
  onMount(() => {
    moveIndicator();

    const ro = new ResizeObserver(() => moveIndicator());
    if (containerEl) ro.observe(containerEl);
    // Observe individual tabs too (labels can wrap on resize)
    Object.values(tabEls).forEach((el) => el && ro.observe(el));

    const onResize = () => { moveIndicator(); };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      if (runningAnim) {
        try { runningAnim.cancel(); } catch {}
        runningAnim = null;
      }
    };
  });
</script>
      }
    };
          el.style.transform = `translateX(${toLeft}px)`;
          el.style.width = `${toWidth}px`;
          el.style.height = `${toHeight}px`;
        class:active={currentTabId === tab.id}
        on:click={() => switchTab(tab.id)}
      >
        <div class="tab-icon">
          <svelte:component this={iconMap[tab.icon]} size="24" />
        </div>
        <span class="tab-label">{tab.label}</span>
      <style>
      .tab-navigation { width: 100%; margin-top: 10vh; margin-bottom: 20px; position: relative; }
      .tab-container { display: grid; grid-template-columns: repeat(3, 1fr); position: relative; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
      .tab { background: transparent; border: none; color: var(--muted-color); padding: 1rem 1.5rem; cursor: pointer; font-family: inherit; font-size: 1.5rem; font-weight: 500; transition: color 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.75rem; letter-spacing: 0.1rem; position: relative; z-index: 1; text-align: center; }
      .tab:hover { color: var(--secondary-text-color); }
      .tab.active { color: var(--primary-text-color); }
      .tab-icon { display: flex; align-items: center; color: var(--muted-color); }
      .tab-label { font-weight: 500; letter-spacing: 0.1rem; }
      .sliding-border { position: absolute; bottom: 0; height: 2px; background: var(--primary-text-color); border-radius: 2px; transform: translateX(0); width: 0; opacity: 0; will-change: transform, width; pointer-events: none; z-index: 0; }
      @media (max-width: 768px) { .tab-container { grid-template-columns: 1fr; } .tab { justify-content: flex-start; padding: 0.75rem 0.75rem 0.75rem 0.5rem; -webkit-appearance: none; appearance: none; } .tab-icon :global(svg) { width: 20px; height: 20px; } }
      @media (max-width: 480px) { .tab { font-size: 1rem; padding: 0.6rem 0.5rem; gap: 0.4rem; } .tab-icon :global(svg) { width: 24px; height: 24px; } }
      </style>
  }
  .tab-icon :global(svg) {
    width: 24px;
    height: 24px;
  }
}
</style>

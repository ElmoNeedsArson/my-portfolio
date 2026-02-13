<script lang="ts">
  import { tabs } from "../lib/navigationStore";
  import { ToyBrick, Pin, MapPin } from "@lucide/svelte";
  import { push, location } from "svelte-spa-router";
  import { onMount, tick } from "svelte";

  const iconMap = { ToyBrick, Pin, MapPin };

  let containerEl: HTMLElement;
  let tabEls: Record<string, HTMLElement> = {};
  let indicatorEl: HTMLElement | null = null;
  let hasInitialized = false;
  let runningAnim: Animation | null = null;
  let prevLeft = 0;
  let prevWidth = 0;

  $: currentTabId =
    $location === "/experiments"
      ? "experiments"
      : $location === "/eindhoven"
        ? "eindhoven"
        : "projects";

  function switchTab(id: string) {
    if (id === "projects") push("/projects");
    else if (id === "experiments") push("/experiments");
    else if (id === "eindhoven") push("/eindhoven");
  }

  async function moveIndicator() {
    await tick();
    const activeEl = tabEls[currentTabId];
    if (!containerEl || !activeEl) return;

    const cRect = containerEl.getBoundingClientRect();
    const tRect = activeEl.getBoundingClientRect();
    const toLeft = tRect.left - cRect.left;
    const toWidth = tRect.width;

    const el =
      indicatorEl ??
      (indicatorEl = containerEl.querySelector(
        ".sliding-border",
      ) as HTMLElement | null);
    if (!el) return;

    const iRect = el.getBoundingClientRect();
    let fromLeft = iRect.width > 0 ? iRect.left - cRect.left : prevLeft;
    let fromWidth = iRect.width > 0 ? iRect.width : prevWidth || toWidth;

    if (!hasInitialized || iRect.width === 0 || el.style.opacity === "0") {
      el.style.opacity = "1";
      el.style.transform = `translateX(${toLeft}px)`;
      el.style.width = `${toWidth}px`;
      el.style.height = "2px";
      hasInitialized = true;
      prevLeft = toLeft;
      prevWidth = toWidth;
      return;
    }

    if (runningAnim) {
      try {
        runningAnim.cancel();
      } catch {}
      const cur = el.getBoundingClientRect();
      fromLeft = cur.left - cRect.left;
      fromWidth = cur.width;
    }

    runningAnim = el.animate(
      [
        { transform: `translateX(${fromLeft}px)`, width: `${fromWidth}px` },
        { transform: `translateX(${toLeft}px)`, width: `${toWidth}px` },
      ],
      {
        duration: 350,
        easing: "cubic-bezier(0.35, 0, 0.25, 1.2)",
        fill: "forwards",
      },
    );

    runningAnim.onfinish = () => {
      el.style.transform = `translateX(${toLeft}px)`;
      el.style.width = `${toWidth}px`;
      el.style.height = "2px";
      prevLeft = toLeft;
      prevWidth = toWidth;
      runningAnim = null;
    };
    runningAnim.oncancel = () => {
      runningAnim = null;
    };
  }

  $: if (currentTabId) moveIndicator();

  onMount(() => {
    moveIndicator();
    const ro = new ResizeObserver(() => moveIndicator());
    if (containerEl) ro.observe(containerEl);
    Object.values(tabEls).forEach((el) => el && ro.observe(el));
    const onResize = () => moveIndicator();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (runningAnim)
        try {
          runningAnim.cancel();
        } catch {}
    };
  });
</script>

<nav class="tab-navigation">
  <div class="tab-container" bind:this={containerEl}>
    {#each tabs as tab (tab.id)}
      <button
        bind:this={tabEls[tab.id]}
        class="tab"
        class:active={currentTabId === tab.id}
        on:click={() => switchTab(tab.id)}
      >
        <div class="tab-icon">
          <svelte:component this={iconMap[tab.icon]} size="24" />
        </div>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
    <div class="sliding-border"></div>
  </div>
</nav>

<style>
  .tab-navigation {
    width: 100%;
    margin-top: 10vh;
    margin-bottom: 20px;
    position: relative;
  }
  
  .tab-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    position: relative;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tab {
    background: transparent;
    border: none;
    color: var(--muted-color);
    padding: 1rem 1.5rem;
    cursor: pointer;
    font: inherit;
    font-size: 1.5rem;
    font-weight: 500;
    transition: color 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    letter-spacing: 0.1rem;
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .tab:hover {
    color: var(--secondary-text-color);
  }

  .tab.active {
    color: var(--primary-text-color);
  }

  .tab-icon {
    display: flex;
    align-items: center;
    color: var(--muted-color);
  }

  .tab-label {
    font-weight: 500;
    letter-spacing: 0.1rem;
  }

  .sliding-border {
    position: absolute;
    bottom: 0;
    height: 2px;
    background: var(--primary-text-color);
    border-radius: 2px;
    transform: translateX(0);
    width: 0;
    opacity: 0;
    will-change: transform, width;
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 768px) {
    .tab-container {
      grid-template-columns: 1fr;
    }

    .tab {
      justify-content: flex-start;
      padding: 0.75rem 0.75rem 0.75rem 0.5rem;
      font-size: 1.3rem;
    }
  }
  
  @media (max-width: 480px) {
    .tab {
      font-size: 1.1rem;
    }
  }
</style>

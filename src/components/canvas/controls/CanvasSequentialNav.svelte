<script lang="ts">
  import { ArrowLeft, ArrowRight } from "@lucide/svelte";

  export let canNavigatePrevious = false;
  export let canNavigateNext = false;
  export let onPrevious: () => void;
  export let onNext: () => void;
</script>

<div class="canvas-sequential-nav">
  <button
    class="canvas-action-button canvas-sequential-nav-button"
    on:click={onPrevious}
    on:mousedown|stopPropagation
    on:touchstart|stopPropagation
    type="button"
    aria-label="Go to previous card"
    title="Previous card"
    disabled={!canNavigatePrevious}
  >
    <ArrowLeft size={22} strokeWidth={2.8} />
  </button>

  <button
    class="canvas-action-button canvas-sequential-nav-button"
    on:click={onNext}
    on:mousedown|stopPropagation
    on:touchstart|stopPropagation
    type="button"
    aria-label="Go to next card"
    title="Next card"
    disabled={!canNavigateNext}
  >
    <ArrowRight size={22} strokeWidth={2.8} />
  </button>
</div>

<style>
  .canvas-action-button {
    z-index: 10;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--hover-color);
    backdrop-filter: blur(10px);
    color: var(--primary-text-color);
    font-size: 0.85rem;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .canvas-action-button:hover {
    background: var(--secondary-background-color);
    border-color: var(--secondary-text-color);
  }

  .canvas-sequential-nav {
    position: absolute;
    left: 50%;
    bottom: 1.25rem;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .canvas-sequential-nav-button {
    width: 3rem;
    height: 3rem;
    padding: 0;
    border-radius: 50%;
    justify-content: center;
    box-shadow: 0 10px 28px color-mix(in srgb, var(--canvas-card-shadow) 85%, transparent);
    border: 1px solid var(--border-color);
    background: var(--secondary-background-color);
    backdrop-filter: blur(10px);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.2s ease, background 0.2s ease;
  }

  .canvas-sequential-nav-button:hover {
    transform: translateY(-1px) scale(1.03);
    box-shadow: 0 14px 34px color-mix(in srgb, var(--canvas-card-shadow) 95%, transparent);
  }

  .canvas-sequential-nav-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    border-color: var(--border-color);
    box-shadow: none;
    transform: none;
  }

  .canvas-sequential-nav-button:disabled:hover {
    background: var(--hover-color);
    border-color: var(--border-color);
  }
</style>

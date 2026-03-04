<script lang="ts">
  import { X, Moon, Sun, FileText } from "@lucide/svelte";

  export let isCanvasDarkMode = false;
  export let onToggleWordCount: () => void;
  export let onToggleDarkMode: () => void;
  export let onClose: () => void;
</script>

<div class="canvas-top-actions">
  <button
    class="canvas-action-button word-count"
    on:click={onToggleWordCount}
    type="button"
    aria-label="Show canvas word count"
    title="Show canvas word count"
  >
    <FileText size={18} />
    Words
  </button>

  <button
    class="canvas-action-button theme-toggle"
    on:click={onToggleDarkMode}
    type="button"
    aria-label="Toggle day and night mode"
    title="Toggle day and night mode"
  >
    {#if isCanvasDarkMode}
      <Sun size={20} />
    {:else}
      <Moon size={20} />
    {/if}
  </button>

  <button
    class="canvas-action-button close"
    on:click={onClose}
    type="button"
    aria-label="Close fullscreen canvas"
  >
    <X size={20} />
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

  .canvas-action-button.close {
    padding: 0.5rem;
  }

  .canvas-action-button.theme-toggle {
    padding: 0.5rem;
  }

  .canvas-action-button.word-count {
    padding: 0.5rem 0.75rem;
  }

  .canvas-top-actions {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 10;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
  }

  .canvas-top-actions .canvas-action-button {
    position: static;
    z-index: auto;
  }
</style>

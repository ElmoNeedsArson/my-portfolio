<script lang="ts">
  import { Maximize2 } from "@lucide/svelte";

  export let onClick: () => void;
</script>

<button class="canvas-action-button enlarge" on:click={onClick} type="button">
  <Maximize2 size={16} />
  Enlarge
</button>

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

  .canvas-action-button.enlarge {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    animation: enlargePulse 1.8s ease-in-out infinite;
  }

  @keyframes enlargePulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(249, 103, 67, 0.45);
    }
    65% {
      transform: scale(1.06);
      box-shadow: 0 0 0 14px rgba(249, 103, 67, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(249, 103, 67, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .canvas-action-button.enlarge {
      animation: none;
    }
  }
</style>

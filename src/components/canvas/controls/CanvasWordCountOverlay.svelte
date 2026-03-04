<script lang="ts">
  import type { WordCountStats } from "../infiniteCanvasTypes";

  export let nonCaptionNonTitleWordTotal = 0;
  export let wordCountStats: WordCountStats;
</script>

<div class="word-count-overlay" role="status" aria-live="polite">
  <h4>Canvas Word Count</h4>
  <p class="word-count-total">
    Total (excluding captions and titles): {nonCaptionNonTitleWordTotal}
  </p>
  <div class="word-count-details">
    <p>Titles: {wordCountStats.titleWords}</p>
    <p>Image captions ({wordCountStats.captionCount}): {wordCountStats.captionWords}</p>
  </div>
</div>

<style>
  .word-count-overlay {
    position: absolute;
    top: 5rem;
    right: 3rem;
    z-index: 1001;
    min-width: 260px;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--background-color);
    color: var(--primary-text-color);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
  }

  .word-count-overlay h4 {
    margin: 0 0 0.6rem 0;
    font-size: 0.9rem;
    letter-spacing: 0.02em;
  }

  .word-count-overlay p {
    margin: 0.35rem 0;
    font-size: 0.88rem;
    line-height: 1.35;
  }

  .word-count-total {
    display: inline-block;
    border-bottom: 1px solid color-mix(in srgb, var(--muted-color) 35%, transparent);
    padding-bottom: 0.45rem;
    margin-bottom: 0.35rem;
  }

  .word-count-details {
    display: block;
    width: fit-content;
    padding-top: 0.1rem;
  }
</style>

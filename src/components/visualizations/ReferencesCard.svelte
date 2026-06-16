<script lang="ts">
  import { citedSources } from "../../lib/citationStore";
</script>

{#if $citedSources.length === 0}
  <p class="no-refs">No sources cited yet.</p>
{:else}
  <ol class="reference-list">
    {#each $citedSources as source, i}
      <li class="reference-item">
        <span class="ref-num">[{i + 1}]</span>
        <span class="ref-body">
          {@html source.formatted}
          {#if source.url}
            <a href={source.url} target="_blank" rel="noopener noreferrer" class="ref-link">{source.url}</a>
          {/if}
        </span>
      </li>
    {/each}
  </ol>
{/if}

<style>
  .reference-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .reference-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    align-items: baseline;
  }

  .reference-item:last-child {
    border-bottom: none;
  }

  .ref-num {
    flex-shrink: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    min-width: 2rem;
    line-height: 1.6;
  }

  .ref-body {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--primary-text-color);
    opacity: 0.88;
  }

  .ref-link {
    margin-left: 0.25rem;
    color: var(--secondary-text-color);
    text-decoration: none;
    font-size: 0.9rem;
    word-break: break-all;
    transition: opacity 0.15s;
  }

  .ref-link:hover {
    text-decoration: underline;
  }

  .no-refs {
    color: var(--muted-color);
    font-style: italic;
    font-size: 0.9rem;
  }
</style>

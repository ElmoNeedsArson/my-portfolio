<script lang="ts">
  export let sections = [];

  let isExpanded = false;

  function toggleOutline() {
    isExpanded = !isExpanded;
  }

  function scrollToSection(element: HTMLElement) {
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top + window.scrollY;
      
      // Different offsets based on section
      const sectionId = element.closest('section')?.id;
      let offset = 40; // Default offset for later sections
      
      if (sectionId === 'professional-identity') {
        offset = 180; // Larger offset for first section to account for sticky header
      }
      
      window.scrollTo({
        top: elementTop - offset,
        behavior: "smooth"
      });
    }
  }

  function handleSectionClick(sectionId: HTMLElement) {
    console.log(`Scrolling to section: ${sectionId}`);
    scrollToSection(sectionId);
  }
</script>

<div class="outline-container" class:expanded={isExpanded}>
  <button class="outline-toggle" on:click={toggleOutline}>
    <span class="outline-header">
      {#if isExpanded}
        <span class="expand-icon">▼</span>
        Outline
      {:else}
        <span class="expand-icon">▶</span>
        Outline ({sections.length} sections)
      {/if}
    </span>
  </button>

  {#if isExpanded}
    <nav class="outline-content">
      <ul class="section-list">
        {#each sections as section}
          <li class="section-item level-{section.level}">
            <button
              class="section-link"
              on:click={() => handleSectionClick(section.element)}
            >
              {section.title}
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</div>

<style>
  .outline-container {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    background: transparent;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    box-shadow: none;
    width: 100%;
    max-height: none;
    overflow: visible;
    transition: all 0.3s ease;
    z-index: 100;
  }

  .outline-container.expanded {
    min-height: 100px;
  }

  .outline-toggle {
    width: 100%;
    background: none;
    border: none;
    padding: 1rem;
    cursor: pointer;
    font-family: inherit;
    color: var(--primary-text-color);
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .outline-toggle:hover {
    background: var(--hover-color, rgba(0, 0, 0, 0.05));
  }

  .outline-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .expand-icon {
    font-size: 0.8rem;
    transition: transform 0.2s ease;
    color: var(--muted-color, #666);
  }

  .outline-content {
    border-top: 1px solid var(--border-color, #ddd);
    padding: 0.5rem 0;
    width: 100%;
    overflow: hidden;
  }

  .section-list {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
  }

  .section-item {
    margin: 0;
    width: 100%;
  }

  .section-link {
    width: 100%;
    background: none;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-family: inherit;
    color: var(--primary-text-color);
    text-align: left;
    font-size: 0.9rem;
    line-height: 1.4;
    transition: background-color 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }

  .section-link:hover {
    background: var(--hover-color, rgba(0, 0, 0, 0.05));
  }

  .section-link:active {
    background: var(--active-color, rgba(0, 0, 0, 0.1));
  }

  .level-1 .section-link {
    font-weight: 500;
  }

  .level-2 .section-link {
    padding-left: 1.5rem;
    font-weight: normal;
    color: var(--muted-color, #666);
  }

  /* Responsive design */
  @media (max-width: 1200px) {
    .outline-container {
      /* right: 1rem; */
      max-width: 250px;
    }
  }

  @media (max-width: 768px) {
    .outline-container {
      display: none;
      position: relative;
      top: auto;
      right: auto;
      transform: none;
      margin: 1rem 0;
      width: 100%;
      max-width: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .outline-container {
      background: var(--background-color);
      border-color: var(--border-color, #444);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
</style>

<script lang="ts">
  import type { Project, ContentBlock } from "../types";

  export let project: Project;
  // Optional: override which content to outline (useful for tabbed content)
  export let contentOverride: ContentBlock | undefined = undefined;

  let isExpanded = false;

  interface OutlineSection {
    id: string;
    title: string;
    level: number; // 1 for main sections, 2 for subsections
  }

  // Extract sections from the project content or override
  $: sections = extractSections(project, contentOverride);

  function extractSections(project: Project, override?: ContentBlock): OutlineSection[] {
    const sections: OutlineSection[] = [];
    const content = override ?? project.content;
    if (!content) return sections;

    // Add overview if it exists
    if (content.overview?.trim()) {
      sections.push({
        id: "overview",
        title: "Overview",
        level: 1,
      });
    }

    // Add key features if they exist
    if (content.keyFeatures?.length > 0) {
      sections.push({
        id: "key-features",
        title: "Key Features",
        level: 1,
      });
    }

    // Add content sections
    content.sections.forEach((section, index) => {
      if (section.title?.trim()) {
        sections.push({
          id: `section-${index}`,
          title: section.title,
          level: 1,
        });
      }
      if (section.subtitle?.trim()) {
        sections.push({
          id: `section-subtitle-${index}`,
          title: section.subtitle,
          level: 2,
        });
      }
    });

    return sections;
  }

  function toggleOutline() {
    isExpanded = !isExpanded;
  }

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }

  function handleSectionClick(sectionId: string) {
    scrollToSection(sectionId);
  }
</script>

{#if sections.length !=0}
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
              on:click={() => handleSectionClick(section.id)}
            >
              {section.title}
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</div>
{/if}

<style>
  .outline-container {
    position: fixed;
    top: 50%;
    right: 2rem;
    transform: translateY(-50%);
    background: var(--background-color);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    max-width: 300px;
    max-height: 70vh;
    overflow-y: auto;
    transition: all 0.3s ease;
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
  }

  .section-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .section-item {
    margin: 0;
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
      right: 1rem;
      max-width: 250px;
    }
  }

  @media (max-width: 768px) {
    .outline-container {
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

<script lang="ts">
  import { params, link } from "svelte-spa-router";
  import type { Project } from "../types";
  import Header from "../components/header.svelte";
  import Footer from "../components/footer.svelte";
  import { navigateToSearch } from "../lib/searchNavigation";
  import { findProjectBySlug } from "../lib/searchUtils";
  import { getCategoryById } from "../lib/searchCategories";

  // Reactive slug value derived from the router params. `$params` is provided
  // by svelte-spa-router and is reactive.
  let slug: string = "";
  $: slug = $params?.slug ?? "";

  // Reactive project lookup using the shared utility function
  let project: Project | undefined;
  $: project = findProjectBySlug(slug);

  // Get category icons
  const languagesCategory = getCategoryById("languages");
  const toolsCategory = getCategoryById("tools");
  const tagsCategory = getCategoryById("tags");

  function getSrc(img: string | { src?: string } | undefined) {
    if (!img) return undefined;
    return typeof img === "string" ? img : img.src;
  }

  function getAlt(img: string | { alt?: string } | undefined, fallback = "") {
    if (!img) return fallback;
    return typeof img === "string" ? fallback : (img.alt ?? fallback);
  }

  function getCaption(img: string | { caption?: string } | undefined) {
    if (!img || typeof img === "string") return undefined;
    return img.caption;
  }

  function getGalleryData(
    gallery:
      | string[]
      | { src: string }[]
      | { images: any[]; caption?: string }
      | undefined,
  ) {
    if (!gallery) return { images: [], caption: undefined };
    if (Array.isArray(gallery)) return { images: gallery, caption: undefined };
    if ("images" in gallery) return gallery;
    return { images: [], caption: undefined };
  }

  /**
   * Handle clicks on tags, languages, or tools to show related projects
   */
  function handleTagClick(tag: string) {
    navigateToSearch(tag, "tags");
  }

  function handleLanguageClick(language: string) {
    navigateToSearch(language, "languages");
  }

  function handleToolClick(tool: string) {
    navigateToSearch(tool, "tools");
  }

  /**
   * Process text with HTML links and convert line breaks
   * Allows direct HTML <a> tags in JSON content while preserving line breaks
   */
  function renderTextWithLinks(text: string): string {
    // Convert \n line breaks to <br> tags for proper display
    return text.replace(/\n/g, "<br>");
  }
</script>

<Header />
<main>
  {#if project}
    <!-- Project detail layout. Renders when a matching project is found. -->
    <article class="project-page">
      <!-- Back link to the list page -->
      <a href="/" class="back" use:link>← Back</a>
      <h1>{project.title}</h1>
      <p class="date">{project.date}</p>

      <!-- Project hero image (uses the default thumbnail) -->
      <div class="thumbnail">
        <img
          src={getSrc(project.thumbnail)}
          alt={getAlt(project.thumbnail, project.title)}
        />
        {#if getCaption(project.thumbnail)}
          <p class="caption">{getCaption(project.thumbnail)}</p>
        {/if}
      </div>

      <!-- Tag list -->
      {#if project.tags.length > 0}
        <div class="tags">
          {#each project.tags as tag}
            <button class="tag" on:click={() => handleTagClick(tag)}>
              <svelte:component this={tagsCategory.icon} size="14" />
              {tag}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Languages and Tools -->
      {#if project.languages.length > 0 || project.tools.length > 0}
        <div class="meta-info">
          <div class="languages">
            {#if project.languages.length > 0}
              <h3>Languages</h3>
              <div class="chips">
                {#each project.languages as language}
                  <button
                    class="chip language-chip"
                    on:click={() => handleLanguageClick(language)}
                  >
                    <svelte:component this={languagesCategory.icon} size="16" />
                    {language}
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <div class="tools">
            {#if project.tools.length > 0}
              <h3>Tools</h3>
              <div class="chips">
                {#each project.tools as tool}
                  <button
                    class="chip tool-chip"
                    on:click={() => handleToolClick(tool)}
                  >
                    <svelte:component this={toolsCategory.icon} size="16" />
                    {tool}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Content sections: overview, key features, and any additional sections -->
      <div class="content">
        <div class="overview-text">
          {@html renderTextWithLinks(project.content.overview)}
        </div>

        {#if project.content.keyFeatures.length > 0}
          <h2>Key Features</h2>
          <ul class="features">
            {#each project.content.keyFeatures as feature}
              <li>{feature}</li>
            {/each}
          </ul>
        {/if}

        {#each project.content.sections as section}
          <h2>{section.title}</h2>

          {#if section.text}
            <div class="section-text">
              {@html renderTextWithLinks(section.text)}
            </div>
          {/if}

          {#if section.image}
            <div class="image-container">
              <img
                src={getSrc(section.image)}
                alt={getAlt(section.image, section.title)}
              />
              {#if getCaption(section.image)}
                <p class="caption">{getCaption(section.image)}</p>
              {/if}
            </div>
          {/if}

          {#if section.gallery}
            {@const galleryData = getGalleryData(section.gallery)}
            <div class="gallery">
              {#each galleryData.images as img}
                <div class="gallery-item">
                  <img src={getSrc(img)} alt={getAlt(img, section.title)} />
                  {#if getCaption(img)}
                    <p class="caption">{getCaption(img)}</p>
                  {/if}
                </div>
              {/each}
              {#if galleryData.caption}
                <p class="gallery-caption">{galleryData.caption}</p>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </article>
  {:else}
    <!-- Shown when no project matches the current slug -->
    <p>Project not found.</p>
  {/if}
</main>
<Footer />

<style>
  main {
    background-color: var(--background-color);
    color: var(--primary-text-color);
    padding: 1px;
  }

  .project-page {
    max-width: 55%;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  img {
    max-width: 100%;
  }

  .back {
    display: inline-block;
    margin-bottom: 2rem;
    color: inherit;
    text-decoration: none;
  }

  .date {
    color: var(--muted-color);
    font-size: 0.9rem;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .tag {
    background: transparent;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    outline: var(--border-color) 1px solid;
    border: none;
    color: var(--primary-text-color);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    align-items: center;
    display: flex;
    gap: 4px;
  }

  .meta-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin: 2rem 0;
  }

  .languages,
  .tools {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .languages h3,
  .tools h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--secondary-text-color);
    font-weight: 600;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip {
    background: var(--secondary-background-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    color: var(--primary-text-color);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  @media (hover: hover) {
    /* hover styles only for non-touch devices */
    .tag:hover {
      background: var(--hover-color);
      transform: translateY(-1px);
    }

    .chip:hover {
      background: var(--hover-color);
      border-color: var(--secondary-text-color);
      transform: translateY(-1px);
    }

    .language-chip:hover {
      border-color: #61dafb; /* Blue for languages */
    }

    .tool-chip:hover {
      border-color: #ff6b35; /* Orange for tools */
    }
  }

  @media (max-width: 768px) {
    .meta-info {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .content {
    /* margin-top: 2rem; */
    line-height: 1.6;
  }

  .overview-text {
    font-size: 1.1rem;
    color: var(--muted-color);
    margin-bottom: 2rem;
  }

  .section-text {
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  /* Style for links within text content */
  .overview-text :global(a),
  .section-text :global(a) {
    color: var(--secondary-text-color);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
  }

  .overview-text :global(a:hover),
  .section-text :global(a:hover) {
    border-bottom-color: var(--secondary-text-color);
  }

  /* Ensure paragraphs from markdown have proper spacing */
  .overview-text :global(p),
  .section-text :global(p) {
    margin: 1rem 0;
  }

  .overview-text :global(p:first-child),
  .section-text :global(p:first-child) {
    margin-top: 0;
  }

  .overview-text :global(p:last-child),
  .section-text :global(p:last-child) {
    margin-bottom: 0;
  }

  h2 {
    margin: 2rem 0 1rem;
    font-size: 1.5rem;
  }

  .features {
    list-style: disc;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  .features li {
    margin: 0.5rem 0;
  }

  .gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
  }

  .gallery-item {
    max-width: 200px;
    width: 100%;
  }

  .gallery img {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 6px;
  }

  .caption {
    font-size: 0.9rem;
    color: var(--muted-color);
    margin-top: 0.5rem;
    text-align: center;
  }

  .gallery-caption {
    width: 100%;
    text-align: center;
    margin-top: 1rem;
    font-style: italic;
    color: var(--muted-color);
  }

  .image-container {
    margin: 1rem 0;
  }
</style>
